# Digital Voting System

Nx monorepo of NestJS microservices for a digital voting demo. The system supports authentication, election management (Supabase), vote casting, blockchain anchoring, and results aggregation.

## Prerequisites
- Node.js 18+
- Docker Desktop (Postgres, Mongo, Redis, Kafka, RabbitMQ)
- Supabase project (for elections)

## Architecture overview
- API Gateway routes traffic to services.
- Auth issues JWT tokens (demo credentials).
- Elections persist in Supabase.
- Votes are anchored to an in-memory blockchain and published to Kafka.
- Results service consumes Kafka and updates Mongo read model.
- Audit log service stores security-relevant events in Postgres.

## Services
- api-gateway (3000)
- auth-service (3001)
- voting-service (3002)
- blockchain-service (3003)
- results-service (3004)
- user-service (3005)
- election-service (3006)
- audit-log-service (3007)

## Frontend app (Expo)
Single Expo app lives under `apps/dvs-app` with voter, admin, and results flows.

Run the app (web/mobile):
```
cd apps/dvs-app
npm run web
```

API base URL:
- Default: `http://localhost:3000/api`
- Override: `EXPO_PUBLIC_API_BASE_URL=http://<gateway-host>:3000/api`

## Setup
1) Install dependencies
   - npm install

2) Start infra dependencies
   - docker compose up -d

3) Configure environment variables
   - .env is included for local demo.
   - Update with your Supabase values:
     - SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY
   - Mongo credentials in .env match docker-compose (user: dvs_user, pass: dvs_pass_123).

4) Apply Supabase migration
   - Run `supabase/migrations/20251230065442_remote_schema.sql` in Supabase SQL Editor.

5) Start services (separate terminals)
   - npx nx serve auth-service
   - npx nx serve user-service
   - npx nx serve blockchain-service
   - npx nx serve voting-service
   - npx nx serve results-service
   - npx nx serve election-service
   - npx nx serve audit-log-service
   - npx nx serve api-gateway

## Demo flow (via API Gateway)
1) Login
   - POST http://localhost:3000/api/auth/login
   - Body: { "username": "admin", "password": "admin123" }

2) Create election (admin token required)
   - POST http://localhost:3000/api/elections

3) Add candidate
   - POST http://localhost:3000/api/elections/:id/candidates

4) Open election
   - POST http://localhost:3000/api/elections/:id/open

5) Cast a vote
   - POST http://localhost:3000/api/votes
   - Header: Authorization: Bearer <accessToken>
   - Body: { "electionId": "demo-2025", "candidateId": "cand-001" }

6) Read results
   - GET http://localhost:3000/api/results/demo-2025

## Elections (Supabase-backed)
- GET http://localhost:3000/api/elections/health
- GET http://localhost:3000/api/elections?status=OPEN
- GET http://localhost:3000/api/elections/active
- GET http://localhost:3000/api/elections/:id
- POST http://localhost:3000/api/elections (admin)
- PATCH http://localhost:3000/api/elections/:id (admin)
- POST http://localhost:3000/api/elections/:id/open (admin)
- POST http://localhost:3000/api/elections/:id/close (admin)
- POST http://localhost:3000/api/elections/:id/candidates (admin)
- DELETE http://localhost:3000/api/elections/:id/candidates/:candidateId (admin)

## Audit log service
- Health: GET http://localhost:3007/api/audit/health
- Ingest: POST http://localhost:3007/api/audit/log
  - Uses header `x-internal-token` when `INTERNAL_SERVICE_TOKEN` is set.
  - Stores data in Postgres `audit_logs`.

## Testing
### Unit + functional
- Run all tests: `npm run test:all`
- Functional tests start the Nest apps in-process and hit real HTTP routes.

### Load testing (smoke)
- Start services, then run: `npm run load:smoke`
- Override parameters:
  - `DURATION=20 CONCURRENCY=25 node tools/load/basic-load.js http://localhost:3000/api/auth/health`

## CI/CD
- GitHub Actions runs lint, tests, and build on PRs to `qa` and `main`.
- Manual load test job available via workflow_dispatch.

## Notes
- results-service consumes votes from Kafka. If Kafka is down, results will not update.
- users.email is optional and can be updated by the user profile.
