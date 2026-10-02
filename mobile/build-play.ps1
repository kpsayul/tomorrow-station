param([switch]$InitializeUploadKey)
$ErrorActionPreference = 'Stop'
$releaseRoot = Split-Path -Parent $PSScriptRoot
$releaseJava = 'C:/Program Files/Android/Android Studio/jbr'
$releaseSdk = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
$signingDirectory = Join-Path $env:LOCALAPPDATA 'TomorrowStation/signing'
$uploadStore = Join-Path $signingDirectory 'upload.jks'
$uploadCredential = Join-Path $signingDirectory 'upload-password.clixml'
$keytool = Join-Path $releaseJava 'bin/keytool.exe'
$jarsigner = Join-Path $releaseJava 'bin/jarsigner.exe'
function Invoke-SigningTool([string]$Tool, [string[]]$ToolArguments) {
    $previousPreference = $ErrorActionPreference
    try {
        # Java tools write informational output to stderr even on success.
        $ErrorActionPreference = 'Continue'
        & $Tool '-J-Duser.language=en' '-J-Duser.country=US' @ToolArguments 2>&1 | ForEach-Object { $_.ToString() }
        $toolExitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousPreference }
    if ($toolExitCode -ne 0) { throw "Signing tool failed with exit code $toolExitCode" }
}
if (!(Test-Path -LiteralPath $keytool)) { throw 'Android Studio Java not found.' }
$env:JAVA_HOME = $releaseJava
$env:ANDROID_HOME = $releaseSdk
Push-Location $releaseRoot
try {
    if (!(Test-Path -LiteralPath $uploadStore)) {
        if (!$InitializeUploadKey) { throw 'No upload key. Run once with -InitializeUploadKey to create it.' }
        if (Test-Path -LiteralPath $uploadCredential) { throw 'Partial signing setup. Recover the existing key; do not silently replace it.' }
        New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null
        # Limit the signing folder to this Windows user and SYSTEM.
        $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        & icacls.exe $signingDirectory /inheritance:r /grant:r "*$($sid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Cannot protect signing folder.' }
        $bytes = New-Object byte[] 32
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $password = [Convert]::ToBase64String($bytes)
        $secret = ConvertTo-SecureString $password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential('upload', $secret)
        $credential | Export-Clixml -LiteralPath $uploadCredential
        $env:TOMORROW_UPLOAD_PASSWORD = $password
        Invoke-SigningTool $keytool @('-genkeypair','-keystore',$uploadStore,'-storetype','JKS','-alias','upload','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Tomorrow Station Upload','-storepass:env','TOMORROW_UPLOAD_PASSWORD','-keypass:env','TOMORROW_UPLOAD_PASSWORD')
        Write-Output "Created upload key outside the repository: $uploadStore"
    }
    if (!(Test-Path -LiteralPath $uploadCredential)) { throw 'Key exists but its protected password is missing. Recover it before building.' }
    $credential = Import-Clixml -LiteralPath $uploadCredential
    $env:TOMORROW_UPLOAD_PASSWORD = $credential.GetNetworkCredential().Password
    $env:TOMORROW_UPLOAD_STORE = $uploadStore
    & node mobile/build.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Mobile asset build failed.' }
    & node node_modules/@capacitor/cli/bin/capacitor sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }
    Push-Location android
    try {
        & ./gradlew.bat bundleRelease assembleRelease --console=plain --no-daemon --max-workers=2
        if ($LASTEXITCODE -ne 0) { throw 'Release build failed.' }
    } finally { Pop-Location }
    $gradle = Get-Content -Raw -Encoding UTF8 android/app/build.gradle
    $version = [regex]::Match($gradle, 'versionName "([^"]+)"').Groups[1].Value
    $output = Join-Path $releaseRoot 'artifacts/play-store'
    New-Item -ItemType Directory -Path $output -Force | Out-Null
    $bundle = Join-Path $output "tomorrow-station-$version.aab"
    Copy-Item -LiteralPath android/app/build/outputs/bundle/release/app-release.aab -Destination $bundle
    Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination (Join-Path $output "tomorrow-station-$version-release.apk")
    $verification = Invoke-SigningTool $jarsigner @('-verify',$bundle)
    $verification | Write-Output
    if (!($verification -match '^jar verified\.$')) { throw 'AAB is not reported as signed and verified.' }
    Invoke-SigningTool $keytool @('-exportcert','-rfc','-keystore',$uploadStore,'-alias','upload','-storepass:env','TOMORROW_UPLOAD_PASSWORD','-file',(Join-Path $output 'upload-certificate.pem'))
    Write-Output "Signed AAB ready: $bundle"
    Write-Output 'The public certificate can be shared. Keep the signing folder private and back it up before publishing.'
} finally {
    Remove-Item Env:TOMORROW_UPLOAD_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:TOMORROW_UPLOAD_STORE -ErrorAction SilentlyContinue
    $password = $null; $credential = $null; $secret = $null
    Pop-Location
}
