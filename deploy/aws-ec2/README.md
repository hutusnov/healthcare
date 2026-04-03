# AWS EC2 Backend Deploy

This folder is the lightweight deployment path for the current AWS backend runtime.

It matches the architecture now running in AWS:

- `ALB` public entrypoint
- `NodeJS-Backend` EC2 runtime
- `WireGuard-VPN-Node` forwarding into OpenStack
- `PostgreSQL/Redis/RabbitMQ` remain on the OpenStack private side

## Files

- `docker-compose.yml`: runtime definition for the EC2 backend host
- `.env.example`: required environment variables for the EC2 host
- `update-backend.sh`: pull, restart, and health-check helper

## Manual use on EC2

Copy `docker-compose.yml` and a real `.env` into `/opt/healthcare-backend`, then run:

```bash
chmod +x /opt/healthcare-backend/update-backend.sh
/opt/healthcare-backend/update-backend.sh
```

## CI/CD direction

The GitHub Actions workflow can use AWS SSM to:

1. write the compose/env files onto the EC2 instance
2. log in to `ghcr.io`
3. pull the latest backend image
4. recreate the container
5. health-check `http://127.0.0.1:4000/api/health`

This keeps the current EC2 deployment path close to the target pipeline without forcing ECS/EKS right now.
