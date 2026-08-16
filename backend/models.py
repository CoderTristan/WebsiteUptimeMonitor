from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    monitors = relationship("Monitor", back_populates="owner", cascade="all, delete-orphan")

class Monitor(Base):
    __tablename__ = "monitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="monitors")
    pings = relationship("PingLog", back_populates="monitor", cascade="all, delete-orphan")

class PingLog(Base):
    __tablename__ = "ping_logs"

    id = Column(Integer, primary_key=True, index=True)
    monitor_id = Column(Integer, ForeignKey("monitors.id"))
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    is_up = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    monitor = relationship("Monitor", back_populates="pings")