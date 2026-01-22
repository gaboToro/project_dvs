# Prod deploy (baseline infra)

This stack creates a baseline production environment with 3 fixed EC2s
and an ASG for identity:
- core: postgres, mongo, redis, kafka, zookeeper, rabbitmq, n8n
- identity (ASG, 2 instances): api-gateway, auth, user, rate-limiter, frontend
- business: election, voting, results, blockchain, reporting
- trust-support: audit-log, dashboard, email-notifier, scheduler-backup

An ALB is created as the public entry point and forwards to the api-gateway
on the identity host.

All instances are in one public subnet for simplicity. Security group allows
SSH from your IP and open access to ports 80, 3000, and 5678.

## 1) Prepare tfvars
Copy the example and update:
```
cp infra/prod/terraform.tfvars.example infra/prod/terraform.tfvars
```

Fill:
- `my_ip_cidr` with your public IP `/32`
- `ssh_public_key` with your key
- credentials (SMTP, Supabase, etc)
- `image_repo_prefix` to match your registry
- `image_tag` (defaults to `qa` for now)

Registry examples:
- GHCR: `image_repo_prefix = "ghcr.io/gabotoro"`
- Docker Hub: `image_repo_prefix = "gabotor0"`

Make sure the images are public.

## 2) Deploy
```
cd infra/prod
terraform init
terraform apply
```

## 3) Verify
After apply, check outputs:
- `alb_url` (preferred entry point)
- `api_gateway_url`
- `frontend_url`
- `n8n_url`

SSH to any host and verify:
```
docker ps
```

## 4) Data migration (optional, after infra is up)
You can migrate data later:
- Postgres: `pg_dump` from local, `psql` to core host
- Mongo: `mongodump` / `mongorestore`
- Redis: export/import or re-seed
- n8n: export workflows or copy `/home/node/.n8n` volume data

## Notes
- This is a baseline prod stack; hardening comes next (private subnets, NAT,
  bastion, TLS, WAF, backups).
- If you need to split frontend into its own host later, add another instance
  and move the frontend service to it.
