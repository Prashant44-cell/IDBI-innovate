"""
db/init_db.py — Create all tables and seed demo data on first startup.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from db.database import Base, SessionLocal, engine

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_tables() -> None:
    """Import all models so Metadata knows about them, then create tables."""
    # noqa: F401 — side-effect imports so SQLAlchemy registers the models
    import models.user          # noqa: F401
    import models.transaction   # noqa: F401
    import models.banking       # noqa: F401
    import models.analytics     # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("All database tables created (or already exist).")


def seed_demo_data(db: Session) -> None:
    """Insert realistic demo data if the users table is empty."""
    from models.user import User, Account
    from models.transaction import Transaction, Beneficiary, UPIId
    from models.banking import Bill, Workflow
    from models.analytics import LoyaltyEvent, SurveyResponse, SecurityEvent

    if db.query(User).count() > 0:
        logger.info("Demo data already present — skipping seed.")
        return

    logger.info("Seeding demo data…")

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    user1 = User(
        id="usr_001",
        full_name="Priya Sharma",
        email="priya.sharma@example.com",
        phone="9876543210",
        hashed_password=pwd_context.hash("Demo@1234"),
        kyc_status="verified",
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=180),
    )
    user2 = User(
        id="usr_002",
        full_name="Arjun Mehta",
        email="arjun.mehta@example.com",
        phone="9123456780",
        hashed_password=pwd_context.hash("Demo@1234"),
        kyc_status="pending",
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=30),
    )
    db.add_all([user1, user2])
    db.flush()

    # ------------------------------------------------------------------
    # Accounts
    # ------------------------------------------------------------------
    acc1 = Account(
        id="acc_001",
        user_id="usr_001",
        account_number="1234567890123456",
        account_type="savings",
        balance=142500.75,
        currency="INR",
        ifsc_code="IDBI0001234",
        branch="Mumbai Main",
        is_active=True,
    )
    acc2 = Account(
        id="acc_002",
        user_id="usr_001",
        account_number="9876543210123456",
        account_type="current",
        balance=550000.00,
        currency="INR",
        ifsc_code="IDBI0001234",
        branch="Mumbai Main",
        is_active=True,
    )
    acc3 = Account(
        id="acc_003",
        user_id="usr_002",
        account_number="1122334455667788",
        account_type="savings",
        balance=8900.50,
        currency="INR",
        ifsc_code="IDBI0005678",
        branch="Delhi Central",
        is_active=True,
    )
    db.add_all([acc1, acc2, acc3])
    db.flush()

    # ------------------------------------------------------------------
    # Transactions
    # ------------------------------------------------------------------
    categories = ["Food", "Transport", "Shopping", "Utilities", "Healthcare"]
    txns = []
    for i in range(20):
        days_ago = i * 4
        txns.append(
            Transaction(
                id=f"txn_{i+1:03d}",
                account_id="acc_001",
                txn_type="debit" if i % 3 != 0 else "credit",
                amount=round(500 + i * 150.5, 2),
                balance_after=round(142500.75 - i * 150.5, 2),
                description=f"Demo transaction {i+1}",
                category=categories[i % len(categories)],
                status="completed",
                reference_number=f"REF{i+1:010d}",
                created_at=datetime.utcnow() - timedelta(days=days_ago),
            )
        )
    db.add_all(txns)

    # ------------------------------------------------------------------
    # Beneficiaries
    # ------------------------------------------------------------------
    bene = Beneficiary(
        id="ben_001",
        user_id="usr_001",
        name="Rahul Gupta",
        account_number="5566778899001122",
        ifsc_code="HDFC0001234",
        bank_name="HDFC Bank",
        is_active=True,
    )
    db.add(bene)

    # ------------------------------------------------------------------
    # UPI IDs
    # ------------------------------------------------------------------
    upi = UPIId(
        id="upi_001",
        user_id="usr_001",
        upi_id="priya.sharma@idbi",
        linked_account_id="acc_001",
        is_primary=True,
        is_active=True,
    )
    db.add(upi)

    # ------------------------------------------------------------------
    # Bills
    # ------------------------------------------------------------------
    bills = [
        Bill(
            id="bill_001",
            user_id="usr_001",
            biller_name="Mumbai Electricity Board",
            biller_type="electricity",
            consumer_number="MEB123456",
            amount=2450.00,
            due_date=datetime.utcnow() + timedelta(days=5),
            status="pending",
            autopay_enabled=False,
        ),
        Bill(
            id="bill_002",
            user_id="usr_001",
            biller_name="Jio Telecom",
            biller_type="mobile",
            consumer_number="9876543210",
            amount=599.00,
            due_date=datetime.utcnow() + timedelta(days=12),
            status="pending",
            autopay_enabled=True,
        ),
    ]
    db.add_all(bills)

    # ------------------------------------------------------------------
    # Workflows
    # ------------------------------------------------------------------
    wf = Workflow(
        id="wf_001",
        user_id="usr_001",
        workflow_type="loan_application",
        title="Personal Loan Application",
        status="in_progress",
        current_step=2,
        total_steps=5,
        metadata_json='{"loan_amount": 200000, "tenure_months": 24}',
        created_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(wf)

    # ------------------------------------------------------------------
    # Loyalty Events
    # ------------------------------------------------------------------
    loyalty_events = [
        LoyaltyEvent(
            id=f"loy_{i+1:03d}",
            user_id="usr_001",
            event_type="earn",
            points=i * 50 + 100,
            description=f"Points earned on transaction {i+1}",
            created_at=datetime.utcnow() - timedelta(days=i * 10),
        )
        for i in range(5)
    ]
    db.add_all(loyalty_events)

    # ------------------------------------------------------------------
    # Survey Responses
    # ------------------------------------------------------------------
    survey = SurveyResponse(
        id="srv_001",
        user_id="usr_001",
        survey_type="nps",
        score=8,
        feedback="Great banking experience, UI could be improved.",
        created_at=datetime.utcnow() - timedelta(days=15),
    )
    db.add(survey)

    # ------------------------------------------------------------------
    # Security Events
    # ------------------------------------------------------------------
    sec_events = [
        SecurityEvent(
            id="sec_001",
            user_id="usr_001",
            event_type="login_success",
            ip_address="103.56.78.90",
            device_info="Chrome/Windows",
            status="resolved",
            created_at=datetime.utcnow() - timedelta(hours=2),
        ),
        SecurityEvent(
            id="sec_002",
            user_id="usr_001",
            event_type="failed_login",
            ip_address="198.51.100.0",
            device_info="Unknown",
            status="flagged",
            created_at=datetime.utcnow() - timedelta(hours=5),
        ),
    ]
    db.add_all(sec_events)

    db.commit()
    logger.info("Demo data seeded successfully.")


def init_db() -> None:
    """Entry point called on app startup."""
    create_tables()
    db: Session = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
