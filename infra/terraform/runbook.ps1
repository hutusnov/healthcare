Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("bootstrap-init", "bootstrap-plan", "bootstrap-apply", "main-init", "main-validate", "main-plan", "dev-init", "dev-migrate-state", "dev-validate", "dev-plan", "fmt")]
  [string]$Step = "dev-plan"
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

Require-Command terraform

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bootstrap = Join-Path $root "bootstrap"
$dev = Join-Path $root "envs\\dev"

function Backup-TerraformState($workspaceDir) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupDir = Join-Path $workspaceDir "state-backups"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

  $stateFile = Join-Path $workspaceDir "terraform.tfstate"
  if (Test-Path $stateFile) {
    $stateBackup = Join-Path $backupDir "terraform.tfstate.$timestamp.bak"
    Copy-Item $stateFile $stateBackup -Force
    Write-Host "Backed up local state: $stateBackup"
  } else {
    Write-Host "No local terraform.tfstate found in $workspaceDir (skip backup)."
  }

  $terraformState = Join-Path $workspaceDir ".terraform\\terraform.tfstate"
  if (Test-Path $terraformState) {
    $metaBackup = Join-Path $backupDir ".terraform.tfstate.$timestamp.bak"
    Copy-Item $terraformState $metaBackup -Force
    Write-Host "Backed up backend metadata: $metaBackup"
  }
}

switch ($Step) {
  "bootstrap-init" {
    Push-Location $bootstrap
    terraform init
    Pop-Location
  }
  "bootstrap-plan" {
    Push-Location $bootstrap
    terraform plan
    Pop-Location
  }
  "bootstrap-apply" {
    Push-Location $bootstrap
    terraform apply
    Pop-Location
  }
  "main-init" {
    Push-Location $root
    if (-not (Test-Path (Join-Path $root "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform. Copy from backend.hcl.example first."
    }
    terraform init -backend-config backend.hcl -reconfigure
    Pop-Location
  }
  "main-validate" {
    Push-Location $root
    terraform validate
    Pop-Location
  }
  "main-plan" {
    Push-Location $root
    terraform plan
    Pop-Location
  }
  "dev-init" {
    Push-Location $dev
    if (-not (Test-Path (Join-Path $dev "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/dev. Copy from backend.hcl.example first."
    }
    terraform init -backend-config backend.hcl -reconfigure
    Pop-Location
  }
  "dev-migrate-state" {
    Push-Location $dev
    if (-not (Test-Path (Join-Path $dev "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/dev. Copy from backend.hcl.example first."
    }
    Backup-TerraformState $dev
    terraform init -backend-config backend.hcl -reconfigure -migrate-state
    Pop-Location
  }
  "dev-validate" {
    Push-Location $dev
    terraform validate
    Pop-Location
  }
  "dev-plan" {
    Push-Location $dev
    terraform plan
    Pop-Location
  }
  "fmt" {
    Push-Location $root
    terraform fmt -recursive
    Pop-Location
  }
}
