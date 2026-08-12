def test_register_user(client):
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "message" in data


def test_register_duplicate_user(client):
    # First registration
    client.post(
        "/auth/signup",
        json={"email": "duplicate@example.com", "password": "password123", "full_name": "Dupe"}
    )
    # Second registration should fail
    response = client.post(
        "/auth/signup",
        json={"email": "duplicate@example.com", "password": "password123", "full_name": "Dupe"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client, db_session):
    # Register first
    client.post(
        "/auth/signup",
        json={"email": "login@example.com", "password": "password123", "full_name": "Login User"}
    )
    # Manually verify email
    from app.models.user import User
    user = db_session.query(User).filter(User.email == "login@example.com").first()
    user.email_verified = True
    db_session.commit()
    
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_invalid_password(client, db_session):
    client.post(
        "/auth/signup",
        json={"email": "wrong@example.com", "password": "password123", "full_name": "Wrong"}
    )
    
    from app.models.user import User
    user = db_session.query(User).filter(User.email == "wrong@example.com").first()
    user.email_verified = True
    db_session.commit()
    
    response = client.post(
        "/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]
