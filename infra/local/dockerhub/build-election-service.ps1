$ErrorActionPreference = "Stop"
$Repo = "gabotor0"
$Tag = "latest"
$ServiceName = "@org/election-service"
$ServiceDir = "election-service"
$RepoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$Image = "$Repo/election-service:$Tag"

docker build -f "$RepoRoot\infra\\local\\docker\\Dockerfile.nx-service" `
  --build-arg SERVICE_NAME=$ServiceName `
  --build-arg SERVICE_DIR=$ServiceDir `
  -t $Image $RepoRoot

docker push $Image
