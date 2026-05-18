param(
  [string]$Namespace = "argocd",
  [string[]]$ExpectedApps = @(
    "uit-healthcare-root",
    "uit-healthcare-openstack-runtime",
    "uit-healthcare-aws-backend",
    "uit-healthcare-private-ocr"
  ),
  [switch]$FailOnOutOfSync,
  [switch]$FailOnDegraded
)

$ErrorActionPreference = "Stop"

function Invoke-KubectlJson {
  param([string[]]$Arguments)

  $output = & kubectl @Arguments -o json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "kubectl $($Arguments -join ' ') failed:`n$output"
  }

  return $output | ConvertFrom-Json
}

Write-Host "Checking Argo CD Applications in namespace '$Namespace'..."
Write-Host "Kubernetes context: $(& kubectl config current-context)"

$apps = Invoke-KubectlJson @("-n", $Namespace, "get", "applications.argoproj.io")
$items = @($apps.items)

if ($items.Count -eq 0) {
  throw "No Argo CD Applications found in namespace '$Namespace'."
}

$rows = foreach ($app in $items) {
  [PSCustomObject]@{
    Name       = $app.metadata.name
    Sync       = $app.status.sync.status
    Health     = $app.status.health.status
    Revision   = $app.status.sync.revision
    Repo       = $app.spec.source.repoURL
    Path       = $app.spec.source.path
    Namespace  = $app.spec.destination.namespace
    AutoSync   = [bool]$app.spec.syncPolicy.automated
  }
}

$rows | Sort-Object Name | Format-Table -AutoSize

$names = @($rows | ForEach-Object { $_.Name })
$missing = @($ExpectedApps | Where-Object { $_ -notin $names })
if ($missing.Count -gt 0) {
  throw "Missing expected Argo CD apps: $($missing -join ', ')"
}

$autoSyncApps = @($rows | Where-Object { $_.AutoSync })
if ($autoSyncApps.Count -gt 0) {
  throw "Auto-sync is enabled for: $(@($autoSyncApps.Name) -join ', '). Keep manual sync until runtime readiness is confirmed."
}

$degraded = @($rows | Where-Object { $_.Health -eq "Degraded" })
if ($degraded.Count -gt 0) {
  $message = "Degraded Argo CD apps: $(@($degraded.Name) -join ', ')"
  if ($FailOnDegraded) {
    throw $message
  }
  Write-Warning $message
}

$outOfSync = @($rows | Where-Object { $_.Sync -ne "Synced" })
if ($outOfSync.Count -gt 0) {
  $message = "OutOfSync Argo CD apps: $(@($outOfSync.Name) -join ', ')"
  if ($FailOnOutOfSync) {
    throw $message
  }
  Write-Warning $message
}

Write-Host "Argo CD live status check completed."
