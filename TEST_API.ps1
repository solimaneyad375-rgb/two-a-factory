$ErrorActionPreference = "Stop"
Write-Host "Checking API health..."
Invoke-RestMethod -Uri "http://localhost:5080/api/health" -Method Get | Format-List
Write-Host "Checking items document..."
try { Invoke-RestMethod -Uri "http://localhost:5080/api/data/items" -Method Get | ConvertTo-Json -Depth 5 } catch { Write-Host $_.Exception.Message }
