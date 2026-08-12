import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop the tables after the test is done
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def app_client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def client(app_client, db_session):
    def override_get_db():
        yield db_session
        
    def override_rate_limit():
        pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    # Override rate limiters to prevent 429 Too Many Requests during tests
    try:
        from app.auth.rate_limit import signup_rate_limit, login_rate_limit, code_guess_rate_limit, email_action_rate_limit
        app.dependency_overrides[signup_rate_limit] = override_rate_limit
        app.dependency_overrides[login_rate_limit] = override_rate_limit
        app.dependency_overrides[code_guess_rate_limit] = override_rate_limit
        app.dependency_overrides[email_action_rate_limit] = override_rate_limit
    except ImportError:
        pass
        
    yield app_client
    app.dependency_overrides.clear()
