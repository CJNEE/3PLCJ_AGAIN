<#
migrate_sqlite_to_postgres.ps1
Automates SQLite -> PostgreSQL migration for the Django backend.
Usage examples:
# With DATABASE_URL env var already set:
.\migrate_sqlite_to_postgres.ps1

# Provide DB URL explicitly:
.\migrate_sqlite_to_postgres.ps1 -DatabaseUrl 'postgres://user:pass@localhost:5432/dbname'

# Create DB and user (requires `psql` available and you run as postgres superuser):
.\migrate_sqlite_to_postgres.ps1 -DatabaseUrl 'postgres://threepl_user:securepassword@localhost:5432/threepl_db' -CreateDb
#>
param(
    [string] $DatabaseUrl = $env:DATABASE_URL,
    [string] $DbName = $env:DB_NAME,
    [string] $DbUser = $env:DB_USER,
    [string] $DbPassword = $env:DB_PASSWORD,
    [switch] $CreateDb = $false
)

Set-StrictMode -Version Latest
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
# try find repository root (one level up in this layout)
if (Test-Path (Join-Path $projectRoot 'manage.py')) {
    $managePath = Join-Path $projectRoot 'manage.py'
} else {
    $managePath = Join-Path (Join-Path $projectRoot '..') 'manage.py'
}

if (-not (Test-Path $managePath)) {
    Write-Error "manage.py not found. Run this script from backend/ or provide path."
    exit 1
}

# Ensure python available
$python = 'python'
try {
    & $python --version > $null
} catch {
    Write-Error "Python not found on PATH. Install Python and activate your virtualenv."
    exit 1
}

Push-Location (Split-Path $managePath)

# Dumpdata from SQLite
Write-Host "Dumping data from SQLite to data.json..."
& $python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > data.json
if ($LASTEXITCODE -ne 0) {
    Write-Error "dumpdata failed. Aborting."
    Pop-Location
    exit 1
}

# Optionally create DB using psql
if ($CreateDb) {
    if (-not $DatabaseUrl) {
        Write-Error "DatabaseUrl required to create DB when -CreateDb is specified."
        Pop-Location
        exit 1
    }
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Error "psql not found. Install PostgreSQL client utilities to create DB automatically."
        Pop-Location
        exit 1
    }
    # parse DatabaseUrl to extract name/user/password/host/port
    $uri = [System.Uri] $DatabaseUrl
    $db = $uri.AbsolutePath.TrimStart('/')
    $user = $uri.UserInfo.Split(':')[0]
    $pass = $uri.UserInfo.Split(':')[1]
    $host = $uri.Host
    $port = $uri.Port

    Write-Host "Creating database '$db' and user '$user' (if not exists)..."
    # Create user and DB (requires postgres superuser privileges)
    # Build SQL using -f to avoid quoting issues in PowerShell
    $createUser = "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{0}') THEN CREATE ROLE \"{0}\" LOGIN PASSWORD '{1}'; END IF; END $$;" -f $user, $pass
    & psql -h $host -p $port -U postgres -c $createUser

    $createDb = "CREATE DATABASE \"{0}\" OWNER \"{1}\";" -f $db, $user
    & psql -h $host -p $port -U postgres -c $createDb
}

# Export/Set DATABASE_URL for this session if provided
if ($DatabaseUrl) {
    Write-Host "Using DATABASE_URL: $DatabaseUrl"
    $env:DATABASE_URL = $DatabaseUrl
} else {
    Write-Host "No DATABASE_URL provided; ensure DATABASE_URL is set in environment before running migrations."
}

# Run migrations
Write-Host "Running migrations..."
& $python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Error "migrate failed. Aborting."
    Pop-Location
    exit 1
}

# Load data into Postgres
Write-Host "Loading data.json into the new database..."
& $python manage.py loaddata data.json
if ($LASTEXITCODE -ne 0) {
    Write-Error "loaddata failed. You may need to load app-by-app or inspect data.json."
    Pop-Location
    exit 1
}

# Run tests
Write-Host "Running test suite..."
& $python manage.py test
$testCode = $LASTEXITCODE
if ($testCode -ne 0) {
    Write-Warning "Tests completed with exit code $testCode. Inspect failures."
} else {
    Write-Host "All tests passed."
}

Pop-Location
exit $testCode
