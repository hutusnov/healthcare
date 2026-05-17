param(
  [Parameter(Mandatory = $true)]
  [ValidateSet(
    "uit-healthcare-root",
    "uit-healthcare-openstack-runtime",
    "uit-healthcare-aws-backend",
    "uit-healthcare-private-ocr"
  )]
  [string]$App,

  [string]$Namespace = "argocd",
  [switch]$RequireSynced,
  [switch]$AllowAutoSync
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

Write-Host "Running pre-sync safety check for Argo CD app '$App'..."
Write-Host "Kubernetes context: $(& kubectl config current-context)"

$application = Invoke-KubectlJson @("-n", $Namespace, "get", "application", $App)

$syncStatus = $application.status.sync.status
$healthStatus = $application.status.health.status
$repoUrl = $application.spec.source.repoURL
$targetRevision = $application.spec.source.targetRevision
$sourcePath = $application.spec.source.path
$destinationNamespace = $application.spec.destination.namespace
$autoSyncEnabled = [bool]$application.spec.syncPolicy.automated

[PSCustomObject]@{
  App                  = $App
  Sync                 = $syncStatus
  Health               = $healthStatus
  Repo                 = $repoUrl
  TargetRevision       = $targetRevision
  SourcePath           = $sourcePath
  DestinationNamespace = $destinationNamespace
  AutoSync             = $autoSyncEnabled
} | Format-List

if ($repoUrl -ne "https://github.com/hutusnov/healthcare.git") {
  throw "Unexpected repoURL for ${App}: $repoUrl"
}

if ($targetRevision -ne "main") {
  throw "Unexpected targetRevision for ${App}: $targetRevision"
}

if ($sourcePath -and -not (Test-Path -LiteralPath $sourcePath)) {
  throw "Application source path does not exist locally: $sourcePath"
}

if ($autoSyncEnabled -and -not $AllowAutoSync) {
  throw "Auto-sync is enabled for $App. Refusing to continue without -AllowAutoSync."
}

if ($healthStatus -eq "Degraded") {
  throw "$App is Degraded. Investigate workload status before syncing."
}

if ($RequireSynced -and $syncStatus -ne "Synced") {
  throw "$App is $syncStatus, expected Synced because -RequireSynced was provided."
}

Write-Host "Pre-sync safety check passed for '$App'."
Write-Host "Next safe step: review the Argo CD diff in UI/CLI, then sync only this app if the diff is expected."
