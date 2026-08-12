import sys
from pathlib import Path

# Add the backend directory to pythonpath so app.db works
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.user import User
from app.models.enums import PlanType

def upgrade_to_pro(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found!")
            return
        
        user.plan = PlanType.pro
        db.commit()
        print(f"Success! Upgraded {email} to the PRO plan!")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python add_credits.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    upgrade_to_pro(email)
