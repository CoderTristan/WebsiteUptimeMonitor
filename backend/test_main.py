import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_user_registration():
    response = client.post(
        "/register", 
        json={"username": "testuser", "password": "securepassword"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert "hashed_password" not in response.json()

def test_user_login():
    client.post("/register", json={"username": "loginuser", "password": "mypassword"})
    
    response = client.post(
        "/login", 
        data={"username": "loginuser", "password": "mypassword"}
    )
    
    assert response.status_code == 200
    assert "Successfully logged in" in response.json()["message"]
    
    assert "access_token" in response.cookies