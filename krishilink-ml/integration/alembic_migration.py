"""Add demand_forecasts, demand_curve_points, and extended price_bands columns."""

from alembic import op  # type: ignore[import-not-found]
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261120_ml_tables"
down_revision = None  # Set to your latest Alembic revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Extend existing price_bands table (or create if bootstrapping)
    op.add_column("price_bands", sa.Column("hub_id", sa.String(64), nullable=False, server_default="hub_blr_main"))
    op.add_column("price_bands", sa.Column("published_low", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("price_bands", sa.Column("published_high", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("price_bands", sa.Column("coverage_pct", sa.Numeric(5, 2), nullable=False, server_default="85.0"))
    op.add_column("price_bands", sa.Column("pricing_mode", sa.String(32), nullable=False, server_default="ml_default"))
    op.add_column("price_bands", sa.Column("is_fallback", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("price_bands", sa.Column("is_overridden", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("price_bands", sa.Column("override_low", sa.Integer(), nullable=True))
    op.add_column("price_bands", sa.Column("override_high", sa.Integer(), nullable=True))
    op.add_column("price_bands", sa.Column("override_reason", sa.Text(), nullable=True))
    op.add_column("price_bands", sa.Column("sparkline_7d", postgresql.JSONB(), nullable=False, server_default="[]"))
    op.create_unique_constraint(
        "uq_price_bands_hub_crop_date", "price_bands", ["hub_id", "crop_id", "delivery_date"]
    )

    # 2. Demand forecasts table
    op.create_table(
        "demand_forecasts",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("hub_id", sa.String(64), nullable=False),
        sa.Column("crop_id", sa.String(64), nullable=False),
        sa.Column("delivery_date", sa.Date(), nullable=False),
        sa.Column("q10_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("q50_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("q90_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("buffer_lambda", sa.Numeric(4, 3), nullable=False, server_default="0.000"),
        sa.Column("suggested_procurement_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_cold_start", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("model_type", sa.String(32), nullable=False),
        sa.Column("model_version", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("hub_id", "crop_id", "delivery_date", name="uq_demand_hub_crop_date"),
    )
    op.create_index("ix_demand_forecasts_date_hub", "demand_forecasts", ["delivery_date", "hub_id"])

    # 3. Reconciled hourly demand curve points
    op.create_table(
        "demand_curve_points",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("hub_id", sa.String(64), nullable=False),
        sa.Column("delivery_date", sa.Date(), nullable=False),
        sa.Column("hour_ist", sa.String(8), nullable=False),
        sa.Column("q10_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("q50_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("q90_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("hub_id", "delivery_date", "hour_ist", name="uq_curve_hub_date_hr"),
    )


def downgrade() -> None:
    op.drop_table("demand_curve_points")
    op.drop_table("demand_forecasts")
    op.drop_constraint("uq_price_bands_hub_crop_date", "price_bands", type_="unique")
    for col in (
        "sparkline_7d", "override_reason", "override_high", "override_low",
        "is_overridden", "is_fallback", "pricing_mode", "coverage_pct",
        "published_high", "published_low", "hub_id",
    ):
        op.drop_column("price_bands", col)