PostgreSQL Migration Guide

Goal
- Replace `db.sqlite3` with PostgreSQL for the backend while preserving schema, relations, constraints and data.

Prerequisites
- PostgreSQL server accessible (local or remote).
- `psycopg2-binary` installed (already present in `requirements.txt`).
- `dj-database-url` installed (already present in `requirements.txt`).
- A Python virtualenv with project requirements installed.

Example environment variables
- Single URL form (recommended):
  - `DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME`
- Or individual vars (Django will still use `DATABASE_URL` if set):
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Optional tuning:
  - `CONN_MAX_AGE` (seconds, default 600)
  - `DB_SSL_REQUIRE` (True/False)

High-level steps
1. Install requirements

```bash
pip install -r backend/requirements.txt
```

2. Create Postgres database and user (example using `psql`)

```bash
# create DB and user (run as postgres superuser)
psql -U postgres -c "CREATE DATABASE threepl_db;"
psql -U postgres -c "CREATE USER threepl_user WITH PASSWORD 'securepassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE threepl_db TO threepl_user;"
```

3. Configure `DATABASE_URL` for your environment (example)

```bash
# Linux / macOS
export DATABASE_URL=postgres://threepl_user:securepassword@localhost:5432/threepl_db
# Windows PowerShell
$env:DATABASE_URL = 'postgres://threepl_user:securepassword@localhost:5432/threepl_db'
```

4. Dump data from SQLite

```bash
# from project root
python backend/manage.py dumpdata --natural-foreign --natural-primary --indent 2 > data.json
```

5. Point Django to Postgres and run migrations

```bash
# ensure DATABASE_URL is set in your shell
python backend/manage.py migrate
```

6. Load data into Postgres

```bash
python backend/manage.py loaddata data.json
```

Notes on `dumpdata` and `loaddata`
- Use `--natural-foreign --natural-primary` to preserve natural keys.
- If `loaddata` complains about constraints or ordering, you can load app-by-app:
  - `python backend/manage.py loaddata employees_data.json`
- For large datasets, consider `pgloader` or `pg_dump` workflows.

7. Run tests and smoke checks

```bash
python backend/manage.py test
# Basic smoke checks (create/read/update/delete flows)
python backend/manage.py shell
# inside shell:
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.create_user('migratetester', password='pass')
print(User.objects.filter(username='migratetester').exists())
u.delete()
```

SQLite-specific compatibility checks
- Search for raw SQL queries in the codebase that use `LIKE`/`GLOB`/`REGEXP` or SQLite-specific functions.
- Check for JSON-field usage: on SQLite JSON fields may have been stored as `Text` while in Postgres you'd prefer `JSONField`.
- If any custom SQL used `AUTOINCREMENT` or `WITHOUT ROWID` features, adjust accordingly.

Rollback strategy
- Keep a copy of `data.json` exported from SQLite.
- If needed, you can re-point `DATABASES` back to SQLite by unsetting `DATABASE_URL` and restoring `db.sqlite3` from a backup.

Deployment notes
- Ensure `DATABASE_URL` is set in your host environment (Render, Heroku, Vercel, Docker, CI).
- Use `CONN_MAX_AGE` for persistent connections in production. The project reads `CONN_MAX_AGE` from env var.
- Ensure any DB credentials are stored securely in your CI/CD secrets.

Verification commands summary

```bash
pip install -r backend/requirements.txt
# set DATABASE_URL
python backend/manage.py migrate
python backend/manage.py dumpdata --natural-foreign --natural-primary > data.json  # (from SQLite)
python backend/manage.py loaddata data.json  # (into Postgres)
python backend/manage.py test
```

If you want, I can produce a PowerShell script to automate dump/migrate/loaddata steps and a small checklist to run before switching production to Postgres.

PowerShell automation
---------------------
I added a helper script: `migrate_sqlite_to_postgres.ps1` in the `backend/` folder. Example usage (PowerShell):

```powershell
# Set DATABASE_URL and run the script
$env:DATABASE_URL = 'postgres://threepl_user:securepassword@localhost:5432/threepl_db'
.\migrate_sqlite_to_postgres.ps1

# Or create DB/user automatically (requires `psql` and postgres superuser access)
.\migrate_sqlite_to_postgres.ps1 -DatabaseUrl 'postgres://threepl_user:securepassword@localhost:5432/threepl_db' -CreateDb
```

The script will:
- `dumpdata` from the current SQLite `db.sqlite3` to `data.json`
- optionally create DB/user via `psql` (when `-CreateDb` used)
- set `DATABASE_URL` in the current session
- run `migrate`, `loaddata`, and `test`

If you'd like, I can run the script now on this machine — provide DB credentials or confirm a local Postgres instance is available and I will execute it.
