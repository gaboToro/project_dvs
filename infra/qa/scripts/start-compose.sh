#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-CHANGE_ME_REPO_URL}"
REPO_DIR="${REPO_DIR:-/opt/dvs}"
BRANCH="${BRANCH:-infra-qa}"
COMPOSE_FILE="${COMPOSE_FILE:-}"

if [[ -z "$COMPOSE_FILE" ]]; then
  echo "COMPOSE_FILE is required"
  exit 1
fi

dnf update -y
dnf install -y docker git docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user || true

mkdir -p ~/.ssh
ssh-keyscan github.com >> ~/.ssh/known_hosts

if [[ ! -d "$REPO_DIR/.git" ]]; then
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR/infra/qa"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only

docker compose -f "$COMPOSE_FILE" up -d
