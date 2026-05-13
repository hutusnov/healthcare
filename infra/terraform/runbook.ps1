Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("bootstrap-init", "bootstrap-plan", "bootstrap-apply", "main-init", "main-validate", "main-plan", "dev-init", "dev-migrate-state", "dev-validate", "dev-plan", "staging-init", "staging-migrate-state", "staging-validate", "staging-plan", "prod-init", "prod-migrate-state", "prod-validate", "prod-plan", "check-env-isolation", "discover-network", "fmt")]
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
$staging = Join-Path $root "envs\\staging"
$prod = Join-Path $root "envs\\prod"

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
  "staging-init" {
    Push-Location $staging
    if (-not (Test-Path (Join-Path $staging "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/staging. Copy from backend.hcl.example first."
    }
    terraform init -backend-config backend.hcl -reconfigure
    Pop-Location
  }
  "staging-migrate-state" {
    Push-Location $staging
    if (-not (Test-Path (Join-Path $staging "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/staging. Copy from backend.hcl.example first."
    }
    Backup-TerraformState $staging
    terraform init -backend-config backend.hcl -reconfigure -migrate-state
    Pop-Location
  }
  "staging-validate" {
    Push-Location $staging
    terraform validate
    Pop-Location
  }
  "staging-plan" {
    Push-Location $staging
    terraform plan
    Pop-Location
  }
  "prod-init" {
    Push-Location $prod
    if (-not (Test-Path (Join-Path $prod "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/prod. Copy from backend.hcl.example first."
    }
    terraform init -backend-config backend.hcl -reconfigure
    Pop-Location
  }
  "prod-migrate-state" {
    Push-Location $prod
    if (-not (Test-Path (Join-Path $prod "backend.hcl"))) {
      throw "Missing backend.hcl in infra/terraform/envs/prod. Copy from backend.hcl.example first."
    }
    Backup-TerraformState $prod
    terraform init -backend-config backend.hcl -reconfigure -migrate-state
    Pop-Location
  }
  "prod-validate" {
    Push-Location $prod
    terraform validate
    Pop-Location
  }
  "prod-plan" {
    Push-Location $prod
    terraform plan
    Pop-Location
  }
  "check-env-isolation" {
    Push-Location $root
    & (Join-Path $root "check-env-isolation.ps1")
    Pop-Location
  }
  "discover-network" {
    Write-Host "Use discover script directly with required VPC id:"
    Write-Host ".\discover-aws-network.ps1 -VpcId vpc-xxxxxxxx -Env staging -Region ap-southeast-1"
  }
  "fmt" {
    Push-Location $root
    terraform fmt -recursive
    Pop-Location
  }
}
