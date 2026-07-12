# IDBI Innovate — Database Layer

## Overview

This directory contains all database artifacts for the **IDBI Innovate** banking platform:

| File / Folder | Purpose |
|---|---|
| `schema.sql` | Full PostgreSQL DDL (tables, indexes, constraints, triggers) |
| `seed_data.sql` | Demo data for development and testing |
| `migrations/` | Numbered, versioned migration scripts |

---

## Prerequisites

### Production / Staging — PostgreSQL

| Requirement | Version |
|---|---|
| PostgreSQL | ≥ 15.x |
| pgcrypto extension | Bundled with PostgreSQL |
| uuid-ossp extension | Bundled with PostgreSQL |

### Development — SQLite (optional lightweight mode)

| Requirement | Version |
|---|---|
| SQLite | ≥ 3.39 |
| Node.js (if using better-sqlite3) | ≥ 18 |

> **Note:** The schema uses PostgreSQL-specific features (UUID, JSONB, ENUM types, triggers). For SQLite dev mode, use the compatibility shim described below.

---

## Quick Start — PostgreSQL

### 1. Install PostgreSQL (Windows)

```powershell
# Using Chocolatey
choco install postgresql15 --params '/Password:yourpassword'

# Or download the installer from https://www.postgresql.org/download/windows/
```

### 2. Create the Database

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create dedicated role and database
CREATE ROLE idbi_app WITH LOGIN PASSWORD 'idbi_secure_pass_2025';
CREATE DATABASE idbi_innovate OWNER idbi_app;
\c idbi_innovate

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Apply the Schema

```powershell
# From the DB/ directory
psql -U idbi_app -d idbi_innovate -f schema.sql
```

### 4. Load Seed Data

```powershell
psql -U idbi_app -d idbi_innovate -f seed_data.sql
```

### 5. Run Migrations (if applying to an existing DB)

```powershell
# Apply migrations in order
psql -U idbi_app -d idbi_innovate -f migrations/001_initial.sql
psql -U idbi_app -d idbi_innovate -f migrations/002_accounts_transactions.sql
psql -U idbi_app -d idbi_innovate -f migrations/003_upi_bills_beneficiaries.sql
psql -U idbi_app -d idbi_innovate -f migrations/004_kyc_workflows.sql
psql -U idbi_app -d idbi_innovate -f migrations/005_loyalty_surveys_security.sql
psql -U idbi_app -d idbi_innovate -f migrations/006_powerbi_events.sql
```

---

## Quick Start — SQLite (Dev Mode)

SQLite does not support PostgreSQL ENUMs, JSONB, or `uuid-ossp`. Use the following compatibility approach in your application layer:

### Compatibility Notes

| PostgreSQL Feature | SQLite Equivalent |
|---|---|
| `UUID` / `uuid_generate_v4()` | `TEXT` + application-generated UUID |
| `JSONB` | `TEXT` (store as JSON string) |
| `ENUM` types | `TEXT` + CHECK constraints |
| `NUMERIC(15,2)` | `REAL` or `TEXT` |
| `TIMESTAMPTZ` | `TEXT` (ISO 8601 format) |
| `BOOL` | `INTEGER` (0/1) |

### SQLite Dev Setup

```bash
# Install SQLite CLI (Windows)
choco install sqlite

# Create the dev database
sqlite3 idbi_dev.db < schema_sqlite_compat.sql   # (generate from schema.sql with sed/awk)
sqlite3 idbi_dev.db < seed_data.sql
```

> A `schema_sqlite_compat.sql` conversion script can be auto-generated using the `scripts/pg_to_sqlite.js` utility (to be added in the `scripts/` folder).

---

## Environment Variables

Create a `.env` file at the project root (never commit this):

```env
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=idbi_innovate
DB_USER=idbi_app
DB_PASSWORD=idbi_secure_pass_2025
DB_SSL=false

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=10000

# Dev Mode Override (set to 'sqlite' to use SQLite)
DB_DRIVER=postgres
SQLITE_PATH=./idbi_dev.db
```

---

## Migration Strategy

Each migration file in `migrations/` follows this convention:

```sql
-- ============================================================
-- Migration: NNN_description.sql
-- Up:   applies changes
-- Down: reverts changes (placed inside a comment block for safety)
-- ============================================================

-- [UP]
... DDL statements ...

-- [DOWN] (run manually to revert)
-- DROP TABLE IF EXISTS ...;
```

Migrations are **idempotent** — they use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` so they can be safely re-run.

---

## Schema Overview

```
users
 ├── accounts          (1 user → many accounts)
 │    └── transactions (1 account → many transactions)
 ├── beneficiaries     (1 user → many beneficiaries)
 ├── upi_ids           (1 user → many VPAs, linked to accounts)
 ├── bills             (1 user → many biller registrations)
 ├── kyc_docs          (1 user → many KYC documents)
 ├── workflows         (1 user → many workflow items)
 ├── loyalty_events    (1 user → many point events)
 ├── survey_responses  (1 user → many survey submissions)
 └── security_events   (1 user → many audit events)

powerbi_push_log       (standalone analytics push log)
```

---

## Useful psql Commands

```sql
-- List all tables
\dt

-- Describe a table
\d users

-- Check row counts
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Show active connections
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE datname = 'idbi_innovate';

-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## Security Notes

- All passwords and MPINs are stored as **bcrypt hashes** — never plaintext.
- Face registration is stored as a **boolean flag** only; biometric vectors are held in a separate secure vault service.
- `kyc_docs` stores **URLs** to encrypted blob storage — images are never stored in the database.
- The `security_events` table is **append-only** (enforced by trigger — no `UPDATE` or `DELETE` allowed).
- Row-level security (RLS) policies should be applied per tenant in multi-tenant deployments.

---

## Contact / Ownership

| Role | Name |
|---|---|
| DB Architect | IDBI Innovate Platform Team |
| Schema Version | 1.0.0 (July 2026) |
| PostgreSQL Target | 15.x / 16.x |
