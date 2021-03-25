# 2. Use Dapr

Date: 2021-03-25

## Status

Accepted

## Context

Cloud Native Microservices are currently _too_ hard. We spend too much effort on the "non-functionals" — the outer layers of the onion. This does not leave us enough time to concentrate on the "functional" core of our services. We want to change that, and believe that [Dapr](https:/dapr.io) can help. However, we want to prove that this is true for a real world context.

## Decision

We are going to start building up thin vertical slices of [Badger Brain](https://github.com/redbadger/badger-brain) in an attempt to prove that Dapr can help us focus on the core business logic and user value.

## Consequences

We expect that our services will become:

1. lighter
2. more focused
3. more portable (maybe even between cloud providers)
4. cheaper to build and maintain

However, we want to ensure that the additional cognitive load of yet another layer does not increase complexity or the barrier to entry.
