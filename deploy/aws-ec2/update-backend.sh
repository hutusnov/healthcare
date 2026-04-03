#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/healthcare-backend}"

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "Missing ${DEPLOY_DIR}/.env"
  exit 1
fi

if [[ ! -f "${DEPLOY_DIR}/docker-compose.yml" ]]; then
  echo "Missing ${DEPLOY_DIR}/docker-compose.yml"
  exit 1
fi

cd "${DEPLOY_DIR}"

if [[ -n "${GHCR_USERNAME:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
fi

docker compose pull
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:4000/api/health
