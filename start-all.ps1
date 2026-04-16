# CareLabs Full-Stack Platform - Automated Startup Script
# This script builds all microservices and launches the Entire Stack (Frontend + Backend) using Docker.

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

# 2. Building Backend Services
Write-Host "`n[2/3] Building backend microservice JAR files (this may take a few minutes)..." -ForegroundColor Yellow

foreach ($service in $backendServices) {
    Write-Host "Building $service..." -ForegroundColor Gray
    
    $servicePath = Join-Path "backend" $service
    Push-Location $servicePath
    try {
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

# 3. Launching Platform
Write-Host "`n[3/3] Orchestrating Entire Platform with Docker Compose..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   PLATFORM STARTED SUCCESSFULLY!   " -ForegroundColor Green
Write-Host "   Frontend:      http://localhost:3000   " -ForegroundColor Green
Write-Host "   API Gateway:   http://localhost:8080   " -ForegroundColor Green
Write-Host "   Kafka UI:      http://localhost:8090   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Use 'docker-compose logs -f' to view platform logs."
