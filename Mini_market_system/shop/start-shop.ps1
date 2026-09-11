# Opens Mini market in its own window. Closing that window stops PHP.
# Other Chrome/Edge windows are not touched (separate browser profile).

$ErrorActionPreference = 'Stop'

$appRoot = Split-Path -Parent $PSScriptRoot
$port = 8000
$listenHost = '0.0.0.0'
$url = "http://127.0.0.1:$port"
$profileDir = Join-Path $env:LOCALAPPDATA 'MiniMarketShop\browser'
$phoneUrlFile = Join-Path $PSScriptRoot 'phone-url.txt'

Set-Location $appRoot

function Show-ShopMessage([string] $text, [string] $icon = 'Error') {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($text, 'Mini market', 'OK', $icon) | Out-Null
}

function Test-ShopPort {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect('127.0.0.1', $port)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Test-ShopLanListen {
    $lines = netstat -ano | Select-String ":$port\s+"

    foreach ($line in $lines) {
        $text = $line.Line
        if ($text -notmatch 'LISTENING') {
            continue
        }

        if ($text -match '0\.0\.0\.0:8000' -or $text -match '\[::\]:8000') {
            return $true
        }
    }

    return $false
}

function Get-ShopBrowserProcesses {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine -like '*MiniMarketShop*' -and
            ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe')
        }
}

function Stop-ShopPhp {
    $lines = netstat -ano | Select-String ":$port\s+"

    foreach ($line in $lines) {
        $text = $line.Line
        if ($text -notmatch 'LISTENING') {
            continue
        }

        $processId = ($text.Trim() -split '\s+')[-1]
        if ($processId -notmatch '^\d+$') {
            continue
        }

        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq 'php') {
            Stop-Process -Id $processId -Force
        }
    }
}

function Get-ShopLanIps {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -and
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*'
        } |
        Select-Object -ExpandProperty IPAddress -Unique
}

function Write-ShopPhoneUrl {
    $ips = @(Get-ShopLanIps)
    $lines = @(
        'Open one of these on your phone (same Wi-Fi as this PC).',
        'The PC must stay on, and the Mini market window must stay open.',
        ''
    )

    if ($ips.Count -eq 0) {
        $lines += 'No Wi-Fi address was found. Connect this PC to the shop Wi-Fi, then start Mini market again.'
    } else {
        foreach ($ip in $ips) {
            $lines += "http://${ip}:${port}"
        }
    }

    $lines += ''
    $lines += 'If the phone cannot open the page, right-click shop\enable-phone-access.ps1 and Run with PowerShell as Administrator once.'

    Set-Content -Path $phoneUrlFile -Value $lines -Encoding UTF8
}

function Ensure-ShopFirewallRule {
    $name = 'Mini market shop'

    try {
        if (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue) {
            return
        }

        New-NetFirewallRule -DisplayName $name -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Private,Public | Out-Null
    } catch {
        # Not elevated. Windows may prompt when PHP first listens on the LAN.
    }
}

function Get-ShopBrowserExe {
    $candidates = @(
        (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe')
    )

    foreach ($path in $candidates) {
        if ($path -and (Test-Path $path)) {
            return $path
        }
    }

    return $null
}

$hotFile = Join-Path $appRoot 'public\hot'
if (Test-Path $hotFile) {
    Remove-Item $hotFile -Force
}

$manifest = Join-Path $appRoot 'public\build\manifest.json'
if (-not (Test-Path $manifest)) {
    Show-ShopMessage "The shop UI is not built yet.`n`nOn this PC run:`ncd Mini_market_system`nnpm run build" 'Warning'
    exit 1
}

$browserExe = Get-ShopBrowserExe
if (-not $browserExe) {
    Show-ShopMessage "Chrome or Edge was not found. Install one of them to open the shop."
    exit 1
}

$alreadyOpen = [bool](Get-ShopBrowserProcesses)

Ensure-ShopFirewallRule

if (-not (Test-ShopPort) -or -not (Test-ShopLanListen)) {
    $php = Get-Command php -ErrorAction SilentlyContinue
    if (-not $php) {
        Show-ShopMessage "PHP was not found. Install XAMPP or Laragon, then try again."
        exit 1
    }

    if (Test-ShopPort) {
        Stop-ShopPhp
        Start-Sleep -Milliseconds 400
    }

    Start-Process -FilePath $php.Source -ArgumentList @(
        'artisan', 'serve', "--host=$listenHost", "--port=$port"
    ) -WorkingDirectory $appRoot -WindowStyle Hidden

    $ready = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Milliseconds 250
        if (Test-ShopPort) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Show-ShopMessage "The shop server did not start on port $port."
        exit 1
    }
}

Write-ShopPhoneUrl

New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

Start-Process -FilePath $browserExe -ArgumentList @(
    "--user-data-dir=`"$profileDir`"",
    "--app=$url",
    '--no-first-run',
    '--no-default-browser-check'
)

if ($alreadyOpen) {
    exit 0
}

Start-Sleep -Seconds 2

if (-not (Get-ShopBrowserProcesses)) {
    Show-ShopMessage "The shop window did not open."
    Stop-ShopPhp
    exit 1
}

while (Get-ShopBrowserProcesses) {
    Start-Sleep -Seconds 1
}

Stop-ShopPhp
