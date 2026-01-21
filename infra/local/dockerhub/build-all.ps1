$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path "$PSScriptRoot\..\..\.."

$Scripts = @(
  "build-api-gateway.ps1",
  "build-auth-service.ps1",
  "build-user-service.ps1",
  "build-rate-limiter-service.ps1",
  "build-election-service.ps1",
  "build-voting-service.ps1",
  "build-results-service.ps1",
  "build-blockchain-service.ps1",
  "build-reporting-service.ps1",
  "build-audit-log-service.ps1",
  "build-dashboard-service.ps1",
  "build-email-notifier-service.ps1",
  "build-scheduler-backup-service.ps1",
  "build-frontend.ps1"
)

foreach ($script in $Scripts) {
  & "$PSScriptRoot\$script"
}
