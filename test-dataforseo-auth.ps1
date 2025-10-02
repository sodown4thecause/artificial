# Test DataForSEO API credentials
# Replace with your actual credentials

$username = Read-Host "Enter DataForSEO username (email)"
$password = Read-Host "Enter DataForSEO password" -AsSecureString

# Convert secure string to plain text for Basic Auth
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Create Basic Auth header
$pair = "${username}:${plainPassword}"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "`nTesting DataForSEO API authentication..." -ForegroundColor Yellow

# Test with a simple API call
$headers = @{
    "Authorization" = "Basic $base64"
    "Content-Type" = "application/json"
}

$body = @(
    @{
        keyword = "test"
        location_name = "United States"
        language_name = "English"
    }
) | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "✅ Authentication successful!" -ForegroundColor Green
    Write-Host "Status code: $($response.status_code)" -ForegroundColor Green
    Write-Host "Tasks: $($response.tasks.Count)" -ForegroundColor Green
    
    if ($response.tasks -and $response.tasks.Count -gt 0) {
        $task = $response.tasks[0]
        Write-Host "Task status: $($task.status_code) - $($task.status_message)" -ForegroundColor Cyan
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Authentication failed!" -ForegroundColor Red
    Write-Host "Status code: $statusCode" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host "`nℹ️  401 Unauthorized - Your credentials are incorrect." -ForegroundColor Yellow
        Write-Host "   Make sure you're using:" -ForegroundColor Yellow
        Write-Host "   - Username: Your DataForSEO login email" -ForegroundColor Yellow
        Write-Host "   - Password: Your API password (not dashboard password)" -ForegroundColor Yellow
    }
}

Write-Host "`nℹ️  To set these in Supabase:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://supabase.com/dashboard/project/bhytukhlmkwagdwrcyct/settings/functions" -ForegroundColor White
Write-Host "   2. Add secrets:" -ForegroundColor White
Write-Host "      - DATAFORSEO_USERNAME = $username" -ForegroundColor White
Write-Host "      - DATAFORSEO_PASSWORD = [your password]" -ForegroundColor White
