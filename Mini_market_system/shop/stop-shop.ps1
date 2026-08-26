# Stops the hidden php artisan serve started by the Mini market shortcut.

$port = 8000
$killed = $false

$lines = netstat -ano | Select-String ":$port\s+"

foreach ($line in $lines) {
    $text = $line.Line
    if ($text -notmatch 'LISTENING') {
        continue
    }

    $processId = ($text.Trim() -split '\s+')[-1]
    if ($processId -match '^\d+$') {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq 'php') {
            Stop-Process -Id $processId -Force
            $killed = $true
        }
    }
}

if ($killed) {
    Write-Host "Mini market server on port $port stopped."
} else {
    Write-Host "No Mini market PHP server was listening on port $port."
}
