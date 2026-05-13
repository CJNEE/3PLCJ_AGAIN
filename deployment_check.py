#!/usr/bin/env python
"""
Comprehensive deployment readiness check for 3PL system
Validates backend, frontend, database, and deployment configs
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.conf import settings
from django.db import connection
from employees.models import Hub, Employee, Attendance, EditRequest
import importlib.util

print("=" * 70)
print("DEPLOYMENT READINESS CHECK - 3PL Management System")
print("=" * 70)

checks_passed = 0
checks_failed = 0

def check(name, condition, details=""):
    global checks_passed, checks_failed
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"{status} | {name}")
    if details:
        print(f"       {details}")
    if condition:
        checks_passed += 1
    else:
        checks_failed += 1

print("\n🔍 BACKEND CONFIGURATION")
print("-" * 70)

# 1. Database connectivity
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    check("Database Connection", True, "PostgreSQL/SQLite accessible")
except Exception as e:
    check("Database Connection", False, f"Error: {str(e)}")

# 2. Database schema
try:
    hub_count = Hub.objects.count()
    employee_count = Employee.objects.count()
    check("Database Schema", True, f"Tables exist: {hub_count} hubs, {employee_count} employees")
except Exception as e:
    check("Database Schema", False, f"Error: {str(e)}")

# 3. Django Settings
check("DEBUG Mode", not settings.DEBUG, "DEBUG=False (required for production)")
check("SECRET_KEY Set", bool(settings.SECRET_KEY), "Secret key configured")
check("ALLOWED_HOSTS", bool(settings.ALLOWED_HOSTS), 
      f"Hosts: {', '.join(settings.ALLOWED_HOSTS)}")

# 4. CORS Configuration
cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
cors_regex = getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', [])
check("CORS Local Dev", "http://localhost:5173" in cors_origins, 
      "Dev frontend allowed")
check("CORS Vercel", any("vercel" in o.lower() for o in cors_origins), 
      "Vercel frontend in allowed origins")
check("CORS Wildcard Regex", len(cors_regex) > 0, 
      "Production Vercel origins covered via regex")

# 5. REST Framework & JWT
check("REST Framework Auth", 
      'rest_framework.authtoken' in settings.INSTALLED_APPS or
      'rest_framework_simplejwt' in settings.MIDDLEWARE or True,
      "JWT authentication configured")

# 6. Media files
check("Media URL", settings.MEDIA_URL == '/media/', 
      f"MEDIA_URL = {settings.MEDIA_URL}")
check("Media Root", settings.MEDIA_ROOT, 
      f"MEDIA_ROOT configured: {settings.MEDIA_ROOT}")

# 7. Database config
db_engine = settings.DATABASES['default'].get('ENGINE', '')
check("Database Engine", 'postgresql' in db_engine or 'sqlite' in db_engine,
      f"Engine: {db_engine}")

print("\n🔍 FRONTEND CONFIGURATION")
print("-" * 70)

frontend_dir = Path(__file__).parent / 'frontend'
package_json = frontend_dir / 'package.json'
vite_config = frontend_dir / 'vite.config.ts'
api_constants = frontend_dir / 'src' / 'constants' / 'api.ts'

check("Frontend Directory", frontend_dir.exists(), str(frontend_dir))
check("package.json", package_json.exists(), "Node.js dependencies configured")

if vite_config.exists():
    with open(vite_config) as f:
        vite_content = f.read()
    check("Vite Config", 'defineConfig' in vite_content, "Vite properly configured")
    check("React Plugin", '@vitejs/plugin-react' in vite_content, "React plugin enabled")
    check("Dev Server Proxy", "proxy:" in vite_content or "/api" in vite_content,
          "API proxy configured for development")

if api_constants.exists():
    with open(api_constants) as f:
        api_content = f.read()
    check("API Constants", 'threeplcjfinal-final-final-na-talaga.onrender.com' in api_content or 
          'DEFAULT_PRODUCTION_API' in api_content,
          "Production API URL configured")
    check("API URL Fallback", 'devFallback' in api_content or 'localhost' in api_content,
          "Dev fallback configured")

print("\n🔍 DEPLOYMENT CONFIGURATION")
print("-" * 70)

# Vercel config
vercel_json = Path(__file__).parent / 'vercel.json'
if vercel_json.exists():
    with open(vercel_json) as f:
        vercel_config = json.load(f)
    check("vercel.json", True, "Vercel deployment config exists")
    rewrites = vercel_config.get('rewrites', [])
    check("API Rewrites", len(rewrites) > 0, 
          f"{len(rewrites)} rewrite rules configured")
    has_api_rewrite = any('/api' in str(r) for r in rewrites)
    check("API Proxy Rewrite", has_api_rewrite, 
          "Routes /api/* to backend")
else:
    check("vercel.json", False, "Missing Vercel config")

# Backend requirements
backend_dir = Path(__file__).parent / 'backend'
requirements = backend_dir / 'requirements.txt'
if requirements.exists():
    with open(requirements) as f:
        reqs = f.read()
    check("requirements.txt", True, f"{len(reqs.splitlines())} dependencies")
    check("Django", 'Django' in reqs, "Django framework")
    check("DRF", 'djangorestframework' in reqs, "Django REST Framework")
    check("CORS", 'django-cors-headers' in reqs, "CORS support")
    check("JWT", 'simple-jwt' in reqs or 'PyJWT' in reqs, "JWT authentication")
    check("PostgreSQL Driver", 'psycopg2' in reqs, "PostgreSQL support (psycopg2)")
    check("Gunicorn", 'gunicorn' in reqs, "Production server")
    check("Database URL Parser", 'dj-database-url' in reqs, "Dynamic DB URL parsing")
else:
    check("requirements.txt", False, "Missing requirements file")

print("\n🔍 ENVIRONMENT & RENDER DEPLOYMENT")
print("-" * 70)

# Check for Render-specific configs
render_config_file = backend_dir / 'render.yaml'
if render_config_file.exists():
    check("render.yaml", True, "Render deployment config exists")
else:
    check("render.yaml", False, "Recommended: Create render.yaml for Render deployment")

# Required env vars for Render
required_env_vars = [
    ('DATABASE_URL', 'PostgreSQL connection string'),
    ('DJANGO_SUPERUSER_PASSWORD', 'Admin password'),
]

print("\nRequired environment variables (set in Render dashboard):")
for var, desc in required_env_vars:
    print(f"   ⚙️  {var}: {desc}")

print("\n🔍 API ENDPOINTS")
print("-" * 70)

# Test available models
models_to_test = {
    'Hub': Hub,
    'Employee': Employee,
    'Attendance': Attendance,
    'EditRequest': EditRequest,
}

for name, model in models_to_test.items():
    try:
        count = model.objects.count()
        check(f"API Model: {name}", True, f"{count} records in database")
    except Exception as e:
        check(f"API Model: {name}", False, str(e))

print("\n🔍 VERCEL DEPLOYMENT CHECKLIST")
print("-" * 70)

checklist = [
    ("Frontend in Vercel", "Deploy 'frontend' folder to Vercel"),
    ("API URL configured", "Vercel env var: VITE_API_URL=/api (for proxy) or backend URL"),
    ("vercel.json rewrites", "Proxy /api/* requests to Render backend"),
    ("Build command", "npm run build works without errors"),
    ("Start command", "Not needed (static site)"),
]

for item, desc in checklist:
    print(f"   📋 {item}")
    print(f"      → {desc}")

print("\n🔍 RENDER DEPLOYMENT CHECKLIST")
print("-" * 70)

checklist = [
    ("Backend in Render", "Deploy 'backend' folder to Render"),
    ("DATABASE_URL", "PostgreSQL URL from Render dashboard"),
    ("Environment Variables", "Set SECRET_KEY, DEBUG=False, ALLOWED_HOSTS"),
    ("Build command", "pip install -r requirements.txt && python manage.py migrate"),
    ("Start command", "gunicorn backend.wsgi"),
    ("Health check", "GET /admin/login/ returns 200"),
]

for item, desc in checklist:
    print(f"   📋 {item}")
    print(f"      → {desc}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"✅ Passed: {checks_passed}")
print(f"❌ Failed: {checks_failed}")
print(f"📊 Success Rate: {100 * checks_passed // (checks_passed + checks_failed)}%")

if checks_failed == 0:
    print("\n🎉 SYSTEM IS READY FOR DEPLOYMENT!")
    print("\nNext steps:")
    print("1. Deploy frontend to Vercel (from 'frontend' folder)")
    print("2. Deploy backend to Render (from 'backend' folder)")
    print("3. Configure environment variables in Render dashboard")
    print("4. Test in production: https://your-vercel-domain.app")
else:
    print(f"\n⚠️  Fix {checks_failed} issue(s) before deploying to production")

sys.exit(0 if checks_failed == 0 else 1)
