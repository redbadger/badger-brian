# badger-brian

Dapr(y) version of Badger Brain

_This repo is public — Please do not commit any secrets!_

---

Currently, this repository is just a playground for Badgers to try out [Dapr](https://dapr.io) in a real world scenario.

We'll be gradually building up a version of [Badger Brain](https://github.com/redbadger/badger-brain), using Dapr, but obviously there's nothing production ready about any of this (yet)! 👀

---

We are recording architectural decisions as we go, using [Lightweight Architecture Decision Records (ADRs)](https://adr.github.io/) — you can read them [here](docs/adr/).

---

## Monorepo Structure

### `/lib`

This is where our services live, any service in here will be run by the
[CI](#ci) and will eventually be deployed on our k8s cluster.

### `/manifests`

This is effectively our gitops directory. It contains manifests for k8s and dapr
which will be applied to the cluster on push/merge to master.

## CI

To allow the CI to run on your service you'll need to set up a few things:

- A `Dependencies` file to your service root, this is used by
  [monobuild](https://github.com/charypar/monobuild) to build a dependency graph
- A `Dockerfile` so that your service can be built and distributed
- A directory of manifests for our k8s instance under
  `/manifests/<SERVICE_NAME>` so the CI can update the image digest to the
  latest version

The CI uses [monobuild](https://github.com/charypar/monobuild) to create a
dependency graph for our services and then creates a matrix of services and
dependant services to build/deploy.

There are three steps to the CI workflow:

1. Gets the services that have been updated and builds the dependency map for
   what needs to be run
2. Builds and deploys docker images from the services
3. Updates the manifests of the services using
   [kustomize](https://kustomize.io/) to updating the image digest in the
   service's respective `/manifests/<SERVICE_NAME>/kustomization.yaml` file
   (only run on master currently - unless we want to add overlays/multiple envs)
   and then pushes those changes to master.
   - We avoid an infinite loop of actions being run as the `deploy` job has a
     condition that a service must have been updated to run. The `deploy` job
     doesn't update any services, only manifests, so the push from the `deploy`
     job will never run another `deploy` job.

## Running on local Dapr Instance

Make sure Docker is running (kubernetes is not required)

Start Dapr locally

```
dapr init
```

Run the Slack and Hr Api's. The Slack Api will hot reload.

```
cd lib/slack
dapr run --app-id slack --app-port 3001 yarn dev
```

```
cd lib/hr
dapr run --app-id hr --app-port 3000 cargo run
```

Check Dapr can invoke the Hr ping endpoint (3500 will need to be replaced with the port number of a dapr sidecar, which can be found in the output of `dapr run` or with `netstat -an -ptcp | grep LISTEN`)

```
curl http://localhost:3500/v1.0/invoke/hr.hr/method/ping
```

Check that the Slack Api can communicate with the Hr Api via Dapr

```
curl http://localhost:3001/cedd/manager
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @lib/slack/exampleRequest.txt  http://localhost:3500/v1.0/invoke/slack.slack/method/getManager
```

Check that the Dapr Cli can invoke the Hr ping endpoint

```
dapr invoke --app-id hr --method ping
```

You can also use ngrok or similar to expose the endpoint to the internet and then edit the slack [slash command](https://api.slack.com/apps/A01SHH2QF8S/slash-commands) to point at it.
TODO: update instructions when the slack integration is live / in use, probably by creating a test_get_manager slash command.

## Running on local kubernetes

It is easiest to use the 'docker-desktop' local k8s cluster.

Initialize Dapr on the cluster (https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)

```bash
dapr init -k
```

Create the things. The version of Kustomize inside kubectl is quite old, so we need to use kustomize directly. [Install](https://kubectl.docs.kubernetes.io/installation/kustomize/) with `brew install kustomize`. This works when using the "docker-desktop" k8s cluster, if you are using minikube you will probably need to [set the docker daemon](https://stackoverflow.com/questions/42564058/how-to-use-local-docker-images-with-minikube)

```bash
docker build --progress=plain -t slack:latest ./lib/slack
docker build --progress=plain -t hr:latest ./lib/hr
kustomize build "./manifests/overlays/development/"  | kubectl apply -f -
```

Check kubernetes resources are running

```bash
kubectl get pods --all-namespaces
```

Check the endpoints work. 'hello' should return world directly. 'ping' should talk to the Hr Api over dapr, and return 'Response from hr api: pong'

```
curl http://localhost/hello
curl http://localhost/ping
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @lib/slack/exampleRequest.txt  http://localhost/getManager
```

Install the nginx ingress controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx -f ./manifests/ingress-controller.yaml -n default
```

Install the ingress rules. These forward to the Dapr sidecar of the ingress controller above, which is called "nginx-ingress-dapr" ("-dapr" is added to the names of things to form the sidecar name)

```bash
kubectl apply -f ./manifests/ingress.yaml
```

Call the Slack API via Dapr. The external IP address of the ingress controller can be found from `kubectl get services --all-namespaces`. **slack**.slack is from `dapr.io/app-id` in deployment.yaml and slack.**slack** is the namespace that the deployment is in. The localhost binding for the ingress controller clashes with the localhost binding for the slack service, so this slack/service.yaml needs to be applied to the cluster with spec.type changed from LoadBalancer to ClusterIP before this will work.

```
curl http://localhost/v1.0/invoke/slack.slack/method/ping
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @lib/slack/exampleRequest.txt  http://localhost/v1.0/invoke/slack.slack/method/getManager
```

You can also use ngrok or similar to expose the endpoint to the internet and then edit the slack [slash command](https://api.slack.com/apps/A01SHH2QF8S/slash-commands) to point at it.
TODO: update instructions when the slack integration is live / in use, probably by creating a test_get_manager slash command.

## Running on hosted kubernetes

These instructions assume that the docker images for the Slack and Hr Api's already exist on the GitHub Container Registry. This happens as part of the build, so will be the case unless something gets out of date.

Create a Kubernetes cluster

```bash
gcloud container clusters create dapr --num-nodes=3
```

Initialize Dapr on the cluster (https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)

```bash
dapr init -k
```

Create the namespaces (TODO: the namespaces make the deployment / instructions more complicated, have a think about whether they are warranted at some point, and remove if necessary)

```bash
kubectl apply -f ./manifests/namespaces/hr.yaml
kubectl apply -f ./manifests/namespaces/slack.yaml
```

Install the zipkin distributed tracing (TODO: could write a manisfest for this)

```
kubectl create deployment zipkin --image openzipkin/zipkin
kubectl expose deployment zipkin --type LoadBalancer --port 9411
kubectl apply -f manifests/zipkin-configuration.yaml
```

Create the secrets to authenticate with the GitHub Container Registry (a production secret management solution is not decided yet, see [issue 12](https://github.com/redbadger/badger-brian/issues/12) for details)

1. Better Option. This didn't work for Cedd, although it is straight from the docs. Use github username and a token with container registry access as the password for `docker login`. Replace `/users/ceddburge/.docker/config.json` with your value.

```bash
docker login https://ghcr.io
kubectl create secret generic github-container-registry-slack \
    --from-file=.dockerconfigjson=/users/ceddburge/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson \
    --namespace slack
kubectl create secret generic github-container-registry-hr \
    --from-file=.dockerconfigjson=/users/ceddburge/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson \
    --namespace hr
```

2. Slightly less secure option. This did work for Cedd, but is slightly less secure, as the token / password is saved in your terminal history. Replace `<github username>`, `<token with container registry access>` and `<email address>` with your values.

```bash
kubectl create secret docker-registry github-container-registry \
    --docker-username=<github username> \
    --docker-password=<token with container registry access> \
    --docker-server=ghcr.io \
    --docker-email=<email address> \
    --namespace=slack

kubectl create secret docker-registry github-container-registry \
    --docker-username=<github username> \
    --docker-password=<token with container registry access> \
    --docker-server=ghcr.io \
    --docker-email=<email address> \
    --namespace=hr
```

Create the resources. The version of Kustomize inside kubectl is quite old, so we need to use kustomize directly. [Install](https://kubectl.docs.kubernetes.io/installation/kustomize/) with `brew install kustomize`.

```bash
kustomize build "./manifests/overlays/production/"  | kubectl apply -f -
```

Check kubernetes resources are running

```bash
kubectl get pods --all-namespaces
```

Check the endpoints work. 'hello' should return world directly. 'ping' should talk to the Hr Api over dapr, and return 'Response from hr api: pong'. Get the external IP address using `kubectl get services --all-namespaces`

```
curl http://ip-address/hello
curl http://ip-address/ping
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @lib/slack/exampleRequest.txt  http://ip-address/getManager
```

Install the nginx ingress controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx -f ./manifests/ingress-controller.yaml -n default
```

Install the ingress rules. These forward to the dapr sidecar of the ingress controller above, which is called "nginx-ingress-dapr" ("-dapr" is added to the names of things to form the sidecar name)

```bash
kubectl apply -f ./manifests/ingress.yaml
```

Call the Slack Api via Dapr. The external IP address of the ingress controller can be found from `kubectl get services`. **slack**.slack is from `dapr.io/app-id` in deployment.yaml and slack.**slack** is the namespace that the deployment is in. When done, you can debug by using ngrok or similar to expose the endpoint to the internet and then edit the slack [slash command](https://api.slack.com/apps/A01SHH2QF8S/slash-commands) to point at it.

```
curl http://ip-address/v1.0/invoke/slack.slack/method/ping
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @lib/slack/exampleRequest.txt  http://ip-address/v1.0/invoke/slack.slack/method/getManager
```

View the zipkin dashboard at http://ip-address:9411/ (get ip-address from `kubectl get services`)

TODO: update instructions when the slack integration is live / in use, probably by creating a test_get_manager slash command.
TODO: mention killing a process using a port? `netstat -anv | grep <port-number>`
