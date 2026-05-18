Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("dev")]
  [string]$Env = "dev",

  [Parameter(Mandatory = $false)]
  [switch]$Execute,

  [Parameter(Mandatory = $false)]
  [switch]$IncludeCompute
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
      continue
    }

    if ($trimmed -match '^\s*([A-Za-z0-9_]+)\s*=\s*(true|false)\s*$') {
      $vars[$matches[1]] = [System.Convert]::ToBoolean($matches[2])
      continue
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

function Add-Import($Imports, $Address, $Id) {
  $Imports.Add([PSCustomObject]@{
      Address = $Address
      Id      = $Id
    }) | Out-Null
}

function Enable-ComputeManagement($TfVarsPath) {
  $content = Get-Content -Path $TfVarsPath -Raw
  if ($content -match '(?m)^\s*manage_compute_instances\s*=') {
    $updated = $content -replace '(?m)^\s*manage_compute_instances\s*=.*$', 'manage_compute_instances = true'
    Set-Content -Path $TfVarsPath -Value $updated -NoNewline
    return
  }

  Add-Content -Path $TfVarsPath -Value "`n# Enabled by import-openstack-existing.ps1 after VM adoption review."
  Add-Content -Path $TfVarsPath -Value "manage_compute_instances = true"
}

function Backup-TerraformState($WorkspaceDir) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupDir = Join-Path $WorkspaceDir "state-backups"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

  foreach ($relativePath in @("terraform.tfstate", "terraform.tfstate.backup", ".terraform\terraform.tfstate")) {
    $source = Join-Path $WorkspaceDir $relativePath
    if (Test-Path $source) {
      $safeName = $relativePath.Replace("\", ".")
      $dest = Join-Path $backupDir "$safeName.$timestamp.bak"
      Copy-Item -Path $source -Destination $dest -Force
      Write-Host "Backed up state file: $dest"
    }
  }
}

function Get-ImportedAddresses {
  $oldErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = terraform state list 2>$null
  $ErrorActionPreference = $oldErrorAction

  if ($LASTEXITCODE -ne 0) {
    return @()
  }

  return @($output)
}

Require-Command terraform

if ([string]::IsNullOrWhiteSpace($env:OS_CLOUD) -and [string]::IsNullOrWhiteSpace($env:OS_AUTH_URL)) {
  throw "OpenStack auth is not loaded. Source your openrc file first, then re-run this script."
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envDir = Join-Path $root "envs\$Env"
$tfvarsPath = Join-Path $envDir "terraform.tfvars"

if (-not (Test-Path $tfvarsPath)) {
  throw "Missing tfvars file: $tfvarsPath"
}

$tfvars = Read-TfVars $tfvarsPath
$imports = New-Object System.Collections.Generic.List[object]

Add-Import $imports "module.openstack_cluster.openstack_networking_network_v2.cluster[0]" (Get-RequiredValue $tfvars "existing_network_id")
Add-Import $imports "module.openstack_cluster.openstack_networking_subnet_v2.cluster[0]" (Get-RequiredValue $tfvars "existing_subnet_id")
Add-Import $imports "module.openstack_cluster.openstack_networking_router_v2.cluster[0]" (Get-RequiredValue $tfvars "existing_router_id")
Add-Import $imports "module.openstack_cluster.openstack_networking_secgroup_v2.cluster[0]" (Get-RequiredValue $tfvars "existing_secgroup_id")

if ($IncludeCompute) {
  Add-Import $imports "module.openstack_cluster.openstack_compute_instance_v2.adopted_master[0]" (Get-RequiredValue $tfvars "existing_master_id")
  Add-Import $imports "module.openstack_cluster.openstack_compute_instance_v2.adopted_data_node[0]" (Get-RequiredValue $tfvars "existing_data_node_id")
  Add-Import $imports "module.openstack_cluster.openstack_compute_instance_v2.adopted_worker[0]" (Get-RequiredValue $tfvars "existing_worker_id")
}

Write-Host "OpenStack Terraform import plan for env '$Env'"
Write-Host "Execute mode: $Execute"
Write-Host "Include compute: $IncludeCompute"
Write-Host ""

foreach ($item in $imports) {
  Write-Host ("terraform import -var-file=terraform.tfvars {0} {1}" -f $item.Address, $item.Id)
}

if (-not $Execute) {
  Write-Host ""
  Write-Host "Dry-run only. Re-run with -Execute to import these OpenStack resources into local Terraform state."
  exit 0
}

Push-Location $envDir
try {
  Backup-TerraformState $envDir
  if ($IncludeCompute) {
    $tfvarsBackup = Join-Path $envDir ("terraform.tfvars." + (Get-Date -Format "yyyyMMdd-HHmmss") + ".bak")
    Copy-Item -Path $tfvarsPath -Destination $tfvarsBackup -Force
    Write-Host "Backed up tfvars before enabling compute management: $tfvarsBackup"
    Enable-ComputeManagement $tfvarsPath
  }

  $existingAddresses = Get-ImportedAddresses

  foreach ($item in $imports) {
    if ($existingAddresses -contains $item.Address) {
      Write-Host "Already imported, skipping: $($item.Address)"
      continue
    }

    Write-Host "Importing: $($item.Address)"
    $terraformArgs = @(
      "import",
      "-input=false",
      "-var-file=terraform.tfvars",
      [string]$item.Address,
      [string]$item.Id
    )
    & terraform @terraformArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Import failed for $($item.Address)"
    }
  }

  terraform plan -lock=false -input=false
} finally {
  Pop-Location
}
