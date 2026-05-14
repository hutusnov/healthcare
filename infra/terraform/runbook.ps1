Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("bootstrap-init", "bootstrap-plan", "bootstrap-apply", "main-init", "main-validate", "main-plan", "dev-init", "dev-migrate-state", "dev-import-existing-dry-run", "dev-import-existing-execute", "dev-validate", "dev-plan", "staging-init", "staging-migrate-state", "staging-validate", "staging-plan", "prod-init", "prod-migrate-state", "prod-validate", "prod-plan", "check-env-isolation", "discover-network", "fmt", "phase1-safe-complete")]
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

function Run-PlanWithSafetyHandling($envName, $planFile) {
  $oldErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = terraform plan -lock=false -input=false -out=$planFile 2>&1
  $ErrorActionPreference = $oldErrorAction
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq 0) {
    Write-Host "[$envName] plan succeeded."
    return
  }

  $text = ($output | Out-String)
  if ($text -match "non_dev_safety_lock" -or $text -match "allow_nondev_plan_with_shared_ids") {
    Write-Host "[$envName] plan blocked by safety lock (expected for non-dev shared IDs)."
    return
  }

  Write-Host $text
  throw "[$envName] terraform plan failed unexpectedly."
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
  "dev-import-existing-dry-run" {
    & (Join-Path $root "import-aws-existing.ps1") -Env dev
  }
  "dev-import-existing-execute" {
    & (Join-Path $root "import-aws-existing.ps1") -Env dev -Execute
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
    & (Join-Path $root "check-env-isolation.ps1") -AllowSharedStaging
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
  "phase1-safe-complete" {
    Write-Host "Phase1 safe completion checks:"
    Write-Host "1) terraform fmt/validate on dev"
    Write-Host "2) terraform plan on dev (no apply)"
    Write-Host "3) terraform validate on staging/prod (no apply)"
    Write-Host "4) env isolation check"

    Push-Location $root
    terraform fmt -check -recursive
    Pop-Location

    Push-Location $dev
    terraform validate
    Run-PlanWithSafetyHandling -envName "dev" -planFile "tfplan-dev"
    Pop-Location

    Push-Location $staging
    terraform validate
    Run-PlanWithSafetyHandling -envName "staging" -planFile "tfplan-staging"
    Pop-Location

    Push-Location $prod
    terraform validate
    Run-PlanWithSafetyHandling -envName "prod" -planFile "tfplan-prod"
    Pop-Location

    Push-Location $root
    & (Join-Path $root "check-env-isolation.ps1") -AllowSharedStaging
    Pop-Location

    Write-Host "Terraform phase1 safety checks completed. No apply executed."
  }
}
