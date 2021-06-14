app := hr
image := ghcr.io/redbadger/$(app)
tag := latest

.PHONY: dev
dev: ## Start the server and watch for changes, using `dapr run` standalone mode.
	dapr run --app-id hr --app-port 3000 -- cargo watch -x run

.PHONY: default
default: build push

.PHONY: build
build: ## Build Docker image
	docker build --progress=plain -t $(image):latest -t $(image):$(tag) .

.PHONY: push
push: ## Push images to registry
	docker push $(image):latest
	docker push $(image):$(tag)

.PHONY: run
run: ## Runs the docker image
	docker run -it -p 3000:3000 $(image):latest

.PHONY: run-ci
run-ci: ## Runs the docker image in CI
	docker run -p 3000:3000 $(image):latest

.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
