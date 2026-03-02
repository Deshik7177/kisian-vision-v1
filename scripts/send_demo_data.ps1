$ErrorActionPreference = 'Stop'

$base = "http://127.0.0.1:5000"

$fieldPayload = @{
    device_id = "field_demo"
    temperature = 30.2
    humidity = 71.0
    soil_moisture = 43.5
    rain_detected = 0
    days_since_planting = 67
} | ConvertTo-Json

$storagePayload = @{
    device_id = "storage_demo"
    temperature = 17.4
    humidity = 64.0
    days_in_storage = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "$base/submit-field-data" -Method POST -ContentType "application/json" -Body $fieldPayload | Out-Null
Invoke-RestMethod -Uri "$base/submit-storage-data" -Method POST -ContentType "application/json" -Body $storagePayload | Out-Null

Write-Host "Demo field + storage data sent successfully." -ForegroundColor Green
