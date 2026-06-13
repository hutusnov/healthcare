#!/usr/bin/env python3
import argparse
import json
import sys
from datetime import date
from pathlib import Path


def load_json(path: str):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def iter_findings(report):
    for dep in report.get("dependencies", []):
        package = (dep.get("name") or "").lower()
        version = dep.get("version") or ""
        for vuln in dep.get("vulns", []):
            yield {
                "package": package,
                "version": version,
                "id": vuln.get("id") or "",
                "fix_versions": vuln.get("fix_versions") or [],
            }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", required=True)
    parser.add_argument("--policy", required=True)
    args = parser.parse_args()

    report = load_json(args.report)
    policy = load_json(args.policy)
    today = date.today()

    allowed = {}
    expired = []
    for item in policy.get("allow", []):
        key = ((item.get("package") or "").lower(), item.get("id") or "")
        expiry = date.fromisoformat(item["expires"])
        if expiry < today:
            expired.append(item)
        allowed[key] = item

    if expired:
        print("Expired vulnerability waivers:")
        for item in expired:
            print(f"- {item.get('package')} {item.get('id')} expired {item.get('expires')}")
        return 1

    findings = list(iter_findings(report))
    unreviewed = [
        finding for finding in findings
        if (finding["package"], finding["id"]) not in allowed
    ]

    print(f"pip-audit findings: {len(findings)}")
    print(f"policy-allowed findings: {len(findings) - len(unreviewed)}")

    if unreviewed:
        print("Unreviewed vulnerabilities:")
        for finding in unreviewed:
            fixes = ", ".join(finding["fix_versions"]) or "no fix listed"
            print(f"- {finding['package']} {finding['version']} {finding['id']} fix: {fixes}")
        return 1

    print("All pip-audit findings are covered by reviewed policy waivers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
