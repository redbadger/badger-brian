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

## WIP: Run locally and in cloud cluster / from github container registry

done: have found up to date kustomize documentation https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/
doing: uses bases (hr and slack) and overlays (development and production) to sort our deploying locally and to production

todo: make work for existing setup on gcloud
todo: get on a new branch and sort out a commit (but not a pr)
todo: make work for new local based setup, think the containers are hosted locally when you build them, and require no auth, but there might be some niggles.


todo: all below 
this bit of deployment.yaml needs kustomization
```
      imagePullSecrets:
        - name: github-container-registry
      containers:
        - name: hr
          image: ghcr.io/redbadger/hr
          imagePullPolicy: Never
```

this bit of service-acount.yaml
```
imagePullSecrets:
  - name: github-container-registry
```

## WIP: Deploy slack service to kubernetes

Create a kubernetes cluster somewhere

```bash
gcloud container clusters create dapr --num-nodes=1
```

Initialize Dapr on the cluster (https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)

```bash
dapr init -k
```

Create the slack Node App. 

```bash
kubectl apply -k manifests/slack/
```

Create the secret to authenticate with the GitHub Container registry

1. Better Option. This didn't work for Cedd, although it is straight from the docs. Use github username and a token with container registry access as the password for `docker login`. Replace `/users/ceddburge/.docker/config.json` with your value.

```bash
docker login https://ghcr.io
kubectl create secret generic github-container-registry \
    --from-file=.dockerconfigjson=/users/ceddburge/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson \
    --namespace slack
```

2. Slightly less secure option. This did work for Cedd, but is slightly less secure, as the token / password is saved in your terminal history. Replace `<github username>`, `<token with container registry access>` and `<email address>`  with your values.

```bash
kubectl create secret docker-registry github-container-registry \
    --docker-username=<github username> \
    --docker-password=<token with container registry access> \
    --docker-server=ghcr.io \
    --docker-email=<email address> \
    --namespace=slack
```

Check things look ok

```bash
kubectl get pods --namespace slack
```

Check the ping endpoint works. Get the external IP address using `kubectl get services --namespace=slack` and then navigate to http://ip-address/ping.

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

Call the slack app via dapr. The external IP address of the ingress controller can be found from  `kubectl get services`. **slack**.slack is from `dapr.io/app-id` in deployment.yaml and slack.**slack** is the namespace that the deployment is in.

```
curl http://ip-address/v1.0/invoke/slack.slack/method/ping
```

At this point the slack app is still available directly on the external id address from the LoadBalancer service that it uses, but the yaml can be edited to change the service to ClusterIP to avoid that.

## WIP: Test deployment to kubernetes

These instructions will be removed soon, but are probably helpful for a while we are getting up to speed with Dapr. Using a public pre existing image and yaml definition from the internet narrows down the surface area of potential problems a lot, and could be useful when working things out.

Create a kubernetes cluster somewhere

```bash
gcloud container clusters create dapr --num-nodes=1
```

Install Dapr on the cluster (https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)

```bash
dapr init -k
```

Install the Hello Kubernetes Quickstart example Node App. This also installs the Dapr side car, as defined in the yaml

```bash
kubectl apply -f https://github.com/dapr/quickstarts/blob/master/hello-kubernetes/deploy/node.yaml
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
