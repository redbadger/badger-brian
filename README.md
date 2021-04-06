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
#### `/lib`
This is where our services live, any service in here will be run by the
[CI](#ci) and will eventually be deployed on our k8s cluster.

#### `/manifests`
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
3. Builds and deploys docker images from the services
4. Updates the manifests of the services using
   [kustomize](https://kustomize.io/) to updating the image digest in the
   service's respective `/manifests/<SERVICE_NAME>/kustomization.yaml` file
   (only run on master currently - unless we want to add overlays/multiple envs)

### WIP: deployment to kubernetes

Create a kubernetes cluster somewhere

```bash
gcloud container clusters create dapr --num-nodes=1
```

Install Dapr on the cluster

```bash
dapr init -k
```

Install the Hello Kubernetes Quickstart example Node App. <node.yaml> is https://github.com/dapr/quickstarts/blob/master/hello-kubernetes/deploy/node.yaml. This also installs the Dapr side car, as defined in the yaml

```bash
kubectl apply -f <node.yaml>
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

Call the node app via dapr. The external Ip address of the ingress controller can be found from  `kubectl get services`.

```
curl http://<external-ip-address-of-ingress-controller>/v1.0/invoke/nodeapp/method/ports
```

At this point the node app is still available directly on the external id address from the LoadBalancer service that it uses, but the yaml can be edited to change the service to ClusterIP to avoid that.