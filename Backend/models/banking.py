"""
models/banking.py — Bill and Workflow ORM models.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"), nullable=False, index=True)
    biller_name: Mapped[str] = mapped_column(String(150), nullable=False)
    biller_type: Mapped[str] = mapped_column(String(50), nullable=False)
    consumer_number: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    autopay_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"), nullable=False, index=True)
    workflow_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_steps: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    metadata_json: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
