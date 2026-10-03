$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "   SAAT VAKIT APK OLUSTURUCU BASLADI   " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$rootDir = $PSScriptRoot
$androidDir = Join-Path $rootDir "android"
$wwwDir = Join-Path $rootDir "www"

# 1. Web dosyalarını Vite ile derle
Write-Host "`n[1/4] Web projesi derleniyor (npm run build)..." -ForegroundColor Cyan
npm run build

# 2. Android SDK ve Ortam Değişkenlerini Ayarla
Write-Host "[2/4] Ortam degiskenleri ve Android SDK kontrol ediliyor..." -ForegroundColor Cyan

$androidSdkPath = "C:\Users\Nihat\AppData\Local\Android\Sdk"
if (-not (Test-Path $androidSdkPath)) {
    if (Test-Path "C:\Users\Nihat\Android\Sdk") {
        $androidSdkPath = "C:\Users\Nihat\Android\Sdk"
    }
}

$env:ANDROID_HOME = $androidSdkPath
$env:ANDROID_SDK_ROOT = $androidSdkPath
$env:PATH = "$androidSdkPath\platform-tools;$androidSdkPath\tools;$env:PATH"

# local.properties güncelle
$localProperties = Join-Path $androidDir "local.properties"
$sdkDirEscaped = $androidSdkPath -replace '\\', '\\'
"sdk.dir=$sdkDirEscaped" | Out-File -FilePath $localProperties -Encoding ASCII -Force

# 3. Capacitor Senkronizasyonu
Write-Host "[3/4] Capacitor Android projesi senkronize ediliyor..." -ForegroundColor Cyan
Set-Location $rootDir
npx cap sync android

# 4. APK Derleme
Write-Host "[4/4] APK derlemesi basliyor (assembleDebug)..." -ForegroundColor Cyan
Set-Location $androidDir
.\gradlew.bat assembleDebug --no-daemon -x lint

if ($LASTEXITCODE -eq 0) {
    $apk = Get-ChildItem -Path "$androidDir\app\build\outputs\apk\debug\" -Filter '*.apk' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($apk) {
        $targetApk1 = Join-Path $rootDir "SaatVeNamazVakti.apk"
        $targetApk2 = Join-Path $rootDir "SaatVakit.apk"
        Copy-Item -Path $apk.FullName -Destination $targetApk1 -Force
        Copy-Item -Path $apk.FullName -Destination $targetApk2 -Force
        $sizeMB = [math]::Round((Get-Item $targetApk1).Length / 1MB, 2)
        
        Write-Host "`n========================================================" -ForegroundColor Green
        Write-Host "  TEBRIKLER! APK BASARIYLA OLUSTURULDU: SaatVeNamazVakti.apk" -ForegroundColor Green
        Write-Host "  Konum: $targetApk1 ($sizeMB MB)" -ForegroundColor Green
        Write-Host "========================================================`n" -ForegroundColor Green
    } else {
        Write-Host "`nHATA: APK dosyasi ciktisi bulunamadi." -ForegroundColor Red
    }
} else {
    Write-Host "`nHATA: Gradle derlemesi basarisiz oldu. Exit code: $LASTEXITCODE" -ForegroundColor Red
}

Set-Location $rootDir