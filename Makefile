branch := dev
digest := digest
build-url := https://github.com/redbadger/badger-brian/actions/

service := service-name

repo := ghcr.io/redbadger

workspace-root := $(shell git rev-parse --show-toplevel)
dapr-config := $(workspace-root)/dapr-config-slim.yaml

.PHONY: dev
dev: ## runs all services and watches for changes
	pnpx concurrently --kill-others "make -C lib/hr dev" "make -C lib/slack dev"

.PHONY: dev-trace
dev-trace: ## runs all services and watches for changes
	open http://localhost:9411/zipkin
	$(MAKE) dapr-config=$(workspace-root)/dapr-config-trace.yaml dev

.PHONY: ci
ci: ## sets tag for deployment
	cd ./manifests/overlays/production \
	&& kustomize edit set image $(service)=$(repo)/$(service)@$(digest)

.PHONY: ci-finish
ci-finish: ## prepares for deployment
	git add . \
	&& git diff-index --quiet HEAD || git commit -m "Update $(service) image tags from CI ($(branch)) $(build-url)" \
	&& git push origin master

.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
