# user-service

## Description
User management service and voting eligibility validation.

## Endpoints
- GET  /api/users/health
- GET  /api/users               (admin => full list; non-admin => self only)
- GET  /api/users/:id
- PATCH /api/users/:id
- POST /api/users               (admin only)
- GET  /api/users/:id/eligible

## Security
Requires JWT (Bearer). Roles in token: `roles: ['admin'|'voter']`.
## Communication
- **REST**: API Gateway and other services.

## Environment Variables
- `PORT=3005`

## Execution
npx nx serve user-service

## Tests
npx nx test user-service
