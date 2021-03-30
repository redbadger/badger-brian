use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use async_std::task;
use std::env;
use tide::{http::mime, Body, Response, StatusCode};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
use async_graphql::Object;

#[derive(Clone)]
struct AppState {
    schema: Schema<QueryRoot, EmptyMutation, EmptySubscription>,
}

fn main() -> Result<()> {
    task::block_on(run())
}

async fn run() -> Result<()> {
    let listen_addr = env::var("LISTEN_ADDR").unwrap_or_else(|_| "localhost:8000".to_owned());

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();

    println!("Playground: http://{}", listen_addr);

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

    app.listen(listen_addr).await?;

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
