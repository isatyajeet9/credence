import sys
import uuid
import pathlib

# Ensure we can import the app modules
sys.path.append(str(pathlib.Path('.').resolve()))

from sqlalchemy import delete
from app.database import SessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.check import Check
from app.models.match import Match
from app.models.embedding import Embedding
from app.models.subscription import Subscription
from app.models.usage import Usage

def wipe_demo_data(email: str):
    db = SessionLocal()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"User {email} not found.")
        return

    print(f"Found user: {user.full_name} ({user.email})")

    # 1. Delete all matches for this user's checks
    checks = db.query(Check).filter(Check.user_id == user.id).all()
    check_ids = [c.id for c in checks]
    if check_ids:
        deleted_matches = db.execute(delete(Match).where(Match.check_id.in_(check_ids)))
        print(f"Deleted {deleted_matches.rowcount} matches.")
    
    # 2. Delete all checks
    deleted_checks = db.execute(delete(Check).where(Check.user_id == user.id))
    print(f"Deleted {deleted_checks.rowcount} checks.")

    # 3. Delete all embeddings for this user's documents
    documents = db.query(Document).filter(Document.user_id == user.id).all()
    doc_ids = [d.id for d in documents]
    if doc_ids:
        deleted_embeddings = db.execute(delete(Embedding).where(Embedding.document_id.in_(doc_ids)))
        print(f"Deleted {deleted_embeddings.rowcount} embeddings.")

    # 4. Delete all documents
    deleted_docs = db.execute(delete(Document).where(Document.user_id == user.id))
    print(f"Deleted {deleted_docs.rowcount} documents.")

    # 5. Reset Subscription and Plan
    db.execute(delete(Subscription).where(Subscription.user_id == user.id))
    user.plan = "free"
    print("Deleted subscription and reset plan to FREE.")

    # 6. Reset Usage
    db.execute(delete(Usage).where(Usage.user_id == user.id))
    print("Deleted monthly usage limits.")

    db.commit()
    print(f"\nSUCCESS! All history, checks, and Pro status wiped for {email}.")
    print("The dashboard is now 100% clean for the presentation.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_demo.py <email>")
        sys.exit(1)
    
    wipe_demo_data(sys.argv[1])
