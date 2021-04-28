# 4. Deploy HR Api in dapr

Date: 2021-03-31

## Status

Accepted

## Context

- The current Breathe HR system does not have a good Api
- Red Badger may move to a different HR system in the near to medium term
- The HR Api only has one level of permissions, so if you have a key, you can access everything
- Red Badger has a relatively open culture

## Decision

We will write an adapter Api to talk to the Breate HR Api.

We will deploy this adapter Api in to any Dapr cluster that needs it, copy pasting as required

We will use Dapr security feature to restrict access to the adapter Api as required. This is a runtime restriction, developers can still change this at design time.

We will store the Breathe HR Api key in a secrets store, such as Azure Key Vault. Developer access can be limited and audited.

If possible, a temporary key will be used when developing, which will be created for a time bound piece of work and deleted afterwards. Pair programming should be used for the piece of work, so that each developer can informally audit / approve the others actions.

## Consequences

If we move to another HR system, only one Api has to change

The adapter Api is deployed in Dapr, which is useful for the proof of concept, and for using Dapr security features

All instances of the adapter Api will need to be deployed / copy pasted whenever it changes, although only one deployment is currently planned

Security of data in the HR system requires trusting developers, although sensible precautions are taken
