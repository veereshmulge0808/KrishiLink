"""Initial KrishiLink schema with PostgreSQL and PostGIS

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-19 21:50:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # 2. Enums
    op.execute("CREATE TYPE user_role AS ENUM ('buyer','farmer','driver','hub_staff','admin','super_admin');")
    op.execute("CREATE TYPE hub_type AS ENUM ('main','village','city');")
    op.execute("CREATE TYPE stock_status AS ENUM ('OUT','LOW','SUFFICIENT');")
    op.execute("CREATE TYPE listing_status AS ENUM ('DRAFT','INELIGIBLE','ELIGIBLE','SCHEDULED','COLLECTED','CANCELLED','EXPIRED');")
    op.execute("CREATE TYPE order_status AS ENUM ('PLACED','CONFIRMED','PARTIAL','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');")
    op.execute("CREATE TYPE trip_type AS ENUM ('FIRST_MILE','MIDDLE_MILE','LAST_MILE','TRANSFER');")
    op.execute("CREATE TYPE trip_status AS ENUM ('ASSIGNED','ACKNOWLEDGED','STARTED','AT_HUB','RETURNED','CLOSED','CANCELLED','INCIDENT');")
    op.execute("CREATE TYPE stop_type AS ENUM ('PICKUP','HUB','DELIVERY');")
    op.execute("CREATE TYPE stop_status AS ENUM ('PLANNED','EN_ROUTE','ARRIVED','IN_PROGRESS','COMPLETED','SKIPPED');")
    op.execute("CREATE TYPE transfer_status AS ENUM ('SUGGESTED','REQUESTED','APPROVED','ASSIGNED','IN_TRANSIT','RECEIVED','REJECTED','CANCELLED');")
    op.execute("CREATE TYPE grade AS ENUM ('A','B','REJECT');")
    op.execute("CREATE TYPE ledger_reason AS ENUM ('PICKUP','TRANSFER_IN','TRANSFER_OUT','SALE','WASTAGE','ADJUSTMENT','RETURN');")
    op.execute("CREATE TYPE payment_direction AS ENUM ('IN','OUT');")
    op.execute("CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');")

    # 3. Identity and Parties
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('phone', sa.String(20), unique=True, nullable=False),
        sa.Column('role', postgresql.ENUM('buyer', 'farmer', 'driver', 'hub_staff', 'admin', 'super_admin', name='user_role', create_type=False), nullable=False),
        sa.Column('name', sa.String(120), nullable=True),
        sa.Column('language', sa.String(10), server_default='kn', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'hubs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('type', postgresql.ENUM('main', 'village', 'city', name='hub_type', create_type=False), nullable=False),
        sa.Column('parent_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('location', sa.Text(), nullable=True), # In postgis: geography(Point, 4326)
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('capacity_kg', sa.Numeric(10, 2), nullable=True),
        sa.Column('has_cold_room', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False)
    )

    op.create_table(
        'farmers',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('village', sa.String(120), nullable=True),
        sa.Column('taluk', sa.String(120), nullable=True),
        sa.Column('district', sa.String(120), nullable=True),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('nearest_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('land_acres', sa.Numeric(6, 2), nullable=True),
        sa.Column('default_min_kg', sa.Numeric(8, 2), server_default='20.0', nullable=False),
        sa.Column('upi_id', sa.String(80), nullable=True),
        sa.Column('bank_account_ref', sa.String(80), nullable=True),
        sa.Column('reliability_score', sa.Numeric(4, 2), server_default='5.0', nullable=False),
        sa.Column('approved', sa.Boolean(), server_default='false', nullable=False)
    )

    op.create_table(
        'buyers',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('business_name', sa.String(160), nullable=False),
        sa.Column('business_type', sa.String(40), nullable=True),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('delivery_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('credit_limit', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('credit_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('approved', sa.Boolean(), server_default='false', nullable=False)
    )

    op.create_table(
        'vehicles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('reg_no', sa.String(20), unique=True, nullable=False),
        sa.Column('type', sa.String(40), nullable=True),
        sa.Column('capacity_kg', sa.Numeric(8, 2), nullable=False),
        sa.Column('ownership', sa.String(10), nullable=False),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False)
    )

    op.create_table(
        'drivers',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('licence_no', sa.String(30), nullable=True),
        sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('home_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('on_duty', sa.Boolean(), server_default='false', nullable=False)
    )

    op.create_table(
        'hub_staff',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), primary_key=True)
    )

    # 4. Crops and Thresholds
    op.create_table(
        'crops',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('slug', sa.String(60), unique=True, nullable=False),
        sa.Column('name_en', sa.String(80), nullable=False),
        sa.Column('name_kn', sa.String(80), nullable=True),
        sa.Column('category', sa.String(40), nullable=True),
        sa.Column('is_organic', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('unit', sa.String(10), server_default='kg', nullable=False),
        sa.Column('shelf_life_hours', sa.Integer(), nullable=True),
        sa.Column('perishability', sa.SmallInteger(), nullable=True),
        sa.Column('min_order_kg', sa.Numeric(8, 2), server_default='10.0', nullable=False),
        sa.Column('default_min_kg', sa.Numeric(8, 2), server_default='20.0', nullable=False),
        sa.Column('icon_url', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False)
    )

    op.create_table(
        'farmer_crop_thresholds',
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.user_id', ondelete='CASCADE'), primary_key=True),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('min_kg', sa.Numeric(8, 2), nullable=False)
    )

    # 5. Stock and Ledger
    op.create_table(
        'hub_stock_status',
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('status', postgresql.ENUM('OUT', 'LOW', 'SUFFICIENT', name='stock_status', create_type=False), server_default='OUT', nullable=False),
        sa.Column('suggested', postgresql.ENUM('OUT', 'LOW', 'SUFFICIENT', name='stock_status', create_type=False), nullable=True),
        sa.Column('set_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('set_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'hub_stock_status_history',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_status', postgresql.ENUM('OUT', 'LOW', 'SUFFICIENT', name='stock_status', create_type=False), nullable=True),
        sa.Column('new_status', postgresql.ENUM('OUT', 'LOW', 'SUFFICIENT', name='stock_status', create_type=False), nullable=False),
        sa.Column('source', sa.String(10), nullable=False),
        sa.Column('set_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'stock_ledger',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('delta_kg', sa.Numeric(12, 3), nullable=False),
        sa.Column('reason', postgresql.ENUM('PICKUP', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'WASTAGE', 'ADJUSTMENT', 'RETURN', name='ledger_reason', create_type=False), nullable=False),
        sa.Column('ref_type', sa.String(30), nullable=True),
        sa.Column('ref_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('grade', postgresql.ENUM('A', 'B', 'REJECT', name='grade', create_type=False), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_stock_ledger_hub_crop_date', 'stock_ledger', ['hub_id', 'crop_id', 'created_at'])

    # 6. Supply: Listings and Pickups
    op.create_table(
        'farmer_listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('listing_date', sa.Date(), nullable=False),
        sa.Column('est_kg', sa.Numeric(8, 2), nullable=False),
        sa.Column('ready_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ready_by', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', postgresql.ENUM('DRAFT', 'INELIGIBLE', 'ELIGIBLE', 'SCHEDULED', 'COLLECTED', 'CANCELLED', 'EXPIRED', name='listing_status', create_type=False), server_default='DRAFT', nullable=False),
        sa.Column('min_kg_applied', sa.Numeric(8, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('farmer_id', 'crop_id', 'listing_date', name='uq_farmer_crop_date')
    )

    # 7. Demand: Orders
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('buyer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('buyers.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('delivery_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('delivery_date', sa.Date(), nullable=False),
        sa.Column('slot_start', sa.Time(), nullable=True),
        sa.Column('slot_end', sa.Time(), nullable=True),
        sa.Column('status', postgresql.ENUM('PLACED', 'CONFIRMED', 'PARTIAL', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', name='order_status', create_type=False), server_default='PLACED', nullable=False),
        sa.Column('subtotal', sa.BigInteger(), nullable=True),
        sa.Column('delivery_fee', sa.BigInteger(), server_default='0', nullable=True),
        sa.Column('total', sa.BigInteger(), nullable=True),
        sa.Column('payment_mode', sa.String(10), server_default='PREPAID', nullable=False),
        sa.Column('idempotency_key', sa.String(100), unique=True, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('qty_kg', sa.Numeric(8, 2), nullable=False),
        sa.Column('confirmed_kg', sa.Numeric(8, 2), nullable=True),
        sa.Column('delivered_kg', sa.Numeric(8, 2), nullable=True),
        sa.Column('rejected_kg', sa.Numeric(8, 2), server_default='0.0', nullable=False),
        sa.Column('price_per_kg_locked', sa.BigInteger(), nullable=True),
        sa.Column('reject_reason', sa.String(255), nullable=True)
    )

    # 8. Trips and Logistics
    op.create_table(
        'trips',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('type', postgresql.ENUM('FIRST_MILE', 'MIDDLE_MILE', 'LAST_MILE', 'TRANSFER', name='trip_type', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('ASSIGNED', 'ACKNOWLEDGED', 'STARTED', 'AT_HUB', 'RETURNED', 'CLOSED', 'CANCELLED', 'INCIDENT', name='trip_status', create_type=False), server_default='ASSIGNED', nullable=False),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('drivers.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('origin_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('dest_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('planned_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('planned_km', sa.Numeric(8, 2), nullable=True),
        sa.Column('planned_minutes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'trip_stops',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('seq', sa.Integer(), nullable=False),
        sa.Column('type', postgresql.ENUM('PICKUP', 'HUB', 'DELIVERY', name='stop_type', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('PLANNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', name='stop_status', create_type=False), server_default='PLANNED', nullable=False),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.user_id', ondelete='SET NULL'), nullable=True),
        sa.Column('buyer_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('eta', sa.DateTime(timezone=True), nullable=True),
        sa.Column('arrived_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('skip_reason', sa.String(255), nullable=True),
        sa.UniqueConstraint('trip_id', 'seq', name='uq_trip_seq')
    )

    op.create_table(
        'pickup_receipts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('trip_stop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trip_stops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmer_listings.id', ondelete='SET NULL'), nullable=True),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kg_received', sa.Numeric(8, 2), nullable=False),
        sa.Column('grade', postgresql.ENUM('A', 'B', 'REJECT', name='grade', create_type=False), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('farmer_confirmed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('client_event_id', postgresql.UUID(as_uuid=True), unique=True, nullable=True),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'hub_receipts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='SET NULL'), nullable=True),
        sa.Column('hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kg_driver', sa.Numeric(10, 3), nullable=True),
        sa.Column('kg_hub', sa.Numeric(10, 3), nullable=False),
        sa.Column('grade_a_kg', sa.Numeric(10, 3), server_default='0.0', nullable=True),
        sa.Column('grade_b_kg', sa.Numeric(10, 3), server_default='0.0', nullable=True),
        sa.Column('reject_kg', sa.Numeric(10, 3), server_default='0.0', nullable=True),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'location_pings',
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ts', sa.DateTime(timezone=True), primary_key=True),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('location', sa.Text(), nullable=True),
        sa.Column('speed_kmh', sa.Float(), nullable=True),
        sa.Column('heading', sa.Float(), nullable=True),
        sa.Column('accuracy_m', sa.Float(), nullable=True)
    )

    op.create_table(
        'transfer_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('from_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('to_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('requested_kg', sa.Numeric(10, 2), nullable=False),
        sa.Column('sent_kg', sa.Numeric(10, 2), nullable=True),
        sa.Column('received_kg', sa.Numeric(10, 2), nullable=True),
        sa.Column('status', postgresql.ENUM('SUGGESTED', 'REQUESTED', 'APPROVED', 'ASSIGNED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED', 'CANCELLED', name='transfer_status', create_type=False), server_default='SUGGESTED', nullable=False),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='SET NULL'), nullable=True),
        sa.Column('requested_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    # 9. Pricing, Settlements & Platform
    op.create_table(
        'published_prices',
        sa.Column('date', sa.Date(), primary_key=True),
        sa.Column('crop_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('crops.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('low', sa.Numeric(8, 2), nullable=False),
        sa.Column('high', sa.Numeric(8, 2), nullable=False),
        sa.Column('reference', sa.Numeric(8, 2), nullable=False),
        sa.Column('overridden', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('override_reason', sa.String(255), nullable=True),
        sa.Column('published_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'settlements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('settle_date', sa.Date(), nullable=False),
        sa.Column('accepted_kg', sa.Numeric(10, 2), nullable=False),
        sa.Column('gross', sa.BigInteger(), nullable=False),
        sa.Column('commission', sa.BigInteger(), nullable=False),
        sa.Column('logistics_share', sa.BigInteger(), nullable=False),
        sa.Column('net', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(15), server_default='DRAFT', nullable=False),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('farmer_id', 'settle_date', name='uq_farmer_settle_date')
    )

    op.create_table(
        'settings',
        sa.Column('key', sa.String(60), primary_key=True),
        sa.Column('value', sa.JSON(), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    # 10. Stock Current View
    op.execute("""
    CREATE OR REPLACE VIEW hub_stock_current AS
    SELECT hub_id, crop_id, SUM(delta_kg) AS stock_kg
    FROM stock_ledger GROUP BY hub_id, crop_id;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS hub_stock_current;")
    op.drop_table('settings')
    op.drop_table('settlements')
    op.drop_table('published_prices')
    op.drop_table('transfer_requests')
    op.drop_table('location_pings')
    op.drop_table('hub_receipts')
    op.drop_table('pickup_receipts')
    op.drop_table('trip_stops')
    op.drop_table('trips')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('farmer_listings')
    op.drop_table('stock_ledger')
    op.drop_table('hub_stock_status_history')
    op.drop_table('hub_stock_status')
    op.drop_table('farmer_crop_thresholds')
    op.drop_table('crops')
    op.drop_table('hub_staff')
    op.drop_table('drivers')
    op.drop_table('vehicles')
    op.drop_table('buyers')
    op.drop_table('farmers')
    op.drop_table('hubs')
    op.drop_table('users')
