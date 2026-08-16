from fastapi import FastAPI, Depends, HTTPException, status, Response, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import httpx
import time
from datetime import datetime

from database import engine, Base, get_db
from models import User, Monitor, PingLog
from schemas import UserCreate, UserResponse, MonitorCreate, MonitorResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Uptime Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Uptime Monitor API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1800
    )
    return {"message": "Successfully logged in"}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}


@app.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/monitors", response_model=MonitorResponse)
def create_monitor(monitor: MonitorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_monitor = Monitor(
        name=monitor.name,
        url=str(monitor.url),
        owner_id=current_user.id
    )
    db.add(new_monitor)
    db.commit()
    db.refresh(new_monitor)
    return new_monitor


@app.get("/monitors", response_model=list[MonitorResponse])
def get_monitors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    monitors = db.query(Monitor).filter(Monitor.owner_id == current_user.id).all()
    return monitors


async def perform_ping(monitor_id: int, url: str, db: Session):
    start_time = time.time()
    is_up = False
    status_code = None
    response_time = None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            status_code = response.status_code
            is_up = response.is_success
    except httpx.RequestError:
        pass
    finally:
        end_time = time.time()
        if status_code:
            response_time = int((end_time - start_time) * 1000)

        ping_log = PingLog(
            monitor_id=monitor_id,
            status_code=status_code,
            response_time_ms=response_time,
            is_up=is_up,
            timestamp=datetime.utcnow()
        )
        db.add(ping_log)
        db.commit()


@app.post("/monitors/{monitor_id}/ping")
async def ping_monitor(
    monitor_id: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    monitor = db.query(Monitor).filter(Monitor.id == monitor_id, Monitor.owner_id == current_user.id).first()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    background_tasks.add_task(perform_ping, monitor.id, monitor.url, db)
    return {"message": f"Ping initiated for {monitor.url}"}