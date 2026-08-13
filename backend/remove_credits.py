import sys
from pathlib import Path

# Add the backend directory to pythonpath so app.db works
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.user import User
from app.models.enums import PlanType

def downgrade_to_free(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found!")
            return
        
        user.plan = PlanType.free
        db.commit()
        print(f"Success! Downgraded {email} back to the FREE plan!")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python remove_credits.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    downgrade_to_free(email)
