# Project Completion Checklist (Main Branch)

Use this checklist to close the project in a controlled, demo-ready way.

## 1. Runtime Stability

- [ ] Backend API on AWS returns `200` for `/api/health` via CloudFront domain.
- [ ] Patient Portal can load and call public API successfully.
- [ ] Admin Panel can login and use protected routes.
- [ ] OCR service is reachable from backend path used in production flow.
- [ ] Database connectivity is stable (no Prisma `P1001` in backend logs).

## 2. High Availability (HA)

- [ ] ALB target group has 2 backend instances in different AZs.
- [ ] Both targets are `Healthy` on `/api/health`.
- [ ] Failover test passed:
  - Stop backend in AZ1.
  - Verify API still returns `200` through CloudFront.
  - Start AZ1 again.
  - Verify both targets return to `Healthy`.

## 3. Monitoring & Alerting

- [ ] Monitoring stack containers are up:
  - `healthcare-prometheus`
  - `healthcare-grafana`
  - `healthcare-loki`
  - `healthcare-promtail`
  - `healthcare-alertmanager`
- [ ] Prometheus `/ready` and Alertmanager `/ready` are healthy.
- [ ] Grafana dashboard shows backend/host metrics.
- [ ] Email alert test passed:
  - Stop backend.
  - Receive FIRING mail.
  - Start backend.
  - Alert clears.

## 4. CI/CD Health

- [ ] Main pipeline is green on latest `main`.
- [ ] `Build, Publish, and Scan Images` job passes.
- [ ] `Deploy AWS EC2 Backend` job passes for all configured instance IDs.
- [ ] `Deploy AWS Monitoring` job passes when enabled.
- [ ] Frontend deploy to S3 + CloudFront passes.

## 5. Security Baseline

- [ ] API direct-origin access policy works (direct call blocked if required).
- [ ] Public API flow works through CloudFront route.
- [ ] Secrets stored only in GitHub Secrets/Variables (not in source files).
- [ ] Leaked credentials/app-passwords rotated and replaced.
- [ ] SG/routing rules documented for AWS <-> OpenStack VPN flow.

## 6. Documentation

- [ ] Root `README.md` reflects latest architecture and deployment model.
- [ ] `docs/OPENSTACK_3NODE_BUILD_LOG.md` updated with latest HA/monitoring milestones.
- [ ] Team demo script is ready (architecture -> runtime -> pipeline -> monitoring).
- [ ] Known limitations and next-phase roadmap are written clearly.

## 7. Final Demo Flow (Suggested)

1. Show high-level architecture (AWS public + OpenStack private).
2. Show API health/stats from public domain.
3. Show login/protected flow from admin or patient portal.
4. Show monitoring dashboard and email alert trigger/resolve.
5. Show GitHub Actions successful pipeline run.
6. Show HA failover evidence (AZ1 stop, API still up on AZ2).

## 8. Optional Post-Demo Optimizations

- [ ] Cost mode: stop AZ2 when not demoing (document startup checklist before demo).
- [ ] Add autoscaling strategy or EKS migration plan as future work.
- [ ] Add centralized incident runbook and rollback playbook.
