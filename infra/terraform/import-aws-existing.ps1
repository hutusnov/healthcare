Param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("dev", "staging", "prod")]
  [string]$Env = "dev",

  [Parameter(Mandatory = $false)]
  [string]$Region = "",

  [Parameter(Mandatory = $false)]
  [switch]$Execute,

  [Parameter(Mandatory = $false)]
  [switch]$AllowNonDev
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

    if ($trimmed -match '^\s*([A-Za-z0-9_]+)\s*=\s*([0-9]+)\s*$') {
      $vars[$matches[1]] = $matches[2]
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

function Invoke-AwsText($Arguments) {
  $output = & aws @Arguments --output text 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "AWS CLI failed: aws $($Arguments -join ' ')`n$output"
  }

  $text = ($output | Out-String).Trim()
  if ($text -eq "" -or $text -eq "None") {
    return ""
  }

  return $text
}

function Resolve-SecurityGroupId($Name, $VpcId, $Region) {
  return Invoke-AwsText @(
    "ec2", "describe-security-groups",
    "--region", $Region,
    "--filters", "Name=group-name,Values=$Name", "Name=vpc-id,Values=$VpcId",
    "--query", "SecurityGroups[0].GroupId"
  )
}

function Resolve-LoadBalancerArn($Name, $Region) {
  return Invoke-AwsText @(
    "elbv2", "describe-load-balancers",
    "--region", $Region,
    "--names", $Name,
    "--query", "LoadBalancers[0].LoadBalancerArn"
  )
}

function Resolve-TargetGroupArn($Name, $Region) {
  return Invoke-AwsText @(
    "elbv2", "describe-target-groups",
    "--region", $Region,
    "--names", $Name,
    "--query", "TargetGroups[0].TargetGroupArn"
  )
}

function Resolve-ListenerArn($LoadBalancerArn, $Port, $Region) {
  return Invoke-AwsText @(
    "elbv2", "describe-listeners",
    "--region", $Region,
    "--load-balancer-arn", $LoadBalancerArn,
    "--query", "Listeners[?Port==``$Port``].ListenerArn | [0]"
  )
}

function Add-Import($Imports, $Address, $Id) {
  if ([string]::IsNullOrWhiteSpace($Id)) {
    Write-Warning "Skip empty import id for $Address"
    return
  }

  $Imports.Add([PSCustomObject]@{
      Address = $Address
      Id      = $Id
    }) | Out-Null
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
  $output = terraform state list 2>$null
  if ($LASTEXITCODE -ne 0) {
    return @()
  }

  return @($output)
}

Require-Command terraform
Require-Command aws

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envDir = Join-Path $root "envs\$Env"
$tfvarsPath = Join-Path $envDir "terraform.tfvars"

if (-not (Test-Path $tfvarsPath)) {
  throw "Missing tfvars file: $tfvarsPath"
}

if ($Env -ne "dev" -and -not $AllowNonDev) {
  throw "Refusing to import non-dev state without -AllowNonDev. This avoids accidentally adopting shared or production resources."
}

$tfvars = Read-TfVars $tfvarsPath
if ([string]::IsNullOrWhiteSpace($Region)) {
  $Region = Get-RequiredValue $tfvars "aws_region"
}

$vpcId = Get-RequiredValue $tfvars "vpc_id"
$imports = New-Object System.Collections.Generic.List[object]

