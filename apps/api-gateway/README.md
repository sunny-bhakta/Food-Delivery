# API Gateway 
This NestJS app fronts all client traffic, handles auth, routing, and schema stitching. 
 
## Getting started
1. `npm install`
2. `cp env.example .env.local` (override per environment)
3. `npm run start:dev`

The gateway exposes `GET /api/health` which fans out to each upstream service’s `/health` endpoint to surface state and latency.
