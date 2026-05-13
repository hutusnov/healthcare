Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("bootstrap-init", "bootstrap-plan", "bootstrap-apply", "main-init", "main-validate", "main-plan", "dev-init", "dev-validate", "dev-plan", "fmt")]
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
    terraform init -backend-config=backend.hcl -reconfigure
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
    terraform init -backend-config=backend.hcl -reconfigure
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
