#!/usr/bin/env python
"""Simple deployment readiness check without Django setup"""

import json
from pathlib import Path

print("=" * 70)
print("DEPLOYMENT READINESS CHECK - 3PL System")
print("=" * 70)

root = Path(__file__).parent
backend = root / 'backend'
frontend = root / 'frontend'

passed = 0
failed = 0

def check(name, condition, details=""):
    global passed, failed
    status = "✅" if condition else "❌"
    print(f"{status} {name}")
    if details:
        print(f"   └─ {details}")
    if condition:
        passed += 1
    else:
        failed += 1

print("\n📁 PROJECT STRUCTURE")
print("-" * 70)
check("Backend folder", backend.exists(), str(backend))
check("Frontend folder", frontend.exists(), str(frontend))

print("\n📋 BACKEND FILES")
print("-" * 70)
check("manage.py", (backend / 'manage.py').exists())
check("requirements.txt", (backend / 'requirements.txt').exists())
check("settings.py", (backend / 'backend' / 'settings.py').exists())
check("urls.py", (backend / 'backend' / 'urls.py').exists())

print("\n🔍 BACKEND CONFIGURATION")
print("-" * 70)

settings_file = backend / 'backend' / 'settings.py'
if settings_file.exists():
    with open(settings_file) as f:
        settings_content = f.read()
    
    check("DEBUG=False", "DEBUG = False" in settings_content, "Production mode enabled")
    check("ALLOWED_HOSTS", "ALLOWED_HOSTS" in settings_content and "render.com" in settings_content, 
          "Render backend configured")
    check("CORS Headers", "corsheaders" in settings_content, "CORS enabled")
    check("PostgreSQL Support", "dj_database_url" in settings_content, 
          "Dynamic database URL parsing")

print("\n📋 FRONTEND FILES")
print("-" * 70)
check("package.json", (frontend / 'package.json').exists())
check("vite.config.ts", (frontend / 'vite.config.ts').exists())
check("index.html", (frontend / 'index.html').exists())
check("src/main.tsx", (frontend / 'src' / 'main.tsx').exists())

print("\n🔍 FRONTEND CONFIGURATION")
print("-" * 70)

vite_config = frontend / 'vite.config.ts'
if vite_config.exists():
    with open(vite_config) as f:
        vite_content = f.read()
    check("Vite React", "@vitejs/plugin-react" in vite_content)
    check("Dev Proxy", "proxy:" in vite_content or "/api" in vite_content, 
          "API development proxy configured")

api_constants = frontend / 'src' / 'constants' / 'api.ts'
if api_constants.exists():
    with open(api_constants) as f:
        api_content = f.read()
    check("Backend URL", "render.com" in api_content or "localhost" in api_content,
          "Backend API endpoint configured")

print("\n🚀 DEPLOYMENT FILES")
print("-" * 70)

vercel_config = root / 'vercel.json'
if vercel_config.exists():
    with open(vercel_config) as f:
        vercel = json.load(f)
    check("vercel.json", True, "Vercel configuration exists")
    check("API Rewrites", any("/api" in str(r) for r in vercel.get('rewrites', [])),
          "API requests routed to backend")

check("Backend Requirements", (backend / 'requirements.txt').exists())

reqs = (backend / 'requirements.txt').read_text() if (backend / 'requirements.txt').exists() else ""
req_checks = [
    ("Django", "Django" in reqs),
    ("DRF", "djangorestframework" in reqs),
    ("CORS", "django-cors-headers" in reqs),
    ("JWT", "PyJWT" in reqs or "simplejwt" in reqs),
    ("PostgreSQL", "psycopg2" in reqs),
    ("Gunicorn", "gunicorn" in reqs),
]

print("\n📦 PYTHON DEPENDENCIES")
print("-" * 70)
for name, present in req_checks:
    check(name, present, "Package requirement in requirements.txt")

print("\n" + "=" * 70)
print(f"✅ PASSED: {passed}  |  ❌ FAILED: {failed}")
success_rate = (passed / (passed + failed) * 100) if (passed + failed) > 0 else 0
print(f"📊 Success Rate: {success_rate:.0f}%")
print("=" * 70)

if failed == 0:
    print("\n✨ SYSTEM READY FOR DEPLOYMENT ✨")
    print("\nDEPLOYMENT STEPS:")
    print("1️⃣  FRONTEND TO VERCEL")
    print("   - Repository: GitHub repo")
    print("   - Root Directory: frontend/")
    print("   - Build Command: npm run build")
    print("   - Output Directory: dist")
    print("   - Environment: VITE_API_URL=/api (to use Vercel proxy)")
    print()
    print("2️⃣  BACKEND TO RENDER")
    print("   - Repository: GitHub repo")
    print("   - Root Directory: backend/")
    print("   - Build Command: pip install -r requirements.txt")
    print("   - Start Command: gunicorn backend.wsgi:application --bind 0.0.0.0:8000")
    print("   - Environment Variables:")
    print("     * DATABASE_URL=<postgres-url>")
    print("     * SECRET_KEY=<django-secret-key>")
    print("     * DEBUG=False")
    print("     * ALLOWED_HOSTS=your-render-service.onrender.com,*.vercel.app")
    print()
    print("3️⃣  VERIFICATION")
    print("   ✓ Test backend: https://your-render-service.onrender.com/api/")
    print("   ✓ Test frontend: https://your-vercel-domain.vercel.app")
    print("   ✓ Test API calls from frontend to backend")
else:
    print(f"\n⚠️  Fix {failed} issue(s) before deployment")
