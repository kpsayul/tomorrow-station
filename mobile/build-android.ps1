param([switch]$Bundle)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
$studioJava = 'C:/Program Files/Android/Android Studio/jbr'
if (-not (Test-Path (Join-Path $sdkRoot 'platform-tools/adb.exe'))) { throw 'Android SDK not found. Set ANDROID_HOME.' }
if (Test-Path (Join-Path $studioJava 'bin/java.exe')) { $env:JAVA_HOME = $studioJava }
$env:ANDROID_HOME = $sdkRoot
Push-Location $repoRoot
try {
    & node mobile/build.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Mobile web build failed.' }
    & node node_modules/@capacitor/cli/bin/capacitor sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }
    Push-Location android
    try {
        $task = if ($Bundle) { 'bundleRelease' } else { 'assembleDebug' }
        # Release build memory when finished; keep background work modest on this PC.
        & ./gradlew.bat $task --console=plain --no-daemon --max-workers=2
        if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Path artifacts -Force | Out-Null
    if ($Bundle) {
        Copy-Item -LiteralPath 'android/app/build/outputs/bundle/release/app-release.aab' -Destination 'artifacts/tomorrow-station-release-unsigned.aab'
        Write-Output 'Built unsigned release bundle. Sign with your upload key before Play Console upload.'
    } else {
        Copy-Item -LiteralPath 'android/app/build/outputs/apk/debug/app-debug.apk' -Destination 'artifacts/tomorrow-station-debug.apk'
        Write-Output 'Built artifacts/tomorrow-station-debug.apk'
    }
} finally { Pop-Location }
