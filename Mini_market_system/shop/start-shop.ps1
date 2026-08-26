# Opens Mini market in its own window. Closing that window stops PHP.
# Other Chrome/Edge windows are not touched (separate browser profile).

$ErrorActionPreference = 'Stop'

$appRoot = Split-Path -Parent $PSScriptRoot
$port = 8000
$url = "http://127.0.0.1:$port"
$profileDir = Join-Path $env:LOCALAPPDATA 'MiniMarketShop\browser'

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

if (-not (Test-ShopPort)) {
    $php = Get-Command php -ErrorAction SilentlyContinue
    if (-not $php) {
        Show-ShopMessage "PHP was not found. Install XAMPP or Laragon, then try again."
        exit 1
    }

    Start-Process -FilePath $php.Source -ArgumentList @(
        'artisan', 'serve', "--host=127.0.0.1", "--port=$port"
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
