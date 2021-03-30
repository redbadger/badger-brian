branch := dev
digest := digest
build-url := https://github.com/redbadger/badger-brian/actions/

service := service-name
overlay := dev

repo := ghcr.io/redbdager

.PHONY: ci
ci: ## sets tag for deployment
	cd ./manifests/$(service)/overlays/$(overlay) \
	&& kustomize edit set image $(repo)/$(service)=$(repo)/$(service)@$(digest)

.PHONY: ci-finish
ci-finish: ## prepares for deployment
	git add . \
	&& git diff-index --quiet HEAD || git commit -m "Update $(service) image tags from CI ($(branch)) $(build-url)" \
	&& git push origin master

.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
