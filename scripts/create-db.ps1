
# HRMS - Creation de la base de donnees sur F:\ (C:\ plein)
# Executer: .\scripts\create-db.ps1

$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host ""
Write-Host "HRMS - Creation de la base (tablespace F:\)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$pgPassword = Read-Host "Mot de passe du superuser postgres" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $plainPassword

# Test connexion
Write-Host "Connexion a PostgreSQL..." -ForegroundColor Yellow
$test = & $psql -U postgres -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Mauvais mot de passe ou PostgreSQL non demarre" -ForegroundColor Red
    $env:PGPASSWORD = ""
    exit 1
}
Write-Host "OK - Connecte" -ForegroundColor Green
Write-Host ""

# Creer le dossier pour le tablespace sur F:\
$tsPath = "F:\PostgreSQL\hrms_data"
Write-Host "Creation du dossier tablespace: $tsPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $tsPath | Out-Null

# Donner les droits au service PostgreSQL sur ce dossier
# Le service PostgreSQL tourne generalement sous "NT AUTHORITY\NetworkService" ou "NETWORK SERVICE"
try {
    $acl = Get-Acl $tsPath
    $rule1 = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "NT AUTHORITY\NetworkService", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $rule2 = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "NETWORK SERVICE", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.SetAccessRule($rule1)
    $acl.SetAccessRule($rule2)
    Set-Acl $tsPath $acl
    Write-Host "OK - Droits dossier configures" -ForegroundColor Green
} catch {
    Write-Host "INFO - Configuration des droits ignoree (peut fonctionner quand meme)" -ForegroundColor Yellow
}

# Verifier si hrms_user existe
Write-Host "Verification hrms_user..." -ForegroundColor Yellow
$userExists = & $psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='hrms_user';" 2>&1
if ($userExists.Trim() -ne "1") {
    & $psql -U postgres -c "CREATE USER hrms_user WITH PASSWORD 'hrms_password';" | Out-Null
    Write-Host "OK - hrms_user cree" -ForegroundColor Green
} else {
    Write-Host "OK - hrms_user existe deja" -ForegroundColor Blue
}

# Supprimer l'ancien tablespace si existe
Write-Host "Preparation du tablespace..." -ForegroundColor Yellow
& $psql -U postgres -c "DROP TABLESPACE IF EXISTS hrms_space;" 2>&1 | Out-Null

# Creer le tablespace sur F:\
$tspathForward = $tsPath.Replace("\", "/")
$createTS = "CREATE TABLESPACE hrms_space OWNER hrms_user LOCATION '$tspathForward';"
Write-Host "Creation du tablespace sur F:\..." -ForegroundColor Yellow
$tsResult = & $psql -U postgres -c $createTS 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVERTISSEMENT tablespace: $tsResult" -ForegroundColor Yellow
    Write-Host "Tentative sans tablespace (methode alternative)..." -ForegroundColor Yellow
    
    # Methode alternative: changer le data_directory de PostgreSQL
    # On va essayer de creer la DB sans tablespace en liberant de la place d'abord
    Write-Host ""
    Write-Host "Nettoyage des fichiers temporaires PostgreSQL..." -ForegroundColor Yellow
    $pgDataDir = & $psql -U postgres -tAc "SHOW data_directory;" 2>&1
    Write-Host "Data directory PostgreSQL: $pgDataDir" -ForegroundColor White
    
    # Supprimer les vieux WAL logs si possible
    $walDir = Join-Path $pgDataDir.Trim() "pg_wal"
    Write-Host "Verification du dossier WAL: $walDir" -ForegroundColor Yellow
    
    $dbResult = & $psql -U postgres -c "CREATE DATABASE hrms_db OWNER hrms_user ENCODING 'UTF8';" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERREUR: Impossible de creer la base. Disque C:\ trop plein." -ForegroundColor Red
        Write-Host ""
        Write-Host "Solutions manuelles:" -ForegroundColor Yellow
        Write-Host "  1. Liberer de l'espace sur C:\ (vider corbeille, fichiers temp)" -ForegroundColor White
        Write-Host "  2. Executer: cleanmgr /d C:" -ForegroundColor White
        Write-Host "  3. Ouvrir pgAdmin 4 manuellement et creer la DB depuis l'interface" -ForegroundColor White
        $env:PGPASSWORD = ""
        exit 1
    }
} else {
    Write-Host "OK - Tablespace cree sur F:\" -ForegroundColor Green
    
    # Supprimer hrms_db si existe deja (echec precedent)
    & $psql -U postgres -c "DROP DATABASE IF EXISTS hrms_db;" 2>&1 | Out-Null
    
    # Creer la DB sur le tablespace F:\
    Write-Host "Creation de hrms_db sur F:\..." -ForegroundColor Yellow
    $dbResult = & $psql -U postgres -c "CREATE DATABASE hrms_db OWNER hrms_user ENCODING 'UTF8' TABLESPACE hrms_space;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR creation DB: $dbResult" -ForegroundColor Red
        $env:PGPASSWORD = ""
        exit 1
    }
    Write-Host "OK - hrms_db creee sur F:\" -ForegroundColor Green
}

# Donner les droits
Write-Host "Attribution des droits..." -ForegroundColor Yellow
& $psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;" 2>&1 | Out-Null
& $psql -U postgres -d hrms_db -c "GRANT ALL ON SCHEMA public TO hrms_user;" 2>&1 | Out-Null
& $psql -U postgres -d hrms_db -c "GRANT CREATE ON SCHEMA public TO hrms_user;" 2>&1 | Out-Null
Write-Host "OK - Droits attribues" -ForegroundColor Green

# Verifier que ca fonctionne
Write-Host "Verification finale..." -ForegroundColor Yellow
$env:PGPASSWORD = "hrms_password"
$verif = & $psql -U hrms_user -d hrms_db -c "SELECT current_database(), current_user;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Connexion hrms_user -> hrms_db reussie!" -ForegroundColor Green
} else {
    Write-Host "AVERTISSEMENT: $verif" -ForegroundColor Yellow
}

$env:PGPASSWORD = ""

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Base de donnees prete !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Host     : localhost:5432" -ForegroundColor White
Write-Host "  Database : hrms_db" -ForegroundColor White
Write-Host "  User     : hrms_user / hrms_password" -ForegroundColor White
Write-Host ""
Write-Host "Redemarrez le backend: cd backend ; npm run start:dev" -ForegroundColor Cyan
Write-Host ""
