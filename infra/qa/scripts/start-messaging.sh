#!/usr/bin/env bash
set -euo pipefail
COMPOSE_FILE="docker-compose.messaging.yml" ./scripts/start-compose.sh
