import pytest
import uuid

def get_auth_token(client, db_session):
    # Helper to register and login a user, returning the token
    email = f"tester_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "full_name": "Tester"}
    )
    assert res.status_code == 201, res.text
    
    from app.models.user import User
    user = db_session.query(User).filter(User.email == email).first()
    if user:
        user.email_verified = True
        db_session.commit()
        
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_original_text(client, db_session):
    token = get_auth_token(client, db_session)
    # A completely original piece of text (hopefully)
    original_text = "The quick brown fox jumps over the lazy dog in a completely novel and unprecedented way, defying all known laws of physics and grammar." * 5
    
    response = client.post(
        "/check/text",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": original_text}
    )
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["originality_score"] > 90.0
    assert len(data["result_json"]["matches"]) == 0


def test_reference_corpus_copy(client, db_session):
    token = get_auth_token(client, db_session)
    # This text is directly from the reference corpus (e.g. Photosynthesis)
    # We'll use a snippet that is known to exist in the corpus based on the analysis.
    copied_text = "Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities."
    
    response = client.post(
        "/check/text",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": copied_text}
    )
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["originality_score"] < 20.0
    assert len(data["result_json"]["matches"]) > 0
    assert data["result_json"]["matches"][0]["source_type"] == "reference_corpus"


def test_self_plagiarism(client, db_session):
    token = get_auth_token(client, db_session)
    text = "This is a completely unique sentence designed specifically to test the self plagiarism feature of this application. It needs to be reasonably long to be embedded." * 2
    
    # First submission
    response1 = client.post(
        "/check/text",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": text}
    )
    assert response1.status_code == 201, response1.text
    data1 = response1.json()
    assert data1["originality_score"] > 90.0
    
    # Second submission (should trigger self-plagiarism)
    response2 = client.post(
        "/check/text",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": text}
    )
    assert response2.status_code == 201, response2.text
    data2 = response2.json()
    assert data2["originality_score"] < 20.0
    assert len(data2["result_json"]["matches"]) > 0
    assert data2["result_json"]["matches"][0]["source_type"] == "own_submission"
    assert "Pasted text" in data2["result_json"]["matches"][0]["source_reference"]
