import json
from typing import Optional, Tuple, Union, Any
from sqlalchemy.types import TypeDecorator, UserDefinedType, String, Text
from sqlalchemy.dialects.postgresql import dialect as postgresql_dialect


class PostGISGeography(UserDefinedType):
    """Native PostgreSQL PostGIS Geography type."""
    def __init__(self, srid: int = 4326, geometry_type: str = "POINT"):
        self.srid = srid
        self.geometry_type = geometry_type

    def get_col_spec(self, **kw):
        return f"geography({self.geometry_type}, {self.srid})"


class GeoPoint(TypeDecorator):
    """
    Cross-database Geography Point type.
    Stores native PostGIS geography(Point, 4326) in PostgreSQL.
    Stores WKT or JSON string in SQLite / fallback databases.
    Python representation: tuple of (latitude, longitude) or dict.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PostGISGeography(4326, "POINT"))
        return dialect.type_descriptor(String(100))

    def process_bind_param(self, value: Any, dialect) -> Optional[str]:
        if value is None:
            return None
        # Handle (lat, lng) tuple/list
        if isinstance(value, (tuple, list)) and len(value) == 2:
            lat, lng = value
            if dialect.name == "postgresql":
                return f"SRID=4326;POINT({lng} {lat})"
            return f"POINT({lng} {lat})"
        # Handle dict {"lat": ..., "lng": ...}
        if isinstance(value, dict) and "lat" in value and "lng" in value:
            lat, lng = value["lat"], value["lng"]
            if dialect.name == "postgresql":
                return f"SRID=4326;POINT({lng} {lat})"
            return f"POINT({lng} {lat})"
        # Handle WKT string directly
        if isinstance(value, str):
            if dialect.name == "postgresql" and not value.startswith("SRID="):
                return f"SRID=4326;{value}"
            return value
        return str(value)

    def process_result_value(self, value: Any, dialect) -> Optional[dict]:
        if value is None:
            return None
        # If string like POINT(lng lat) or SRID=4326;POINT(lng lat)
        if isinstance(value, str):
            clean = value.split(";")[-1].replace("POINT(", "").replace(")", "").strip()
            parts = clean.split()
            if len(parts) == 2:
                try:
                    lng, lat = float(parts[0]), float(parts[1])
                    return {"lat": lat, "lng": lng}
                except ValueError:
                    pass
        return {"raw": value}
