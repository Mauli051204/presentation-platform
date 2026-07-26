$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000/api/v1"
$results = @()
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

function Test-Case {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    try {
        & $Action
        $script:results += [PSCustomObject]@{ Test = $Name; Result = "PASS"; Detail = "" }
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        $script:results += [PSCustomObject]@{ Test = $Name; Result = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "[FAIL] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Assert-Equal($expected, $actual, $label) {
    if ($expected -ne $actual) {
        throw "$label expected [$expected] but got [$actual]"
    }
}

Write-Host "`n=== HEALTH CHECK ===" -ForegroundColor Cyan
Test-Case "GET /health returns ok" {
    $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Assert-Equal $true $res.success "success flag"
}

# ---------------------------------------------------------------------------
# AUTH — Presenter
# ---------------------------------------------------------------------------
Write-Host "`n=== AUTH: PRESENTER ===" -ForegroundColor Cyan
$presenterEmail = "presenter_$timestamp@test.com"
$presenterPassword = "Test1234"
$presenterSession = $null
$presenterAccessToken = $null

Test-Case "Register presenter (201)" {
    $body = @{ name = "Test Presenter"; email = $presenterEmail; password = $presenterPassword; role = "presenter" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    Assert-Equal $true $res.success "success"
    Assert-Equal $presenterEmail $res.data.email "email echoed"
}

Test-Case "Register duplicate presenter fails (409)" {
    $body = @{ name = "Dup"; email = $presenterEmail; password = $presenterPassword; role = "presenter" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        throw "Expected 409 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw "Expected 409, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Login presenter (200, receives accessToken)" {
    $body = @{ email = $presenterEmail; password = $presenterPassword } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable script:presenterSession
    Assert-Equal $true $res.success "success"
    if (-not $res.data.accessToken) { throw "No accessToken returned" }
    $script:presenterAccessToken = $res.data.accessToken
}

Test-Case "Login wrong password fails (401)" {
    $body = @{ email = $presenterEmail; password = "WrongPass1" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        throw "Expected 401 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw "Expected 401, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "GET /auth/me with token (200)" {
    $headers = @{ Authorization = "Bearer $presenterAccessToken" }
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Assert-Equal "presenter" $res.data.role "role"
}

Test-Case "GET /auth/me without token fails (401)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get
        throw "Expected 401 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw "Expected 401, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Refresh token works (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/refresh-token" -Method Post -WebSession $presenterSession
    if (-not $res.data.accessToken) { throw "No accessToken on refresh" }
    $script:presenterAccessToken = $res.data.accessToken
}

# ---------------------------------------------------------------------------
# AUTH — College
# ---------------------------------------------------------------------------
Write-Host "`n=== AUTH: COLLEGE ===" -ForegroundColor Cyan
$collegeEmail = "college_$timestamp@test.com"
$collegePassword = "Test1234"
$collegeSession = $null
$collegeAccessToken = $null

Test-Case "Register college (201)" {
    $body = @{ name = "Test College"; email = $collegeEmail; password = $collegePassword; role = "college" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    Assert-Equal $true $res.success "success"
}

Test-Case "Register with invalid role fails (422)" {
    $body = @{ name = "Bad"; email = "bad_$timestamp@test.com"; password = $collegePassword; role = "admin" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        throw "Expected 422 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 422) { throw "Expected 422, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Login college (200)" {
    $body = @{ email = $collegeEmail; password = $collegePassword } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable script:collegeSession
    $script:collegeAccessToken = $res.data.accessToken
}

# ---------------------------------------------------------------------------
# PRESENTER PROFILE
# ---------------------------------------------------------------------------
Write-Host "`n=== PRESENTER PROFILE ===" -ForegroundColor Cyan
$presenterHeaders = @{ Authorization = "Bearer $presenterAccessToken"; "Content-Type" = "application/json" }

Test-Case "Get my presenter profile before creation fails (404)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/presenters/profile/me" -Method Get -Headers @{ Authorization = "Bearer $presenterAccessToken" }
        throw "Expected 404 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw "Expected 404, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Create/update presenter profile (200)" {
    $body = @{
        headline = "Test Speaker"
        bio = "Automated test bio"
        skills = @("AI", "Testing")
        languages = @("English")
        location = @{ city = "Trichy"; state = "Tamil Nadu" }
        education = @(@{ degree = "B.Tech"; institution = "Test University"; yearOfCompletion = 2020 })
    } | ConvertTo-Json -Depth 5
    $res = Invoke-RestMethod -Uri "$baseUrl/presenters/profile/me" -Method Put -Body $body -Headers $presenterHeaders
    Assert-Equal $true $res.success "success"
}

Test-Case "Get my presenter profile after creation (200, isProfileComplete=true)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/presenters/profile/me" -Method Get -Headers @{ Authorization = "Bearer $presenterAccessToken" }
    Assert-Equal $true $res.data.isProfileComplete "isProfileComplete"
}

Test-Case "Update availability (200)" {
    $body = @{ dates = @("2026-09-01", "2026-09-02") } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/presenters/profile/availability" -Method Put -Body $body -Headers $presenterHeaders
    Assert-Equal $true $res.success "success"
}

Test-Case "Public list presenters (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/presenters?page=1&limit=10" -Method Get
    if (-not $res.pagination) { throw "No pagination block returned" }
}

# ---------------------------------------------------------------------------
# COLLEGE PROFILE
# ---------------------------------------------------------------------------
Write-Host "`n=== COLLEGE PROFILE ===" -ForegroundColor Cyan
$collegeHeaders = @{ Authorization = "Bearer $collegeAccessToken"; "Content-Type" = "application/json" }

Test-Case "Create/update college profile (200)" {
    $body = @{
        collegeName = "Test College $timestamp"
        description = "Automated test college"
        address = @{ city = "Trichy"; state = "Tamil Nadu"; pincode = "620001" }
        contactPerson = @{ name = "Admin Contact"; designation = "Dean"; phone = "9999999999" }
    } | ConvertTo-Json -Depth 5
    $res = Invoke-RestMethod -Uri "$baseUrl/colleges/profile/me" -Method Put -Body $body -Headers $collegeHeaders
    Assert-Equal $true $res.success "success"
}

Test-Case "Public list colleges (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/colleges?page=1&limit=10" -Method Get
    if (-not $res.pagination) { throw "No pagination block returned" }
}

# ---------------------------------------------------------------------------
# REQUIREMENTS
# ---------------------------------------------------------------------------
Write-Host "`n=== REQUIREMENTS ===" -ForegroundColor Cyan
$requirementId = $null

Test-Case "Create requirement (201, status=draft)" {
    $body = @{
        title = "Automated Test Requirement"
        description = "Created by test script"
        presentationType = "online"
        budgetMin = 1000
        budgetMax = 1000
        eventDate = "2026-10-01"
        durationMinutes = 60
        applicationDeadline = "2026-09-25"
        requiredSkills = @("Testing")
    } | ConvertTo-Json -Depth 5
    $res = Invoke-RestMethod -Uri "$baseUrl/requirements" -Method Post -Body $body -Headers $collegeHeaders
    Assert-Equal "draft" $res.data.status "status"
    $script:requirementId = $res.data._id
}

Test-Case "Publish requirement to active (200)" {
    $body = @{ status = "active" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/requirements/$requirementId/status" -Method Patch -Body $body -Headers $collegeHeaders
    Assert-Equal "active" $res.data.status "status"
}

Test-Case "Public list active requirements includes new one (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/requirements?page=1&limit=50" -Method Get
    $found = $res.data | Where-Object { $_._id -eq $requirementId }
    if (-not $found) { throw "Newly created requirement not found in public active list" }
}

Test-Case "Get requirement by id (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/requirements/$requirementId" -Method Get
    Assert-Equal $requirementId $res.data._id "id match"
}

Test-Case "Non-owner cannot force-edit requirement (403)" {
    $body = @{ title = "hacked"; description = "x"; presentationType = "online"; budgetMin = 1; budgetMax = 1; eventDate = "2026-10-01"; durationMinutes = 10; applicationDeadline = "2026-09-25" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/requirements/$requirementId" -Method Put -Body $body -Headers $presenterHeaders
        throw "Expected 403/401 but request succeeded"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ne 403 -and $code -ne 401) { throw "Expected 403 or 401, got $code" }
    }
}

# ---------------------------------------------------------------------------
# APPLICATIONS
# ---------------------------------------------------------------------------
Write-Host "`n=== APPLICATIONS ===" -ForegroundColor Cyan
$applicationId = $null

Test-Case "Presenter applies to requirement (201)" {
    $body = @{ requirementId = $requirementId; coverNote = "Automated test application" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -Headers $presenterHeaders
    Assert-Equal "applied" $res.data.status "status"
    $script:applicationId = $res.data._id
}

Test-Case "Duplicate apply fails (409)" {
    $body = @{ requirementId = $requirementId } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $body -Headers $presenterHeaders
        throw "Expected 409 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw "Expected 409, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Presenter sees application in My Applications (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/applications/mine" -Method Get -Headers @{ Authorization = "Bearer $presenterAccessToken" }
    $found = $res.data | Where-Object { $_._id -eq $applicationId }
    if (-not $found) { throw "Application not found in presenter's list" }
}

Test-Case "College sees application for requirement (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/applications/requirement/$requirementId" -Method Get -Headers @{ Authorization = "Bearer $collegeAccessToken" }
    if ($res.data.Count -lt 1) { throw "No applications returned for requirement" }
}

Test-Case "College shortlists application (200)" {
    $body = @{ status = "shortlisted" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/applications/$applicationId/status" -Method Patch -Body $body -Headers $collegeHeaders
    Assert-Equal "shortlisted" $res.data.status "status"
}

Test-Case "Re-shortlisting an already-shortlisted application fails (400)" {
    $body = @{ status = "rejected" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/applications/$applicationId/status" -Method Patch -Body $body -Headers $collegeHeaders
        throw "Expected 400 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 400) { throw "Expected 400, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

# ---------------------------------------------------------------------------
# SEARCH
# ---------------------------------------------------------------------------
Write-Host "`n=== SEARCH ===" -ForegroundColor Cyan

Test-Case "Autocomplete skill search (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/search/autocomplete?type=skill&q=Te" -Method Get
    Assert-Equal $true $res.success "success"
}

Test-Case "Popular searches (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/search/popular" -Method Get
    Assert-Equal $true $res.success "success"
}

# ---------------------------------------------------------------------------
# BOOKING
# ---------------------------------------------------------------------------
Write-Host "`n=== BOOKING ===" -ForegroundColor Cyan
$bookingId = $null

Test-Case "College books shortlisted presenter (201)" {
    $body = @{ applicationId = $applicationId; agreedFee = 1000; meetingLink = "https://meet.google.com/test-link" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $body -Headers $collegeHeaders
    Assert-Equal "pending_payment" $res.data.status "status"
    $script:bookingId = $res.data._id
}

Test-Case "Duplicate booking for same application fails (409)" {
    $body = @{ applicationId = $applicationId; agreedFee = 1000 } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $body -Headers $collegeHeaders
        throw "Expected 409 but request succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw "Expected 409, got $($_.Exception.Response.StatusCode.value__)" }
    }
}

Test-Case "Presenter sees booking in My Bookings (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/bookings/mine" -Method Get -Headers @{ Authorization = "Bearer $presenterAccessToken" }
    $found = $res.data | Where-Object { $_._id -eq $bookingId }
    if (-not $found) { throw "Booking not visible to presenter" }
}

Test-Case "Create Razorpay order (201, idempotent on repeat)" {
    $body = @{ bookingId = $bookingId } | ConvertTo-Json
    $res1 = Invoke-RestMethod -Uri "$baseUrl/payments/create-order" -Method Post -Body $body -Headers $collegeHeaders
    $res2 = Invoke-RestMethod -Uri "$baseUrl/payments/create-order" -Method Post -Body $body -Headers $collegeHeaders
    Assert-Equal $res1.data.payment._id $res2.data.payment._id "same payment record returned"
}

Test-Case "Cancel pending booking (200)" {
    $body = @{ reason = "Automated test cancellation" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/cancel" -Method Patch -Body $body -Headers $collegeHeaders
    Assert-Equal "cancelled" $res.data.status "status"
}

# ---------------------------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------------------------
Write-Host "`n=== NOTIFICATIONS ===" -ForegroundColor Cyan

Test-Case "Presenter has received notifications (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/notifications?page=1&limit=10" -Method Get -Headers @{ Authorization = "Bearer $presenterAccessToken" }
    if ($res.data.Count -lt 1) { throw "Expected at least one notification (shortlist/booking events)" }
}

Test-Case "Mark all notifications read (200)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/notifications/read-all" -Method Patch -Headers @{ Authorization = "Bearer $presenterAccessToken" }
    Assert-Equal $true $res.success "success"
}

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
Write-Host "`n`n========== TEST SUMMARY ==========" -ForegroundColor Yellow
$passCount = ($results | Where-Object { $_.Result -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Result -eq "FAIL" }).Count
$results | Format-Table -AutoSize

Write-Host "`nTotal: $($results.Count)  Passed: $passCount  Failed: $failCount" -ForegroundColor Yellow
if ($failCount -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    $results | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object { Write-Host " - $($_.Test): $($_.Detail)" -ForegroundColor Red }
}

$results | Export-Csv -Path "test-results-$timestamp.csv" -NoTypeInformation
Write-Host "`nFull results saved to test-results-$timestamp.csv" -ForegroundColor Cyan