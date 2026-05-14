Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("dev-init", "dev-validate", "dev-plan-safe", "dev-import-existing-dry-run", "dev-import-existing-execute", "dev-discover-compute", "phase-safe-complete")]
  [string]$Step = "phase-safe-complete"
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

function Has-OpenStackAuth {
  if (-not [string]::IsNullOrWhiteSpace($env:OS_CLOUD)) { return $true }
  if (-not [string]::IsNullOrWhiteSpace($env:OS_AUTH_URL)) { return $true }
  return $false
}

Require-Command terraform

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dev = Join-Path $root "envs\dev"

switch ($Step) {
  "dev-init" {
    Push-Location $dev
    terraform init -backend=false
    Pop-Location
  }
  "dev-validate" {
    Push-Location $dev
    terraform validate
    Pop-Location
  }
  "dev-plan-safe" {
    Push-Location $dev
    if (-not (Has-OpenStackAuth)) {
      Write-Host "Skip OpenStack plan: OS_AUTH_URL/OS_CLOUD not set. Validate-only mode."
      Pop-Location
      break
    }
    terraform plan -lock=false -input=false
    Pop-Location
  }
  "dev-import-existing-dry-run" {
    & (Join-Path $root "import-openstack-existing.ps1") -Env dev
  }
  "dev-import-existing-execute" {
    & (Join-Path $root "import-openstack-existing.ps1") -Env dev -Execute
  }
  "dev-discover-compute" {
    & (Join-Path $root "discover-openstack-compute.ps1") -Env dev
  }
  "phase-safe-complete" {
    Write-Host "OpenStack Terraform safe completion checks:"
    Write-Host "1) init (backend=false)"
    Write-Host "2) validate"
    Write-Host "3) optional plan if OpenStack auth exists"
    Push-Location $dev
    terraform init -backend=false
    terraform validate
    if (Has-OpenStackAuth) {
      terraform plan -lock=false -input=false
    } else {
      Write-Host "Skip OpenStack plan: OS_AUTH_URL/OS_CLOUD not set. This is expected on CI/local safe mode."
    }
    Pop-Location
  }
}
