
# HRMS - Script d'installation et demarrage
# Executer: .\scripts\setup.ps1

Write-Host ""
Write-Host "HRMS - Installation et Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verification des prerequis
Write-Host "Verification des prerequis..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "  ERREUR: Node.js n'est pas installe." -ForegroundColor Red
    Write-Host "  Telechargez Node.js sur: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  OK - Node.js: $nodeVersion" -ForegroundColor Green

$npmVersion = npm --version 2>$null
Write-Host "  OK - npm: $npmVersion" -ForegroundColor Green

$dockerOk = $false
$dockerTest = docker compose version 2>$null
if ($LASTEXITCODE -eq 0) {
    $dockerOk = $true
    Write-Host "  OK - Docker Compose V2 detecte" -ForegroundColor Green
} else {
    Write-Host "  AVERTISSEMENT: Docker non detecte." -ForegroundColor Yellow
    Write-Host "  Installez Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
}

Write-Host ""

# Copie du .env
Write-Host "Configuration de l'environnement..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  OK - Fichier .env cree depuis .env.example" -ForegroundColor Green
    Write-Host "  N'oubliez pas de remplir les valeurs dans .env" -ForegroundColor Yellow
} else {
    Write-Host "  INFO - .env existe deja, aucune modification." -ForegroundColor Blue
}

Write-Host ""

# Installation des dependances Backend
Write-Host "Installation des dependances Backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR lors de l'installation du backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "  OK - Backend installe" -ForegroundColor Green

Write-Host ""

# Installation des dependances Frontend
Write-Host "Installation des dependances Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR lors de l'installation du frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "  OK - Frontend installe" -ForegroundColor Green

Write-Host ""

# Demarrage Docker
if ($dockerOk) {
    Write-Host "Demarrage des services Docker (PostgreSQL + Redis)..." -ForegroundColor Yellow
    docker compose up -d postgres redis
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - PostgreSQL et Redis demarres" -ForegroundColor Green
        Write-Host "  INFO - Pour Keycloak et MinIO: docker compose up -d" -ForegroundColor Blue
    } else {
        Write-Host "  ERREUR lors du demarrage Docker" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Installation terminee !" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Commandes pour demarrer:" -ForegroundColor Cyan
Write-Host "  Backend  : cd backend ; npm run start:dev" -ForegroundColor White
Write-Host "  Frontend : cd frontend ; npm run dev" -ForegroundColor White
Write-Host "  Mobile   : cd mobile ; npx expo start" -ForegroundColor White
Write-Host ""
Write-Host "URLs de developpement:" -ForegroundColor Cyan
Write-Host "  API Swagger : http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "  Frontend    : http://localhost:5173" -ForegroundColor White
Write-Host "  Keycloak    : http://localhost:8080  admin/admin123" -ForegroundColor White
Write-Host "  MinIO       : http://localhost:9001  minioadmin/minioadmin123" -ForegroundColor White
Write-Host ""
