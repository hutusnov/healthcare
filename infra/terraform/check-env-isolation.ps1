Param(
  [string]$DevPath = "envs/dev/terraform.tfvars",
  [string]$StagingPath = "envs/staging/terraform.tfvars",
  [string]$ProdPath = "envs/prod/terraform.tfvars"
)

$ErrorActionPreference = "Stop"

function Read-TfVarValue {
  Param(
    [string]$Content,
    [string]$Key
  )

  $pattern = "(?m)^\s*$([regex]::Escape($Key))\s*=\s*""([^""]+)"""
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value
  }
  return $null
}

function Load-File {
  Param([string]$Path)
  if (-not (Test-Path $Path)) {
    throw "Missing file: $Path"
  }
  return Get-Content $Path -Raw
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

try {
  $devContent = Load-File $DevPath
  $stagingContent = Load-File $StagingPath
  $prodContent = Load-File $ProdPath

  $keys = @(
    "vpc_id",
    "public_subnet_1_id",
    "public_subnet_2_id",
    "private_subnet_1_id",
    "private_subnet_2_id",
    "nat_gateway_id",
    "igw_id",
    "public_route_table_id",
    "private_route_table_1_id",
    "private_route_table_2_id",
    "backend_sg_name",
    "alb_name",
    "target_group_name"
  )

  $hasIssue = $false

  foreach ($key in $keys) {
    $devVal = Read-TfVarValue -Content $devContent -Key $key
    $stagingVal = Read-TfVarValue -Content $stagingContent -Key $key
    $prodVal = Read-TfVarValue -Content $prodContent -Key $key

    if ($null -eq $devVal -or $null -eq $stagingVal -or $null -eq $prodVal) {
      Write-Host "[WARN] Missing key in one of tfvars: $key"
      continue
    }

    if ($stagingVal -eq $devVal) {
      Write-Host "[FAIL] staging matches dev for $key => $stagingVal"
      $hasIssue = $true
    }

    if ($prodVal -eq $devVal) {
      Write-Host "[FAIL] prod matches dev for $key => $prodVal"
      $hasIssue = $true
    }
  }

  if ($hasIssue) {
    throw "Environment isolation check failed. Staging/prod still share one or more dev values."
  }

  Write-Host "Environment isolation check passed. Staging/prod values are separated from dev for checked keys."
}
finally {
  Pop-Location
}
