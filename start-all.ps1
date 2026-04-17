# CareLabs Full-Stack Platform - Automated Startup Script

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CARELABS - FULL STACK PLATFORM STARTUP   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendServices = @(
    "auth-service",
    "patient-service",
    "doctor-service",
    "appointments-service",
    "notification-service",
    "payment-service",
    "ai-symptom-service",
    "api-gateway"
)

# 1. Verification
Write-Host "`n[1/3] Verifying environment..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop."
    exit
}
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js/npm is not installed or not in PATH."
    exit
}

# Ensure Java 17 is used (not Java 26)
$java17 = "C:\Program Files\Java\jdk-17"
if (Test-Path $java17) {
    $env:JAVA_HOME = $java17
    $env:PATH = "$java17\bin;" + $env:PATH
    Write-Host "  Using Java: $java17" -ForegroundColor Gray
}

$javaVer = (java -version 2>&1 | Select-String "version").ToString()
Write-Host "  Java: $javaVer" -ForegroundColor Gray

# 2. Build all backend services locally with Maven + Java 17
Write-Host "`n[2/3] Building backend microservices (Maven + Java 17)..." -ForegroundColor Yellow

foreach ($service in $backendServices) {
    Write-Host "  Building $service..." -ForegroundColor Gray
    Push-Location "backend\$service"
    try {
        cmd /c "mvnw.cmd clean package -DskipTests -q"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed for $service."
            exit
        }
        Write-Host "  [OK] $service" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# 3. Launch backend via Docker Compose
Write-Host "`n[3/3] Starting platform with Docker Compose..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "docker-compose failed. Run 'docker-compose logs' to investigate."
    exit
}

# Start frontend in a new window
Push-Location frontend
if (!(Test-Path "node_modules")) {
    Write-Host "  Installing frontend npm dependencies..." -ForegroundColor Gray
    npm install
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
Pop-Location

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   PLATFORM STARTED!   " -ForegroundColor Green
Write-Host "   Frontend:    http://localhost:3000  (new window)" -ForegroundColor Green
Write-Host "   API Gateway: http://localhost:8090" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Backend logs: docker-compose logs -f"
