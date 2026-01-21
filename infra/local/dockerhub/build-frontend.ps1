$ErrorActionPreference = "Stop"
$Repo = "gabotor0"
$Tag = "latest"
$ApiBaseUrl = $env:EXPO_PUBLIC_API_BASE_URL
if (-not $ApiBaseUrl) {
  $ApiBaseUrl = "http://localhost:3000/api"
}
$RepoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$Image = "$Repo/frontend:$Tag"

docker build -f "$RepoRoot\infra\\local\\docker\\Dockerfile.frontend" `
  --build-arg EXPO_PUBLIC_API_BASE_URL=$ApiBaseUrl `
  -t $Image $RepoRoot

docker push $Image
