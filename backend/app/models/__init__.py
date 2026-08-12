# importing everything here so alembic autogenerate picks up all tables
from app.models.check import Check
from app.models.document import Document
from app.models.embedding import Embedding
from app.models.match import Match
from app.models.otp_code import OtpCode
from app.models.subscription import Subscription
from app.models.usage import Usage
from app.models.user import User

__all__ = ["User", "Document", "Check", "Match", "Embedding", "Usage", "Subscription", "OtpCode"]
