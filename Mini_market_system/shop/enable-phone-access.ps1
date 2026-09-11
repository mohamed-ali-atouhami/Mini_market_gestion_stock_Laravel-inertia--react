# One-time: allow phones on this Wi-Fi to open the shop on port 8000.
# Right-click > Run with PowerShell. If Windows says access denied, Run as administrator.

$ErrorActionPreference = 'Stop'
$name = 'Mini market shop'
$port = 8000

$existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
if ($existing) {
    $existing | Remove-NetFirewallRule
}

New-NetFirewallRule `
    -DisplayName $name `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $port `
    -Action Allow `
    -Profile Private,Public |
    Out-Null

Write-Host "Phones on this home Wi-Fi can now open Mini market on port $port."
Write-Host "Start Mini market, then open shop\phone-url.txt and type that address on the phone."
