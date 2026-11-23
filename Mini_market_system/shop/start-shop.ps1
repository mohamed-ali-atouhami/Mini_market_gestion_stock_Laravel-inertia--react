# Opens Mini market in its own window. Closing that window stops PHP.
# Other Chrome/Edge windows are not touched (separate browser profile).
# A local opening screen appears immediately. The sign-in page is warmed
# behind it, then the window moves there.

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

function Get-FreeShopSplashPort {
    $tcp = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback, 0)
    $tcp.Start()
    $port = ([System.Net.IPEndPoint] $tcp.LocalEndpoint).Port
    $tcp.Stop()
    return $port
}

function Start-ShopSplashServer {
    param(
        [int] $Port,
        [string] $HtmlPath,
        [string] $LogoPath,
        [string] $BgPath
    )

    $state = [hashtable]::Synchronized(@{ Listener = $null })
    $started = New-Object System.Threading.ManualResetEvent $false
    $ready = New-Object System.Threading.ManualResetEvent $false
    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.Open()
    $worker = [powershell]::Create()
    $worker.Runspace = $runspace

    $null = $worker.AddScript({
        param($Port, $HtmlPath, $LogoPath, $BgPath, $State, $Started, $Ready)

        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://127.0.0.1:$Port/")
        $listener.Start()
        $State.Listener = $listener
        $Started.Set() | Out-Null

        while ($listener.IsListening) {
            try {
                $context = $listener.GetContext()
            } catch {
                break
            }

            try {
                $path = $context.Request.Url.AbsolutePath
                $type = 'text/html; charset=utf-8'
                $file = $HtmlPath

                if ($path -eq '/logo.png') {
                    $file = $LogoPath
                    $type = 'image/png'
                } elseif ($path -eq '/bg.jpg') {
                    $file = $BgPath
                    $type = 'image/jpeg'
                } elseif ($path -eq '/status') {
                    $context.Response.StatusCode = $(if ($Ready.WaitOne(0)) { 204 } else { 503 })
                    $context.Response.Headers['Cache-Control'] = 'no-store'
                    $context.Response.ContentLength64 = 0
                    $context.Response.OutputStream.Close()
                    continue
                }

                if (-not (Test-Path -LiteralPath $file)) {
                    $context.Response.StatusCode = 404
                    $context.Response.ContentLength64 = 0
                    $context.Response.OutputStream.Close()
                    continue
                }

                $bytes = [System.IO.File]::ReadAllBytes($file)
                $context.Response.StatusCode = 200
                $context.Response.ContentType = $type
                $context.Response.Headers['Cache-Control'] = 'no-store'
                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                $context.Response.OutputStream.Close()
            } catch {
                try { $context.Response.Abort() } catch {}
            }
        }
    }).AddArgument($Port).AddArgument($HtmlPath).AddArgument($LogoPath).AddArgument($BgPath).AddArgument($state).AddArgument($started).AddArgument($ready)

    $handle = $worker.BeginInvoke()

    if (-not $started.WaitOne(5000) -or -not $state.Listener) {
        try { $state.Listener.Stop() } catch {}
        try { $worker.Dispose() } catch {}
        try { $runspace.Close() } catch {}
        throw 'The opening screen did not start.'
    }

    return [pscustomobject]@{
        State = $state
        Ready = $ready
        Worker = $worker
        Handle = $handle
        Runspace = $runspace
    }
}

function Stop-ShopSplashServer($Server) {
    if (-not $Server) {
        return
    }

    try {
        if ($Server.State.Listener) {
            $Server.State.Listener.Stop()
            $Server.State.Listener.Close()
        }
    } catch {}

    try { $Server.Worker.EndInvoke($Server.Handle) } catch {}
    try { $Server.Worker.Dispose() } catch {}
    try { $Server.Runspace.Close() } catch {}
}

function Test-ShopOpcache([string] $PhpExe) {
    $output = & $PhpExe -d zend_extension=php_opcache.dll -d opcache.enable_cli=1 -m 2>&1 | Out-String
    return $output -match 'Zend OPcache'
}

