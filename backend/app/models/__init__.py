"""
SQLAlchemy models — Base imports.
All models must be imported here so Alembic can detect them.
"""
from app.core.database import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.version import Version  # noqa: F401
from app.models.intervention import Intervention  # noqa: F401
from app.models.shared_artifact import SharedArtifact  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
