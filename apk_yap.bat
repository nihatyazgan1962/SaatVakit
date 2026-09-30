@echo off
color 0A
title SAAT VAKIT APK Olusturucu
echo ========================================================
echo   SAAT VAKIT APK Olusturucu Baslatiliyor...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0apk_yap.ps1"
