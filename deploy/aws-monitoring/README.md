# AWS Monitoring Stack

This directory adds the observability layer from the target architecture.

It is designed for the current hybrid runtime:

- AWS EC2 backend is the main public runtime
- OpenStack/K3s still runs OCR
- Monitoring can run either on a dedicated EC2 instance or on the existing backend EC2 host

## What it deploys

- `Prometheus`
- `Grafana`
- `Loki`
- `Promtail`

## Current scrape path

Out of the box:

- Prometheus scrapes the AWS backend at `host.docker.internal:4000/metrics`
- Prometheus scrapes itself
- OCR metrics are prepared but commented out until a reachable OCR metrics endpoint exists from the monitoring host

## Files

- `docker-compose.yml`: monitoring runtime
- `.env.example`: Grafana credentials
- `prometheus.yml`: scrape configuration
- `loki-config.yml`: Loki configuration
- `promtail-config.yml`: Docker log shipping config
- `grafana/provisioning`: datasources and starter dashboard

## Ports

- `3000`: Grafana
- `9090`: Prometheus
- `3100`: Loki

## Recommended deployment choices

### Lowest cost

Run this stack on the existing `NodeJS-Backend` EC2 host.

### Cleaner architecture

Run this stack on a separate EC2 monitoring instance and point `AWS_MONITORING_INSTANCE_ID` there.

## Pipeline direction

The GitHub Actions workflow can optionally deploy this stack over SSM when these repository variables are set:

- `ENABLE_AWS_MONITORING_DEPLOY=true`
- `AWS_MONITORING_INSTANCE_ID=<instance-id>`

And these secrets are set:

- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`
