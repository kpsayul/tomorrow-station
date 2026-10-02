param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$backupPath = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $backupPath) { throw 'Destination already exists; refusing to replace it.' }
$sourceFolder = Join-Path $env:LOCALAPPDATA 'TomorrowStation/signing'
$keytool = 'C:/Program Files/Android/Android Studio/jbr/bin/keytool.exe'
$backupPassword = Read-Host 'Choose a password for this portable key backup (at least 12 characters)' -AsSecureString
$backupCredential = New-Object System.Management.Automation.PSCredential('backup',$backupPassword)
try {
    $env:TOMORROW_BACKUP_PASSWORD = $backupCredential.GetNetworkCredential().Password
    if ($env:TOMORROW_BACKUP_PASSWORD.Length -lt 12) { throw 'Use at least 12 characters.' }
    $sourceCredential = Import-Clixml -LiteralPath (Join-Path $sourceFolder 'upload-password.clixml')
    $env:TOMORROW_UPLOAD_PASSWORD = $sourceCredential.GetNetworkCredential().Password
    $ErrorActionPreference = 'Continue'
    & $keytool '-J-Duser.language=en' -importkeystore -srckeystore (Join-Path $sourceFolder 'upload.jks') -srcstoretype JKS -srcalias upload -srcstorepass:env TOMORROW_UPLOAD_PASSWORD -srckeypass:env TOMORROW_UPLOAD_PASSWORD -destkeystore $backupPath -deststoretype PKCS12 -destalias upload -deststorepass:env TOMORROW_BACKUP_PASSWORD -destkeypass:env TOMORROW_BACKUP_PASSWORD -noprompt 2>&1 | ForEach-Object { $_.ToString() }
    if ($LASTEXITCODE -ne 0) { throw 'Key export failed.' }
    Write-Output "Portable encrypted key backup created: $backupPath"
    Write-Output 'Keep its password separately. This backup contains the private upload key; do not publish it.'
} finally {
    Remove-Item Env:TOMORROW_BACKUP_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:TOMORROW_UPLOAD_PASSWORD -ErrorAction SilentlyContinue
    $sourceCredential=$null; $backupCredential=$null; $backupPassword=$null
}
