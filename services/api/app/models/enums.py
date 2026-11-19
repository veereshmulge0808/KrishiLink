import enum


class UserRole(str, enum.Enum):
    BUYER = "buyer"
    FARMER = "farmer"
    DRIVER = "driver"
    HUB_STAFF = "hub_staff"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class HubType(str, enum.Enum):
    MAIN = "main"
    VILLAGE = "village"
    CITY = "city"


class StockStatus(str, enum.Enum):
    OUT = "OUT"
    LOW = "LOW"
    SUFFICIENT = "SUFFICIENT"


class ListingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    INELIGIBLE = "INELIGIBLE"
    ELIGIBLE = "ELIGIBLE"
    SCHEDULED = "SCHEDULED"
    COLLECTED = "COLLECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    PARTIAL = "PARTIAL"
    ASSIGNED = "ASSIGNED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class TripType(str, enum.Enum):
    FIRST_MILE = "FIRST_MILE"
    MIDDLE_MILE = "MIDDLE_MILE"
    LAST_MILE = "LAST_MILE"
    TRANSFER = "TRANSFER"


class TripStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    STARTED = "STARTED"
    AT_HUB = "AT_HUB"
    RETURNED = "RETURNED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    INCIDENT = "INCIDENT"


class StopType(str, enum.Enum):
    PICKUP = "PICKUP"
    HUB = "HUB"
    DELIVERY = "DELIVERY"


class StopStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    EN_ROUTE = "EN_ROUTE"
    ARRIVED = "ARRIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"


class TransferStatus(str, enum.Enum):
    SUGGESTED = "SUGGESTED"
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    RECEIVED = "RECEIVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Grade(str, enum.Enum):
    A = "A"
    B = "B"
    REJECT = "REJECT"


class LedgerReason(str, enum.Enum):
    PICKUP = "PICKUP"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    SALE = "SALE"
    WASTAGE = "WASTAGE"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"


class PaymentDirection(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMode(str, enum.Enum):
    PREPAID = "PREPAID"
    CREDIT = "CREDIT"


class VehicleOwnership(str, enum.Enum):
    OWN = "own"
    RENT = "rent"
