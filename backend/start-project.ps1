# CareLabs Smart Healthcare Platform - Automated Startup Script
# This script builds all microservices and launches the stack using Docker Compose.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CARELABS - SMART HEALTHCARE PLATFORM STARTUP   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$services = @(
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

# 2. Building Services
Write-Host "`n[2/3] Building microservice JAR files (this may take a few minutes)..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Gray
    Push-Location $service
    try {
        # Using mvnw with skipTests for speed during development/demo
        if ($IsWindows) {
            cmd /c "mvnw.cmd clean package -DskipTests" | Out-Null
        } else {
            ./mvnw clean package -DskipTests | Out-Null
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed for $service. Check maven logs."
            Pop-Location
            exit
        }
    } finally {
        Pop-Location
    }
}

# 3. Launching Stack
Write-Host "`n[3/3] Orchestrating containers with Docker Compose..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   PROJECT STARTED SUCCESSFULLY!   " -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000   " -ForegroundColor Green
Write-Host "   API Gateway: http://localhost:8080   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Use 'docker-compose logs -f' to view service logs."
