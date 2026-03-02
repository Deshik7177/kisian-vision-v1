$ErrorActionPreference = 'Stop'

$base = "http://127.0.0.1:5000"

function Print-Status($label, $ok, $value) {
    $state = if ($ok) { "OK" } else { "ISSUE" }
    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host ("[{0}] {1}: {2}" -f $state, $label, $value) -ForegroundColor $color
}

try {
    $health = Invoke-RestMethod -Uri "$base/health" -Method GET -TimeoutSec 6
    Print-Status "Backend" ($health.status -eq "ok") ("mode=" + $health.mode)
} catch {
    Print-Status "Backend" $false "Not reachable"
    exit 1
}

try {
    $status = Invoke-RestMethod -Uri "$base/presentation-status?commodity=Rice" -Method GET -TimeoutSec 10

    Print-Status "Field Node" ([bool]$status.field_node.connected) ("connected=" + $status.field_node.connected + ", age_seconds=" + $status.field_node.age_seconds)
    Print-Status "Storage Node" ([bool]$status.storage_node.connected) ("connected=" + $status.storage_node.connected + ", age_seconds=" + $status.storage_node.age_seconds)

    $isLiveMarket = (($status.market_source -as [string]) -eq "data.gov.in")
    Print-Status "Market Source" $isLiveMarket ("source=" + $status.market_source)

    $demoReady = [bool]$status.ready_for_demo
    Print-Status "Demo Ready" $demoReady ("ready_for_demo=" + $status.ready_for_demo)

    if (-not $isLiveMarket -and $status.market_note) {
        Write-Host ("Market Note: " + $status.market_note) -ForegroundColor Yellow
    }
} catch {
    Print-Status "Presentation Status" $false "Failed to fetch /presentation-status"
    exit 1
}
