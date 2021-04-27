# Project Aims / Outcomes

## Aims 

The aim of the project is to decide whether Dapr is a worthwhile technology to pursue. Whether it gives us more than it takes away. How it compares to similar technologies such as Istio / linkerd.

### Does it give more than it takes away

The 'take' mostly relates to how difficult it is to setup and maintain, which we are getting a good feel of with this project (there is a learning curve, but its easy to set up).

The 'give' has more facets, such as
  - Can Dapr remove some of the layers of the Onion architecture in our Apis, allowing them to be simpler
  - Retries
  - Logging / observability / distributed tracing
  - Service discovery / name resolution
  - Access / authorization policies
  - Load Balancing

### Comparison to other technologies

  - Comparatively, how easy is it to set up 
  - How compelling are features unique to Dapr (probably bindings, actors, state management, secret management, pub / sub)
  - How compelling are features missing in Dapr  (probably content filtering, traffic splitting, trafic routing)
  - How do common features compare (distributed tracing, service discovery, mTls, Retry, Load Balancing, Metrics)

## Outcomes

### Does it give more than it takes away

#### Setup

This project is giving us a good feel for what is invovled with setting up Dapr. There is a learning curve, but its easy to set up.

#### Can Dapr remove layers of the Onion

The Hr Api doesn't is just a GraphQl adapter to Hr data, doesn't currently have and business logic, and isn't a good candidate for onion architecture.

TODO: The slack webhook endpoint should be refactored to use the [Onion architecture](https://github.com/StuartHarris/onion). Some candidates for the various layers of the onion are:
  - Validation of the incoming data (the slack message should have a user name (such as '@cedd.burge') and nothing else
  - Formatting / creation of text of slack message reply (such as 'The manager of @cedd.burge is David Wynne')
  - Conversion of slack handle (such as '@cedd.burge') into an id that the hr system accepts (such as 'cedd.burge@red-badger.com' or similar). This might possible with a pure text transformation, or it might need a lookup or similar.
  - Retrieving the data of interest from the slack webhook request payload
  - Calling the Hr Api

TODO: Maybe do a slack binding. This might be tricky, as there doesn't seem to be any documentation on custom bindings, so maybe they aren't possible yet. The [code for the twitter binding](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/service-invocation-overview/#round-robin-load-balancing-with-mdns) is short and simple though.

#### Retries

The setup currently uses Dapr for all communication, and so will bebenefit from [Dapr's Retry functionality](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/service-invocation-overview/#retries) (selected failures only, up to 3 retries, 1 second apart, no exponential back off at the moment).

TODO: Maybe simulate occassionaly failures for one of both of the Apis and check that everything still works as expected

#### Logging / observability / distributed tracing

Dapr is already logging itself with the current setup, and the logs can be easily seen using the Dapr Dashboard. This is not set up on the cluster yet, but can be shown by setting the cluster as the current k8s context, and then 'dapr dashboard -k'

TODO: [Add ZipKin to the setup](https://docs.dapr.io/operations/monitoring/tracing/setup-tracing/#zipkin-in-kubernetes-mode) for distributed tracing. Other tools (such as grafana) can also be integrated, but ZipKin looks like the easiest.

TODO: Maybe add other logging / observability tools to compare.

#### Service discovery / name resolution

Services are invoked using their namespace and name (such as 'http://localhost:${daprPort}/v1.0/invoke/hr.hr/method/graphql'), which works well and avoids transient Ip addresses. Dapr initialises the '${daprPort}' environment variable for us.

#### Access / authorization policies

TODO

Authorization will be required as the slack webhook endpoint probably needs to be public, but the Hr data is identifiable and sensitive. 

#### Load Balancing

The setup currently uses Dapr for all communication, and so will bebenefit from [Dapr's Round Robin Load Balancing functionality](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/service-invocation-overview/#round-robin-load-balancing-with-mdns).

TODO: Verify that this is working as expected

### Comparison to other technologies

TODO
