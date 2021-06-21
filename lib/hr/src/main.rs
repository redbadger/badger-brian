use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use async_std::task;
use std::env;
use tide::{http::mime, Body, Response, StatusCode};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
use async_graphql::Object;
use opentelemetry_tide::OpenTelemetryTracingMiddleware;

#[derive(Clone)]
struct AppState {
    schema: Schema<QueryRoot, EmptyMutation, EmptySubscription>,
}

fn main() -> Result<()> {
    task::block_on(run())
}

async fn run() -> Result<()> {
    let host_and_port =
        env::var("LISTEN_HOST_AND_PORT").unwrap_or_else(|_| "0.0.0.0:3000".to_owned());

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();

    println!("Playground: http://{}", host_and_port);

    let mut app = tide::new();

    app.at("/graphql")
        .post(async_graphql_tide::endpoint(schema));

    app.at("/").get(|_| async move {
        let mut resp = Response::new(StatusCode::Ok);
        resp.set_body(Body::from_string(playground_source(
            GraphQLPlaygroundConfig::new("/graphql"),
        )));
        resp.set_content_type(mime::HTML);
        Ok(resp)
    });

    app.at("/ping").get(|_| async move {
        let mut resp = Response::new(StatusCode::Ok);
        resp.set_body("pong");
        resp.set_content_type(mime::PLAIN);
        Ok(resp)
    });

    // Hook up `opentelemetry_zipkin` to take opentelemetry traces
    // and send them to zipkin in batches.
    // Dapr provides a zipkin service on localhost:9411 by default,
    // so this bit does not need to be configured.
    let tracer = opentelemetry_zipkin::new_pipeline()
        .with_service_name("hr-rs")
        .install_batch(opentelemetry::runtime::AsyncStd)?;

    // Dapr injects w3c's `traceparent` header. Register a global TraceContextPropagator,
    // which knows how to fish this out from http headers, and propagate it as a tracing context
    // (there are a bunch of competing formats, so we have to specify this ourselves).
    opentelemetry::global::set_text_map_propagator(
        opentelemetry::sdk::propagation::TraceContextPropagator::new(),
    );

    // Hook up a middleware to make tracing spans for incoming requests, and send them to zipkin.
    // This will also extract headers from incoming requests, and use the global propagator
    // (TraceContextPropagator, above) to make sure it's possible to correlate them with upstream
    // requests.
    app.with(OpenTelemetryTracingMiddleware::new(tracer));

    app.listen(host_and_port).await?;

    Ok(())
}

pub struct QueryRoot;

pub struct Human(String);

#[Object]
impl Human {
    /// The id of the human.
    async fn id(&self) -> &str {
        &self.0
    }

    /// The name of the human.
    async fn name(&self) -> &str {
        if self.0 == "david.wynne@red-badger.com" {
            "David Wynne"
        } else {
            "Milo Castro"
        }
    }

    /// The manager of the human.
    async fn manager(&self) -> Human {
        Human("david.wynne@red-badger.com".to_string())
    }
}

#[Object]
impl QueryRoot {
    async fn human(&self, #[graphql(desc = "id of the human")] id: String) -> Option<Human> {
        Some(Human(id))
    }
}
