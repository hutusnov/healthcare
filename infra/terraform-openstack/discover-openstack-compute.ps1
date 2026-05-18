Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("dev")]
  [string]$Env = "dev"
)

$ErrorActionPreference = "Stop"

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Read-TfVars($Path) {
  $vars = @{}
  foreach ($line in Get-Content -Path $Path) {
    $trimmed = $line.Trim()
    if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
      continue
    }

    if ($trimmed -match '^\s*([A-Za-z0-9_]+)\s*=\s*"([^"]*)"\s*$') {
      $vars[$matches[1]] = $matches[2]
    }
  }

  return $vars
}

function Get-RequiredValue($Vars, $Key) {
  if (-not $Vars.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace([string]$Vars[$Key])) {
    throw "Missing required value in terraform.tfvars: $Key"
  }

  return [string]$Vars[$Key]
}

function Invoke-OpenStackJson($Arguments) {
  $previousPythonWarnings = $env:PYTHONWARNINGS
  $env:PYTHONWARNINGS = "ignore"
  $output = & openstack @Arguments -f json 2>&1
  $env:PYTHONWARNINGS = $previousPythonWarnings

  if ($LASTEXITCODE -ne 0) {
    throw "OpenStack CLI failed: openstack $($Arguments -join ' ')`n$output"
  }

  return ($output | Out-String | ConvertFrom-Json)
}

if ([string]::IsNullOrWhiteSpace($env:OS_CLOUD) -and [string]::IsNullOrWhiteSpace($env:OS_AUTH_URL)) {
  throw "OpenStack auth is not loaded. Source your openrc file first, then re-run this script."
}

Require-Command openstack

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfvarsPath = Join-Path $root "envs\$Env\terraform.tfvars"
if (-not (Test-Path $tfvarsPath)) {
  throw "Missing tfvars file: $tfvarsPath"
}

$tfvars = Read-TfVars $tfvarsPath
$servers = @(
  @{ Role = "master"; Key = "existing_master_id" },
  @{ Role = "data_node"; Key = "existing_data_node_id" },
  @{ Role = "worker"; Key = "existing_worker_id" }
)

Write-Host "OpenStack compute discovery for env '$Env'"
Write-Host ""

foreach ($server in $servers) {
  $id = Get-RequiredValue $tfvars $server.Key
  $details = Invoke-OpenStackJson @("server", "show", $id)

  Write-Host "[$($server.Role)]"
  Write-Host "id          = $id"
  Write-Host "name        = $($details.name)"
  Write-Host "status      = $($details.status)"
  Write-Host "flavor      = $($details.flavor)"
  Write-Host "image       = $($details.image)"
  Write-Host "key_name    = $($details.key_name)"
  Write-Host "volumes     = $($details.'volumes_attached')"
  Write-Host "addresses   = $($details.addresses)"
  Write-Host ""
}

Write-Host "Recommendation:"
Write-Host "- Keep compute as adopted inventory until boot-from-volume blocks and per-node flavors are modeled."
Write-Host "- Do not import compute instances if Terraform plan would show replace/destroy."
