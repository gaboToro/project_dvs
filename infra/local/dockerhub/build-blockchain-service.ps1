$ErrorActionPreference = "Stop"
$Repo = "gabotor0"
$Tag = "latest"
$ServiceName = "@org/blockchain-service"
$ServiceDir = "blockchain-service"
$RepoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$Image = "$Repo/blockchain-service:$Tag"

docker build -f "$RepoRoot\infra\\local\\docker\\Dockerfile.nx-service" `
  --build-arg SERVICE_NAME=$ServiceName `
  --build-arg SERVICE_DIR=$ServiceDir `
  -t $Image $RepoRoot

docker push $Image
