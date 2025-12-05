# Food Delivery Platform – Onboarding Guide

This document gives new contributors a quick map of the repository, highlights the major feature domains, and explains the recommended order for diving into the codebase.

## Folder structure

```
apps/
  api-gateway/          NestJS edge entrypoint (routing, auth, schema stitching)
  admin-api/            Placeholder NestJS module for operator tooling
  graphql-api/          Placeholder NestJS Apollo subgraph

services/
  node/
    auth-service/           NestJS + Fastify auth/token service
    catalog-service/        Fastify service for restaurants/menus (Mongo)
    dispatch-service/       Fastify service for courier routing (Redis + events)
    notifications-service/  Fastify service for push/SMS/email providers
  python/
    payments-service/       FastAPI orchestrator for external PSPs

packages/
  contracts/            OpenAPI/AsyncAPI/proto/GraphQL contracts (to be filled)
  shared/               Cross-language helpers (DTOs, validators, logging shapes)

infra/
  docker/               Local Docker Compose stack wiring services + data stores
  k8s/                  Placeholder for Helm charts / raw manifests

README.md, requirement.md, ONBOARDING.md, etc. live at the repo root for documentation.
```

## Feature highlights

- **User & Auth** – registration, JWT issuance, RBAC hooks (`services/node/auth-service`).
- **Catalog & Menus** – restaurant onboarding, menu CRUD, caching strategies (`services/node/catalog-service`).
- **Dispatch & Logistics** – courier matching, batching, ETA logic (`services/node/dispatch-service`).
- **Notifications** – push/SMS/email fan-out, template management (`services/node/notifications-service`).
- **Payments** – gateway orchestration, refunds, PSP webhooks (`services/python/payments-service`).
- **Gateway / BFF** – throttling, observability hooks, schema stitching, request fan-out (`apps/api-gateway`).
- **Infra** – local docker stack, future Kubernetes manifests (`infra/`).

For a comprehensive concept list, refer to `requirement.md`.

## Where to start coding

1. **API Gateway (`apps/api-gateway`)**
   - Add new routes/proxies, attach auth guards, or federate new GraphQL subgraphs.
   - Ideal starting point for features that touch multiple downstream services.

2. **Catalog service (`services/node/catalog-service`)**
   - Implement restaurant/menu CRUD, caching layers, and search indices.
   - Good for contributors focusing on customer-facing browsing experiences.

3. **Dispatch service (`services/node/dispatch-service`)**
   - Build courier assignment logic, event consumers, and real-time updates.
   - Start here if you’re handling logistics, location tracking, or routing.

4. **Auth service (`services/node/auth-service`)**
   - Extend identity flows, token issuance, MFA, and session management.
   - Use when integrating third-party identity providers or RBAC rules.

5. **Payments service (`services/python/payments-service`)**
   - Work on PSP integrations, refund flows, or secure vault interactions.
   - Recommended for contributors focusing on payment compliance.

6. **Notifications service (`services/node/notifications-service`)**
   - Expand provider adapters, template engines, or delivery analytics.

7. **Contracts package (`packages/contracts`)**
   - Define API schemas/events so polyglot services stay aligned.
   - Start here if you are formalizing interfaces/contracts before coding.

8. **Infrastructure (`infra/`)**
   - Add Dockerfiles, update Compose services, or introduce Kubernetes manifests.
   - Entry point for DevOps-focused contributors.

When picking up a task, ensure the relevant service has its dependencies installed (`npm install`/`pip install -r requirements.txt`) and is wired into the Docker Compose file if it needs local orchestration. Coordinate breaking changes via shared contracts and keep documentation (README.md, ONBOARDING.md) in sync as features land.

## Installing dependencies (Node workspaces)

Node services share a single dependency tree via npm workspaces. Run `npm install` once in the repo root to hoist all package dependencies, then launch individual services with:

```
npm run start:dev --workspace services/node/auth-service
```

Replace the workspace path with the service you want to run (e.g., `apps/api-gateway`). You can still execute scripts from inside a service directory, but root-level installs keep versions aligned and reduce duplicate `node_modules` folders.

