Param(
  [Parameter(Mandatory = $true)]
  [string]$VpcId,

  [Parameter(Mandatory = $false)]
  [string]$Region = "ap-southeast-1",

  [Parameter(Mandatory = $false)]
  [ValidateSet("staging", "prod")]
  [string]$Env = "staging"
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

function AwsJson {
  Param(
    [Parameter(Mandatory = $true)]
    [string[]]$ArgList
  )

  $raw = & aws @ArgList
  if ($LASTEXITCODE -ne 0) {
    throw "AWS CLI command failed: aws $($ArgList -join ' ')"
  }
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }
  return $raw | ConvertFrom-Json
}

function Get-NameTag($tagSet) {
  if ($null -eq $tagSet) { return $null }
  foreach ($t in $tagSet) {
    if ($t.Key -eq "Name") { return $t.Value }
  }
  return $null
}

function Pick-SubnetByAz($subnets, $az, $public, $publicSubnetIds) {
  $candidates = $subnets | Where-Object {
    $_.AvailabilityZone -eq $az -and (($publicSubnetIds -contains $_.SubnetId) -eq $public)
  }
  if ($candidates.Count -eq 0) { return $null }
  return $candidates | Sort-Object SubnetId | Select-Object -First 1
}

Require-Command "aws"

$identity = AwsJson -ArgList @("sts", "get-caller-identity", "--output", "json")
$accountId = $identity.Account

$vpc = AwsJson -ArgList @("ec2", "describe-vpcs", "--region", $Region, "--vpc-ids", $VpcId, "--output", "json")
if ($vpc.Vpcs.Count -eq 0) {
  throw "VPC not found: $VpcId"
}

$igws = AwsJson -ArgList @("ec2", "describe-internet-gateways", "--region", $Region, "--filters", "Name=attachment.vpc-id,Values=$VpcId", "--output", "json")
$igwId = if ($igws.InternetGateways.Count -gt 0) { $igws.InternetGateways[0].InternetGatewayId } else { "igw-REPLACE_ME" }

$subnetResp = AwsJson -ArgList @("ec2", "describe-subnets", "--region", $Region, "--filters", "Name=vpc-id,Values=$VpcId", "--output", "json")
$subnets = $subnetResp.Subnets
if ($subnets.Count -lt 4) {
  Write-Host "[WARN] Found less than 4 subnets in VPC. Please verify topology."
}

$azs = ($subnets | Select-Object -ExpandProperty AvailabilityZone -Unique | Sort-Object)
if ($azs.Count -lt 2) {
  throw "Need at least 2 AZs in this VPC to build public/private pair."
}

$az1 = $azs[0]
$az2 = $azs[1]

$rtbs = AwsJson -ArgList @("ec2", "describe-route-tables", "--region", $Region, "--filters", "Name=vpc-id,Values=$VpcId", "--output", "json")

$publicSubnetIdSet = New-Object System.Collections.Generic.HashSet[string]
foreach ($rtb in $rtbs.RouteTables) {
  $hasInternetDefaultRoute = $false
  foreach ($route in $rtb.Routes) {
    if ($route.DestinationCidrBlock -eq "0.0.0.0/0" -and $route.GatewayId -like "igw-*") {
      $hasInternetDefaultRoute = $true
      break
    }
  }
  if ($hasInternetDefaultRoute) {
    foreach ($assoc in $rtb.Associations) {
      if ($assoc.SubnetId) {
        [void]$publicSubnetIdSet.Add($assoc.SubnetId)
      }
    }
  }
}

$publicSubnetIds = @($publicSubnetIdSet)

$pub1 = Pick-SubnetByAz -subnets $subnets -az $az1 -public $true -publicSubnetIds $publicSubnetIds
$pub2 = Pick-SubnetByAz -subnets $subnets -az $az2 -public $true -publicSubnetIds $publicSubnetIds
$pri1 = Pick-SubnetByAz -subnets $subnets -az $az1 -public $false -publicSubnetIds $publicSubnetIds
$pri2 = Pick-SubnetByAz -subnets $subnets -az $az2 -public $false -publicSubnetIds $publicSubnetIds

if ($null -eq $pub1 -or $null -eq $pub2 -or $null -eq $pri1 -or $null -eq $pri2) {
  Write-Host "[WARN] Could not auto-map full 2x public + 2x private subnets. Manual adjustment required."
}

if ($null -eq $pub1 -and $az1) {
  $pub1 = ($subnets | Where-Object { $_.AvailabilityZone -eq $az1 } | Sort-Object SubnetId | Select-Object -First 1)
}
if ($null -eq $pub2 -and $az2) {
  $pub2 = ($subnets | Where-Object { $_.AvailabilityZone -eq $az2 } | Sort-Object SubnetId | Select-Object -First 1)
}
if ($null -eq $pri1) { $pri1 = $pub1 }
if ($null -eq $pri2) { $pri2 = $pub2 }

