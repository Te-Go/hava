$headers = @{
    "x-rapidapi-host" = "ski-resorts-and-conditions.p.rapidapi.com"
    "x-rapidapi-key" = "35a8ca12ccmsh4c85fae914d9c17p1edbbfjsnf5ca0c1feb87"
}

$allResorts = @()

# Load existing Page 1
$page1 = Get-Content -Raw "resorts_full_list.json" | ConvertFrom-Json
$allResorts += $page1.data

# Fetch Pages 2 to 8
for ($i = 2; $i -le 8; $i++) {
    Write-Host "Fetching Page $i..."
    try {
        $response = Invoke-RestMethod -Uri "https://ski-resorts-and-conditions.p.rapidapi.com/v1/resort?page=$i" -Headers $headers -Method Get
        $allResorts += $response.data
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Error fetching page $i : $_"
    }
}

$allResorts | ConvertTo-Json -Depth 5 | Out-File "all_resorts.json" -Encoding utf8
Write-Host "Done. Total resorts: $($allResorts.Count)"
