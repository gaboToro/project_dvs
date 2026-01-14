$ErrorActionPreference = "Stop"

Write-Host "Starting infrastructure (docker compose)..." -ForegroundColor Cyan
docker compose up -d

$services = @(
  "auth-service",
  "rate-limiter-service",
  "audit-log-service",
  "user-service",
  "blockchain-service",
  "voting-service",
  "results-service",
  "election-service",
  "api-gateway"
)

foreach ($service in $services) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; npx nx serve $service"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\\apps\\dvs-app; npm run web"

Write-Host "All services launched in separate terminals." -ForegroundColor Green