function Find-RtbForSubnet($subnetId, $routeTables) {
  foreach ($rtb in $routeTables.RouteTables) {
    foreach ($assoc in $rtb.Associations) {
      if ($assoc.SubnetId -eq $subnetId) {
        return @{
          RouteTableId = $rtb.RouteTableId
          AssocId      = $assoc.RouteTableAssociationId
        }
      }
    }
  }
  foreach ($rtb in $routeTables.RouteTables) {
    foreach ($assoc in $rtb.Associations) {
      if ($assoc.Main -eq $true) {
        return @{
          RouteTableId = $rtb.RouteTableId
          AssocId      = $assoc.RouteTableAssociationId
        }
      }
    }
  }
  return $null
}

$pub1Assoc = if ($pub1) { Find-RtbForSubnet -subnetId $pub1.SubnetId -routeTables $rtbs } else { $null }
$pub2Assoc = if ($pub2) { Find-RtbForSubnet -subnetId $pub2.SubnetId -routeTables $rtbs } else { $null }
$pri1Assoc = if ($pri1) { Find-RtbForSubnet -subnetId $pri1.SubnetId -routeTables $rtbs } else { $null }
$pri2Assoc = if ($pri2) { Find-RtbForSubnet -subnetId $pri2.SubnetId -routeTables $rtbs } else { $null }

$natResp = AwsJson -ArgList @("ec2", "describe-nat-gateways", "--region", $Region, "--filter", "Name=vpc-id,Values=$VpcId", "--filter", "Name=state,Values=available,pending", "--output", "json")
$nat = $natResp.NatGateways | Where-Object { $_.VpcId -eq $VpcId } | Sort-Object NatGatewayId | Select-Object -First 1
$natId = if ($nat) { $nat.NatGatewayId } else { "" }
$natEip = if ($nat -and $nat.NatGatewayAddresses.Count -gt 0) { $nat.NatGatewayAddresses[0].AllocationId } else { "" }

Write-Host ""
Write-Host "===== Discovery Summary ====="
Write-Host "Account: $accountId"
Write-Host "Region : $Region"
Write-Host "VPC    : $VpcId"
Write-Host "AZs    : $az1, $az2"
Write-Host ""

Write-Host "===== tfvars snippet ($Env) ====="
Write-Host "aws_region               = `"$Region`""
Write-Host "vpc_id                   = `"$VpcId`""
Write-Host "public_subnet_1_id       = `"$($pub1.SubnetId)`""
Write-Host "public_subnet_1_cidr     = `"$($pub1.CidrBlock)`""
Write-Host "public_subnet_1_az       = `"$az1`""
Write-Host "public_subnet_2_id       = `"$($pub2.SubnetId)`""
Write-Host "public_subnet_2_cidr     = `"$($pub2.CidrBlock)`""
Write-Host "public_subnet_2_az       = `"$az2`""
Write-Host "private_subnet_1_id      = `"$($pri1.SubnetId)`""
Write-Host "private_subnet_1_cidr    = `"$($pri1.CidrBlock)`""
Write-Host "private_subnet_1_az      = `"$az1`""
Write-Host "private_subnet_2_id      = `"$($pri2.SubnetId)`""
Write-Host "private_subnet_2_cidr    = `"$($pri2.CidrBlock)`""
Write-Host "private_subnet_2_az      = `"$az2`""
Write-Host "igw_id                   = `"$igwId`""
Write-Host "nat_gateway_id           = `"$natId`""
Write-Host "nat_eip_allocation_id    = `"$natEip`""
Write-Host "public_route_table_id    = `"$($pub1Assoc.RouteTableId)`""
Write-Host "private_route_table_1_id = `"$($pri1Assoc.RouteTableId)`""
Write-Host "private_route_table_2_id = `"$($pri2Assoc.RouteTableId)`""
Write-Host "public_rtb_assoc_1_id    = `"$($pub1Assoc.AssocId)`""
Write-Host "public_rtb_assoc_2_id    = `"$($pub2Assoc.AssocId)`""
Write-Host "private_rtb_assoc_1_id   = `"$($pri1Assoc.AssocId)`""
Write-Host "private_rtb_assoc_2_id   = `"$($pri2Assoc.AssocId)`""
Write-Host ""
Write-Host "# env-specific names"
Write-Host "backend_sg_name          = `"healthcare-backend-sg-$Env-tf`""
Write-Host "backend_instance_name    = `"NodeJS-Backend-$($Env.Substring(0,1).ToUpper()+$Env.Substring(1))-Terraform`""
Write-Host "alb_name                 = `"healthcare-backend-$Env-alb`""
Write-Host "target_group_name        = `"healthcare-backend-$Env-tg`""
Write-Host "alarm_prefix             = `"uit-healthcare-$Env`""
Write-Host ""
Write-Host "# keep lock enabled unless you intentionally share IDs"
Write-Host "allow_nondev_plan_with_shared_ids = false"
