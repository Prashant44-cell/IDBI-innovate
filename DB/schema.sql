-- ============================================================
-- IDBI Innovate Banking Platform
-- Full PostgreSQL Schema — Version 1.0.0
-- Created: July 2026
-- PostgreSQL >= 15.x required
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('savings', 'current', 'fd', 'rd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('active', 'dormant', 'frozen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status_enum AS ENUM ('success', 'pending', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_channel_enum AS ENUM ('branch', 'upi', 'netbanking', 'atm', 'pos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE biller_category_enum AS ENUM ('electricity', 'water', 'gas', 'mobile', 'dth', 'broadband', 'insurance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE bill_status_enum AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status_enum AS ENUM ('not_uploaded', 'under_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE doc_type_enum AS ENUM ('aadhaar', 'pan', 'passport', 'voter_id', 'driving_licence');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE workflow_type_enum AS ENUM ('account_opening', 'kyc_verification', 'loan_application');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE workflow_status_enum AS ENUM ('pending', 'under_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE loyalty_event_type_enum AS ENUM ('earned', 'redeemed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE security_event_type_enum AS ENUM ('login', 'logout', 'failed_login', 'mpin_change', 'suspicious_activity');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE: users
-- Core customer identity table
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(150)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    password_hash       TEXT            NOT NULL,
    mpin_hash           TEXT            NOT NULL,
    face_registered     BOOLEAN         NOT NULL DEFAULT FALSE,
    profile_image       TEXT,
    account_type        VARCHAR(50)     NOT NULL DEFAULT 'individual'
                            CHECK (account_type IN ('individual', 'joint', 'minor', 'nri', 'corporate')),
    branch_code         VARCHAR(20)     NOT NULL,
    kyc_status          kyc_status_enum NOT NULL DEFAULT 'not_uploaded',
    loyalty_points      INT             NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_name_nonempty CHECK (TRIM(name) <> '')
);

CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status   ON users (kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_branch_code  ON users (branch_code);
CREATE INDEX IF NOT EXISTS idx_users_created_at   ON users (created_at DESC);

COMMENT ON TABLE  users IS 'Core customer identity and profile table';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash of login password — never store plaintext';
COMMENT ON COLUMN users.mpin_hash IS 'bcrypt hash of 6-digit MPIN — never store plaintext';
COMMENT ON COLUMN users.face_registered IS 'TRUE if biometric face vector has been enrolled in the facial auth vault';
COMMENT ON COLUMN users.loyalty_points IS 'Current unredeemed loyalty point balance';

-- ============================================================
-- TABLE: accounts
-- Bank accounts owned by users
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number      VARCHAR(20)             NOT NULL,
    account_type        account_type_enum       NOT NULL DEFAULT 'savings',
    balance             NUMERIC(15, 2)          NOT NULL DEFAULT 0.00,
    available_balance   NUMERIC(15, 2)          NOT NULL DEFAULT 0.00,
    branch_code         VARCHAR(20)             NOT NULL,
    ifsc_code           VARCHAR(11)             NOT NULL,
    status              account_status_enum     NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    CONSTRAINT accounts_account_number_unique UNIQUE (account_number),
    CONSTRAINT accounts_balance_nonnegative   CHECK (balance >= 0),
    CONSTRAINT accounts_available_nonnegative CHECK (available_balance >= 0),
    CONSTRAINT accounts_available_lte_balance CHECK (available_balance <= balance),
    CONSTRAINT accounts_ifsc_format           CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id        ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts (account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_status         ON accounts (status);
CREATE INDEX IF NOT EXISTS idx_accounts_type           ON accounts (account_type);

COMMENT ON TABLE  accounts IS 'Bank accounts (savings, current, FD, RD) linked to users';
COMMENT ON COLUMN accounts.balance IS 'Total ledger balance including pending holds';
COMMENT ON COLUMN accounts.available_balance IS 'Immediately spendable balance after holds';
COMMENT ON COLUMN accounts.ifsc_code IS 'RBI-format 11-char IFSC code';

-- ============================================================
-- TABLE: transactions
-- Immutable ledger of all financial movements
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID                        NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type                transaction_type_enum       NOT NULL,
    amount              NUMERIC(15, 2)              NOT NULL CHECK (amount > 0),
    balance_after       NUMERIC(15, 2)              NOT NULL,
    description         TEXT,
    category            VARCHAR(80),
    reference_number    VARCHAR(50)                 NOT NULL,
    status              transaction_status_enum     NOT NULL DEFAULT 'success',
    channel             transaction_channel_enum    NOT NULL DEFAULT 'netbanking',
    metadata            JSONB,
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),

    CONSTRAINT transactions_reference_unique UNIQUE (reference_number)
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id       ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at       ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type             ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_status           ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_channel          ON transactions (channel);
CREATE INDEX IF NOT EXISTS idx_transactions_category         ON transactions (category);
CREATE INDEX IF NOT EXISTS idx_transactions_reference        ON transactions (reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_metadata         ON transactions USING GIN (metadata);

-- Composite index for common account+date queries
CREATE INDEX IF NOT EXISTS idx_transactions_acct_date
    ON transactions (account_id, created_at DESC);

COMMENT ON TABLE  transactions IS 'Immutable double-entry financial ledger — never UPDATE or DELETE rows';
COMMENT ON COLUMN transactions.balance_after IS 'Account balance immediately after this transaction posted';
COMMENT ON COLUMN transactions.metadata IS 'Channel-specific extra data: UPI VPA, merchant info, etc.';
COMMENT ON COLUMN transactions.reference_number IS 'Bank/UPI reference; must be globally unique';

-- ============================================================
-- TABLE: beneficiaries
-- Saved payee/recipient list per user
-- ============================================================

CREATE TABLE IF NOT EXISTS beneficiaries (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(150)    NOT NULL,
    account_number      VARCHAR(20),
    ifsc                VARCHAR(11),
    bank_name           VARCHAR(100),
    upi_id              VARCHAR(100),
    is_verified         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT beneficiaries_contact_required
        CHECK (account_number IS NOT NULL OR upi_id IS NOT NULL),
    CONSTRAINT beneficiaries_ifsc_format
        CHECK (ifsc IS NULL OR ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON beneficiaries (user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_upi_id  ON beneficiaries (upi_id);

COMMENT ON TABLE beneficiaries IS 'Saved payees; at least one of account_number or upi_id must be present';

-- ============================================================
-- TABLE: upi_ids
-- Virtual Payment Addresses (VPA) linked to user accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS upi_ids (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vpa                 VARCHAR(100) NOT NULL,
    linked_account_id   UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT upi_ids_vpa_unique UNIQUE (vpa),
    CONSTRAINT upi_ids_vpa_format CHECK (vpa ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_upi_ids_user_id          ON upi_ids (user_id);
CREATE INDEX IF NOT EXISTS idx_upi_ids_vpa              ON upi_ids (vpa);
CREATE INDEX IF NOT EXISTS idx_upi_ids_linked_account   ON upi_ids (linked_account_id);

COMMENT ON TABLE upi_ids IS 'UPI Virtual Payment Addresses — each VPA is globally unique';

-- ============================================================
-- TABLE: bills
-- Registered biller accounts and payment status
-- ============================================================

CREATE TABLE IF NOT EXISTS bills (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    biller_name         VARCHAR(150)            NOT NULL,
    biller_category     biller_category_enum    NOT NULL,
    consumer_number     VARCHAR(50)             NOT NULL,
    amount              NUMERIC(12, 2)          CHECK (amount > 0),
    due_date            DATE,
    status              bill_status_enum        NOT NULL DEFAULT 'pending',
    auto_pay            BOOLEAN                 NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_user_id          ON bills (user_id);
CREATE INDEX IF NOT EXISTS idx_bills_status           ON bills (status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date         ON bills (due_date);
CREATE INDEX IF NOT EXISTS idx_bills_biller_category  ON bills (biller_category);

COMMENT ON TABLE bills IS 'Registered billers with consumer numbers and payment tracking';

-- ============================================================
-- TABLE: kyc_docs
-- KYC document records (URLs to encrypted blob storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS kyc_docs (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type            doc_type_enum       NOT NULL,
    front_image_url     TEXT,
    back_image_url      TEXT,
    status              kyc_status_enum     NOT NULL DEFAULT 'not_uploaded',
    verified_at         TIMESTAMPTZ,
    ocr_data            JSONB,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT kyc_docs_verified_at_check
        CHECK (status <> 'verified' OR verified_at IS NOT NULL),
    CONSTRAINT kyc_docs_user_doc_unique
        UNIQUE (user_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_kyc_docs_user_id ON kyc_docs (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_status  ON kyc_docs (status);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_type    ON kyc_docs (doc_type);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_ocr     ON kyc_docs USING GIN (ocr_data);

COMMENT ON TABLE  kyc_docs IS 'KYC document metadata; image files stored externally in encrypted blob storage';
COMMENT ON COLUMN kyc_docs.ocr_data IS 'Structured OCR output: name, DOB, ID number, address fields';

-- ============================================================
-- TABLE: workflows
-- Back-office workflow queue for customer service requests
-- ============================================================

CREATE TABLE IF NOT EXISTS workflows (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_type       workflow_type_enum      NOT NULL,
    status              workflow_status_enum    NOT NULL DEFAULT 'pending',
    assigned_to         VARCHAR(100),
    sla_deadline        TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id   ON workflows (user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status    ON workflows (status);
CREATE INDEX IF NOT EXISTS idx_workflows_type      ON workflows (workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflows_assigned  ON workflows (assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflows_sla       ON workflows (sla_deadline);

COMMENT ON TABLE workflows IS 'Back-office processing queue; SLA deadline auto-calculated on insert by trigger';

-- ============================================================
-- TABLE: loyalty_events
-- Ledger of all loyalty point earn/redeem/expire events
-- ============================================================

CREATE TABLE IF NOT EXISTS loyalty_events (
    id                  UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type          loyalty_event_type_enum     NOT NULL,
    points              INT                         NOT NULL CHECK (points > 0),
    description         TEXT                        NOT NULL,
    reference_id        VARCHAR(100),
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_user_id    ON loyalty_events (user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_type       ON loyalty_events (event_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_events_created_at ON loyalty_events (created_at DESC);

COMMENT ON TABLE loyalty_events IS 'Immutable ledger of all loyalty point movements per user';

-- ============================================================
-- TABLE: survey_responses
-- Customer satisfaction and NPS survey submissions
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_responses (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nps_score           INT         CHECK (nps_score BETWEEN 0 AND 10),
    csat_score          INT         CHECK (csat_score BETWEEN 1 AND 5),
    feedback            TEXT,
    service_category    VARCHAR(80),
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_responses_at_least_one_score
        CHECK (nps_score IS NOT NULL OR csat_score IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id       ON survey_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at  ON survey_responses (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_nps           ON survey_responses (nps_score);
CREATE INDEX IF NOT EXISTS idx_survey_responses_category      ON survey_responses (service_category);

COMMENT ON TABLE survey_responses IS 'NPS and CSAT survey data; at least one score field required';

-- ============================================================
-- TABLE: security_events
-- Audit log of all authentication and security events (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS security_events (
    id                  UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                        REFERENCES users(id) ON DELETE SET NULL,
    event_type          security_event_type_enum    NOT NULL,
    ip_address          INET,
    device_info         TEXT,
    location            VARCHAR(120),
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id    ON security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type       ON security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip         ON security_events (ip_address);

COMMENT ON TABLE security_events IS 'Append-only security audit log — protected by trigger against UPDATE/DELETE';

-- ============================================================
-- TABLE: powerbi_push_log
-- Log of all analytics payloads pushed to Power BI streaming datasets
-- ============================================================

CREATE TABLE IF NOT EXISTS powerbi_push_log (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type  VARCHAR(80) NOT NULL,
    payload     JSONB       NOT NULL,
    pushed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status      VARCHAR(20) NOT NULL DEFAULT 'success'
                    CHECK (status IN ('success', 'failed', 'retrying')),
    error_msg   TEXT,
    retry_count INT         NOT NULL DEFAULT 0 CHECK (retry_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_powerbi_push_log_event_type ON powerbi_push_log (event_type);
CREATE INDEX IF NOT EXISTS idx_powerbi_push_log_pushed_at  ON powerbi_push_log (pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_powerbi_push_log_status     ON powerbi_push_log (status);
CREATE INDEX IF NOT EXISTS idx_powerbi_push_log_payload    ON powerbi_push_log USING GIN (payload);

COMMENT ON TABLE powerbi_push_log IS 'Audit trail of all analytics events dispatched to Power BI';

-- ============================================================
-- TRIGGERS
-- ============================================================

-- -------------------------------------------------------
-- Trigger: auto-update updated_at on all mutable tables
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$ DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'users', 'accounts', 'beneficiaries', 'upi_ids',
        'bills', 'kyc_docs', 'workflows'
    ] LOOP
        EXECUTE FORMAT(
            'CREATE OR REPLACE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
            tbl, tbl
        );
    END LOOP;
END $$;

-- -------------------------------------------------------
-- Trigger: protect security_events from UPDATE / DELETE
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_security_events_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'security_events is an append-only audit log — UPDATE and DELETE are not permitted';
END;
$$;

CREATE OR REPLACE TRIGGER trg_security_events_no_update
    BEFORE UPDATE ON security_events
    FOR EACH ROW EXECUTE FUNCTION fn_security_events_immutable();

CREATE OR REPLACE TRIGGER trg_security_events_no_delete
    BEFORE DELETE ON security_events
    FOR EACH ROW EXECUTE FUNCTION fn_security_events_immutable();

-- -------------------------------------------------------
-- Trigger: protect transactions from UPDATE / DELETE
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_transactions_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Allow status updates only (for reversal workflows)
    IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status
       AND NEW.status = 'reversed' THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'transactions is an immutable ledger — only status→reversed transitions are permitted';
END;
$$;

CREATE OR REPLACE TRIGGER trg_transactions_guard
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_transactions_immutable();

CREATE OR REPLACE TRIGGER trg_transactions_no_delete
    BEFORE DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_transactions_immutable();

-- -------------------------------------------------------
-- Trigger: sync users.loyalty_points from loyalty_events
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_sync_loyalty_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.event_type = 'earned' THEN
        UPDATE users
        SET loyalty_points = loyalty_points + NEW.points
        WHERE id = NEW.user_id;
    ELSIF NEW.event_type IN ('redeemed', 'expired') THEN
        UPDATE users
        SET loyalty_points = GREATEST(0, loyalty_points - NEW.points)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_loyalty_events_sync_points
    AFTER INSERT ON loyalty_events
    FOR EACH ROW EXECUTE FUNCTION fn_sync_loyalty_points();

-- -------------------------------------------------------
-- Trigger: auto-set SLA deadline on workflow insert
-- SLA: kyc_verification=48h, account_opening=72h, loan_application=5d
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_workflow_set_sla()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.sla_deadline IS NULL THEN
        NEW.sla_deadline := CASE NEW.workflow_type
            WHEN 'kyc_verification'  THEN NOW() + INTERVAL '48 hours'
            WHEN 'account_opening'   THEN NOW() + INTERVAL '72 hours'
            WHEN 'loan_application'  THEN NOW() + INTERVAL '5 days'
            ELSE NOW() + INTERVAL '72 hours'
        END;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_workflow_set_sla
    BEFORE INSERT ON workflows
    FOR EACH ROW EXECUTE FUNCTION fn_workflow_set_sla();

-- -------------------------------------------------------
-- Trigger: update users.kyc_status when a kyc_doc is verified
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_kyc_doc_status_propagate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    verified_count INT;
    total_count    INT;
BEGIN
    -- Count verified docs for this user
    SELECT COUNT(*) FILTER (WHERE status = 'verified'),
           COUNT(*)
    INTO verified_count, total_count
    FROM kyc_docs
    WHERE user_id = NEW.user_id;

    -- Require at least 2 verified documents (e.g., aadhaar + pan)
    IF verified_count >= 2 THEN
        UPDATE users SET kyc_status = 'verified' WHERE id = NEW.user_id;
    ELSIF EXISTS (
        SELECT 1 FROM kyc_docs
        WHERE user_id = NEW.user_id AND status = 'under_review'
    ) THEN
        UPDATE users SET kyc_status = 'under_review' WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_kyc_doc_propagate
    AFTER INSERT OR UPDATE ON kyc_docs
    FOR EACH ROW EXECUTE FUNCTION fn_kyc_doc_status_propagate();

-- ============================================================
-- VIEWS
-- ============================================================

-- Customer 360 summary view
CREATE OR REPLACE VIEW vw_customer_360 AS
SELECT
    u.id                        AS user_id,
    u.name,
    u.email,
    u.account_type,
    u.kyc_status,
    u.loyalty_points,
    u.face_registered,
    u.branch_code,
    u.created_at                AS member_since,
    COUNT(DISTINCT a.id)        AS total_accounts,
    SUM(a.balance)              AS total_balance,
    COUNT(DISTINCT b.id)        AS total_beneficiaries,
    COUNT(DISTINCT up.id)       AS total_upi_ids,
    COUNT(DISTINCT bl.id) FILTER (WHERE bl.status = 'pending')  AS pending_bills,
    COUNT(DISTINCT bl.id) FILTER (WHERE bl.status = 'overdue')  AS overdue_bills
FROM users u
LEFT JOIN accounts     a  ON a.user_id = u.id AND a.status = 'active'
LEFT JOIN beneficiaries b ON b.user_id = u.id
LEFT JOIN upi_ids      up ON up.user_id = u.id AND up.is_active = TRUE
LEFT JOIN bills        bl ON bl.user_id = u.id
GROUP BY u.id;

COMMENT ON VIEW vw_customer_360 IS 'Aggregated customer summary for dashboard and CRM';

-- Recent transactions view (last 90 days)
CREATE OR REPLACE VIEW vw_recent_transactions AS
SELECT
    t.id,
    t.account_id,
    a.account_number,
    u.id        AS user_id,
    u.name      AS user_name,
    t.type,
    t.amount,
    t.balance_after,
    t.description,
    t.category,
    t.reference_number,
    t.status,
    t.channel,
    t.metadata,
    t.created_at
FROM transactions t
JOIN accounts a ON a.id = t.account_id
JOIN users    u ON u.id = a.user_id
WHERE t.created_at >= NOW() - INTERVAL '90 days';

COMMENT ON VIEW vw_recent_transactions IS 'Transactions in the last 90 days with denormalized user/account info';

-- Pending KYC workflow view
CREATE OR REPLACE VIEW vw_pending_kyc AS
SELECT
    w.id            AS workflow_id,
    w.workflow_type,
    w.status,
    w.assigned_to,
    w.sla_deadline,
    w.notes,
    w.created_at,
    u.id            AS user_id,
    u.name          AS user_name,
    u.email,
    u.branch_code,
    u.kyc_status,
    CASE
        WHEN w.sla_deadline < NOW() THEN 'BREACHED'
        WHEN w.sla_deadline < NOW() + INTERVAL '6 hours' THEN 'AT_RISK'
        ELSE 'ON_TRACK'
    END AS sla_health
FROM workflows w
JOIN users u ON u.id = w.user_id
WHERE w.status IN ('pending', 'under_review');

COMMENT ON VIEW vw_pending_kyc IS 'Open workflows with SLA health indicator for back-office dashboard';
