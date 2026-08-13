import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.user import User
from app.models.subscription import Subscription
from app.models.enums import PlanType, SubscriptionStatus

def downgrade_to_free(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found!")
            return

        # Reset the user plan
        user.plan = PlanType.free

        # Also reset the subscription record so /billing/status returns free
        sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if sub:
            sub.plan = PlanType.free
            sub.status = SubscriptionStatus.none
            print(f"Subscription record also reset to Free.")

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