Add-Import $imports "module.network_stack.aws_subnet.public_1" (Get-RequiredValue $tfvars "public_subnet_1_id")
Add-Import $imports "module.network_stack.aws_subnet.public_2" (Get-RequiredValue $tfvars "public_subnet_2_id")
Add-Import $imports "module.network_stack.aws_subnet.private_1" (Get-RequiredValue $tfvars "private_subnet_1_id")
Add-Import $imports "module.network_stack.aws_subnet.private_2" (Get-RequiredValue $tfvars "private_subnet_2_id")
Add-Import $imports "module.network_stack.aws_internet_gateway.this" (Get-RequiredValue $tfvars "igw_id")
Add-Import $imports "module.network_stack.aws_route_table.public" (Get-RequiredValue $tfvars "public_route_table_id")
Add-Import $imports "module.network_stack.aws_route_table.private_1" (Get-RequiredValue $tfvars "private_route_table_1_id")
Add-Import $imports "module.network_stack.aws_route_table.private_2" (Get-RequiredValue $tfvars "private_route_table_2_id")
Add-Import $imports "module.network_stack.aws_route_table_association.public_1" (Get-RequiredValue $tfvars "public_rtb_assoc_1_id")
Add-Import $imports "module.network_stack.aws_route_table_association.public_2" (Get-RequiredValue $tfvars "public_rtb_assoc_2_id")
Add-Import $imports "module.network_stack.aws_route_table_association.private_1" (Get-RequiredValue $tfvars "private_rtb_assoc_1_id")
Add-Import $imports "module.network_stack.aws_route_table_association.private_2" (Get-RequiredValue $tfvars "private_rtb_assoc_2_id")

$backendSgId = Resolve-SecurityGroupId (Get-RequiredValue $tfvars "backend_sg_name") $vpcId $Region
Add-Import $imports "module.backend_stack.aws_security_group.backend_sg" $backendSgId

if ($tfvars.ContainsKey("manage_alb_sg") -and [bool]$tfvars["manage_alb_sg"]) {
  $albSgId = Resolve-SecurityGroupId (Get-RequiredValue $tfvars "alb_sg_name") $vpcId $Region
  Add-Import $imports "module.backend_stack.aws_security_group.alb_sg[0]" $albSgId
}

if ($tfvars.ContainsKey("manage_vpn_sg") -and [bool]$tfvars["manage_vpn_sg"]) {
  $vpnSgId = Resolve-SecurityGroupId (Get-RequiredValue $tfvars "vpn_sg_name") $vpcId $Region
  Add-Import $imports "module.backend_stack.aws_security_group.vpn_sg[0]" $vpnSgId
}

$albArn = Resolve-LoadBalancerArn (Get-RequiredValue $tfvars "alb_name") $Region
$targetGroupArn = Resolve-TargetGroupArn (Get-RequiredValue $tfvars "target_group_name") $Region
Add-Import $imports "module.alb_stack.aws_lb.this" $albArn
Add-Import $imports "module.alb_stack.aws_lb_target_group.backend" $targetGroupArn
Add-Import $imports "module.alb_stack.aws_lb_listener.http" (Resolve-ListenerArn $albArn (Get-RequiredValue $tfvars "http_listener_port") $Region)
Add-Import $imports "module.alb_stack.aws_lb_listener.https" (Resolve-ListenerArn $albArn (Get-RequiredValue $tfvars "https_listener_port") $Region)

Write-Host "AWS Terraform import plan for env '$Env' in $Region"
Write-Host "Execute mode: $Execute"
Write-Host ""

foreach ($item in $imports) {
  Write-Host ("terraform import -var-file=terraform.tfvars {0} {1}" -f $item.Address, $item.Id)
}

if (-not $Execute) {
  Write-Host ""
  Write-Host "Dry-run only. Re-run with -Execute to import these existing resources into local Terraform state."
  exit 0
}

Push-Location $envDir
try {
  Backup-TerraformState $envDir
  $existingAddresses = Get-ImportedAddresses

  foreach ($item in $imports) {
    if ($existingAddresses -contains $item.Address) {
      Write-Host "Already imported, skipping: $($item.Address)"
      continue
    }

    Write-Host "Importing: $($item.Address)"
    terraform import -var-file=terraform.tfvars $item.Address $item.Id
    if ($LASTEXITCODE -ne 0) {
      throw "Import failed for $($item.Address)"
    }
  }

  terraform plan -lock=false -input=false
} finally {
  Pop-Location
}
