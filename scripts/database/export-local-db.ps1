param(
  [string]$Server = 'localhost,1433',
  [ValidateSet('sv_dut','Studentpage_Integration_20261103')][string]$Database = 'sv_dut',
  [Parameter(Mandatory=$true)][string]$SmoDirectory,
  [string]$OutputDirectory,
  [switch]$IncludePrivateData
)
$ErrorActionPreference = 'Stop'
if ($Server -notmatch '^(localhost|127\.0\.0\.1|\[::1\]),\d{1,5}$') {
  throw 'Export requires a loopback SQL Server instance.'
}
$exportRoot = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../Database_newversion')) }
New-Item -ItemType Directory -Path $exportRoot -Force | Out-Null
foreach ($library in @('Microsoft.SqlServer.ConnectionInfo.dll','Microsoft.SqlServer.Management.Sdk.Sfc.dll','Microsoft.SqlServer.SqlEnum.dll','Microsoft.SqlServer.Smo.dll')) {
  Add-Type -Path (Join-Path $SmoDirectory $library)
}
$localServer = New-Object Microsoft.SqlServer.Management.Smo.Server $Server
$localServer.ConnectionContext.StatementTimeout = 300
$utf8 = New-Object System.Text.UTF8Encoding $false
function Write-SqlScript($Path, $Batches) {
  $writer = New-Object System.IO.StreamWriter($Path, $false, $utf8)
  try {
    foreach ($batch in $Batches) {
      $text = [string]$batch
      if ([IO.Path]::GetFileName($Path) -eq '01-schema.sql') {
        $text = [regex]::Replace($text, '(?m)[ \t]+\r?$', '')
      } elseif ($text.StartsWith('SET IDENTITY_INSERT ')) { $text = $text.TrimEnd() }
      $writer.WriteLine($text); $writer.WriteLine('GO')
    }
  } finally { $writer.Dispose() }
}
try {
  $localServer.ConnectionContext.Connect()
  $db = $localServer.Databases[$Database]
  if ($null -eq $db) { throw 'Local database does not exist.' }
  $tables = @($db.Tables | Where-Object { -not $_.IsSystemObject })
  $objects = @($tables) + @($db.Views | Where-Object { -not $_.IsSystemObject }) +
    @($db.StoredProcedures | Where-Object { -not $_.IsSystemObject }) +
    @($db.UserDefinedFunctions | Where-Object { -not $_.IsSystemObject }) + @($db.UserDefinedDataTypes) + @($db.Sequences)
  $scripter = New-Object Microsoft.SqlServer.Management.Smo.Scripter $localServer
  $scripter.Options.ScriptSchema = $true
  $scripter.Options.ScriptData = $false
  $scripter.Options.WithDependencies = $false
  $scripter.Options.DriAll = $true
  $scripter.Options.Indexes = $true
  $scripter.Options.Triggers = $true
  $scripter.Options.ExtendedProperties = $true
  $scripter.Options.IncludeDatabaseContext = $false
  $scripter.Options.NoCollation = $false
  $scripter.Options.ScriptBatchTerminator = $false
  $insertOptions = 'SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET CONCAT_NULL_YIELDS_NULL ON; SET ARITHABORT ON; SET NUMERIC_ROUNDABORT OFF;'
  $urns = [Microsoft.SqlServer.Management.Sdk.Sfc.Urn[]]@($objects | ForEach-Object { $_.Urn })
  $schemaBatches = @($db.Schemas | Where-Object { $_.Name -in @('auth','certification','academic_leave','svc_demo') } | ForEach-Object {
    'CREATE SCHEMA [' + $_.Name + '] AUTHORIZATION [dbo];'
  }) + @($scripter.EnumScript($urns))
  Write-SqlScript (Join-Path $exportRoot '01-schema.sql') $schemaBatches
  Write-Host 'Schema exported.'
  # Explicit allowlist: never export accounts, sessions, evidence or student records to Git.
  $catalogNames = @(
    'auth.Fields','auth.Tasks','auth.TaskPermissions','auth.Permissions','auth.Roles','auth.RolePermissions',
    'auth.PermissionDefinitions','auth.RoleDefinitions',
    'certification.Languages','certification.CertificateTypes','certification.CertificateLevels',
    'certification.IssuingOrganizations','certification.CertificateTypeIssuers','certification.RecognitionPolicies','certification.tmCNTTChungChi',
    'svc_demo.LoaiDon','svc_demo.TruongLoaiDon','svc_demo.QuyenRBAC','svc_demo.tmKehoach','svc_demo.tmNganhTQ',
    'svc_demo.Sys_VanBan','svc_demo.Sys_Email'
  )
  $scripter.Options.ScriptSchema = $false
  $scripter.Options.ScriptData = $true
  $scripter.Options.WithDependencies = $false
  $catalogUrns = [Microsoft.SqlServer.Management.Sdk.Sfc.Urn[]]@($tables | Where-Object {
    ($_.Schema + '.' + $_.Name) -in $catalogNames
  } | ForEach-Object { $_.Urn })
  $catalogBatches = @($insertOptions, 'SET XACT_ABORT ON;', 'BEGIN TRANSACTION;') +
    @($tables | ForEach-Object { 'ALTER TABLE ' + $_.ToString() + ' NOCHECK CONSTRAINT ALL;' }) +
    @($scripter.EnumScript($catalogUrns))
  # Settings are allowlisted by key: workbookSigningKey is a secret, not a catalog.
  $settings = $db.ExecuteWithResults("SELECT MaCauHinh,GiaTri,NgayDongBo FROM svc_demo.CauHinh WHERE MaCauHinh IN('currentTerm','catalogSource','rbacInitialized','workflowPermissionsInitialized') ORDER BY MaCauHinh").Tables[0]
  foreach ($row in $settings.Rows) {
    $key = ([string]$row.MaCauHinh).Replace("'", "''")
    $value = ([string]$row.GiaTri).Replace("'", "''")
    $date = ([datetime]$row.NgayDongBo).ToString('yyyy-MM-ddTHH:mm:ss.fffffff', [Globalization.CultureInfo]::InvariantCulture)
    $catalogBatches += "INSERT svc_demo.CauHinh(MaCauHinh,GiaTri,NgayDongBo) VALUES(N'$key',N'$value',CONVERT(datetime2,N'$date',126));"
  }
  # Each restored environment gets a new key; the source key never leaves its DB.
  $catalogBatches += "INSERT svc_demo.CauHinh(MaCauHinh,GiaTri) VALUES('workbookSigningKey',CONVERT(varchar(64),CRYPT_GEN_RANDOM(32),2));"
  $catalogBatches +=
    @($tables | ForEach-Object { 'ALTER TABLE ' + $_.ToString() + ' WITH CHECK CHECK CONSTRAINT ALL;' }) + @('COMMIT;')
  Write-SqlScript (Join-Path $exportRoot '02-catalogs.sql') $catalogBatches
  Write-Host 'Shareable catalogs exported.'
  if ($IncludePrivateData) {
    $allUrns = [Microsoft.SqlServer.Management.Sdk.Sfc.Urn[]]@($tables | ForEach-Object { $_.Urn })
    $privateBatches = @($insertOptions, 'SET XACT_ABORT ON;', 'BEGIN TRANSACTION;') +
      @($tables | ForEach-Object { 'ALTER TABLE ' + $_.ToString() + ' NOCHECK CONSTRAINT ALL;' }) +
      @($scripter.EnumScript($allUrns)) +
      @($tables | ForEach-Object { 'ALTER TABLE ' + $_.ToString() + ' WITH CHECK CHECK CONSTRAINT ALL;' }) + @('COMMIT;')
    Write-SqlScript (Join-Path $exportRoot 'local-data.private.sql') $privateBatches
  }
  Write-Host ('Exported local schema and catalogs from ' + $Database + '. No database changes performed.')
} finally { $localServer.ConnectionContext.Disconnect() }
