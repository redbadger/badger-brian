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
