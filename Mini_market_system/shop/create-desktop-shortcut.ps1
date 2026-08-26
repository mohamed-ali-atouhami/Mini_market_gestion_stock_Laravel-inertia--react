# Puts "Mini market" on this Windows desktop. Run once:
# powershell -ExecutionPolicy Bypass -File Mini_market_system\shop\create-desktop-shortcut.ps1

$ErrorActionPreference = 'Stop'

$shopDir = $PSScriptRoot
$vbs = Join-Path $shopDir 'start-shop.vbs'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Mini market.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $vbs
$shortcut.WorkingDirectory = Split-Path -Parent $shopDir
$shortcut.WindowStyle = 7
$shortcut.Description = 'Open Mini market. Closing this window stops the shop server.'
$shortcut.Save()

Write-Host "Shortcut created: $lnkPath"
Write-Host "Double-click Mini market on the desktop. It opens http://127.0.0.1:8000"