function Get-ShopLocale {
    $allowed = @('en', 'fr', 'es', 'ar')
    $file = Join-Path $appRoot 'storage\app\shop-locale.txt'

    if (Test-Path -LiteralPath $file) {
        $saved = (Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue)
        if ($saved) {
            $saved = $saved.Trim().ToLower()
            if ($allowed -contains $saved) {
                return $saved
            }
        }
    }

    $reader = Join-Path $PSScriptRoot 'read-locale.php'
    $php = Get-Command php -ErrorAction SilentlyContinue
    if ((Test-Path -LiteralPath $reader) -and $php) {
        $found = (& $php.Source $reader 2>$null | Select-Object -Last 1)
        if ($found) {
            $found = "$found".Trim().ToLower()
            if ($allowed -contains $found) {
                return $found
            }
        }
    }

    return 'en'
}

function Open-ShopWindow {
    param(
        [string] $BrowserExe,
        [string] $ProfileDir,
        [string] $TargetUrl
    )

    New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

    Start-Process -FilePath $BrowserExe -ArgumentList @(
        "--user-data-dir=`"$ProfileDir`"",
        "--app=$TargetUrl",
        '--no-first-run',
        '--no-default-browser-check'
    )
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
$serverReady = (Test-ShopPort) -and (Test-ShopLanListen)
$signInUrl = "$url/login"
$splashServer = $null

try {
    if (-not $serverReady) {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Show-ShopMessage "PHP was not found. Install XAMPP or Laragon, then try again."
            exit 1
        }

        $serverPhp = Join-Path $appRoot 'vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'
        if (-not (Test-Path -LiteralPath $serverPhp)) {
            Show-ShopMessage "The shop server file was not found.`n`nRestore the vendor folder, then try again."
            exit 1
        }

        $splashPath = Join-Path $PSScriptRoot 'splash.html'
        $splashUrl = $null

        if (Test-Path -LiteralPath $splashPath) {
            try {
                $splashPort = Get-FreeShopSplashPort
                $splashServer = Start-ShopSplashServer `
                    -Port $splashPort `
                    -HtmlPath $splashPath `
                    -LogoPath (Join-Path $appRoot 'public\images\logo.png') `
                    -BgPath (Join-Path $appRoot 'public\images\sign-in-bg.jpg')
                $shopLocale = Get-ShopLocale
                $splashUrl = "http://127.0.0.1:$splashPort/?lang=$shopLocale&next=$([uri]::EscapeDataString($signInUrl))"
            } catch {
                $splashServer = $null
                $splashUrl = $null
            }
        }

        if ($splashUrl) {
            Open-ShopWindow -BrowserExe $browserExe -ProfileDir $profileDir -TargetUrl $splashUrl
        }

        Ensure-ShopFirewallRule

        if (Test-ShopPort) {
            Stop-ShopPhp
            Start-Sleep -Milliseconds 400
        }

        $phpArgs = @()
        if (Test-ShopOpcache $php.Source) {
            $phpArgs = @(
                '-d', 'zend_extension=php_opcache.dll',
                '-d', 'opcache.enable_cli=1',
                '-d', 'opcache.enable=1',
                '-d', 'opcache.memory_consumption=128',
                '-d', 'opcache.max_accelerated_files=20000',
                '-d', 'opcache.validate_timestamps=1'
            )
        }

        # Same router as `php artisan serve`, started directly so OPcache applies.
        # The router uses the public folder as its current directory.
        $phpArgs += @('-S', "${listenHost}:${port}", $serverPhp)

        Start-Process -FilePath $php.Source -ArgumentList $phpArgs -WorkingDirectory (Join-Path $appRoot 'public') -WindowStyle Hidden

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

        try {
            Invoke-WebRequest -Uri $signInUrl -UseBasicParsing -TimeoutSec 90 | Out-Null
        } catch {
            Show-ShopMessage "The shop server did not open the sign-in page."
            Stop-ShopPhp
            exit 1
        }

        if ($splashServer) {
            $splashServer.Ready.Set() | Out-Null
        } else {
            Open-ShopWindow -BrowserExe $browserExe -ProfileDir $profileDir -TargetUrl $signInUrl
        }
    } else {
        Open-ShopWindow -BrowserExe $browserExe -ProfileDir $profileDir -TargetUrl $url
    }

    Write-ShopPhoneUrl

    # A second click is owned by the first watcher, unless this click
    # showed the opening screen and has to keep that screen alive.
    if ($alreadyOpen -and -not $splashServer) {
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
} finally {
    Stop-ShopSplashServer $splashServer
}
