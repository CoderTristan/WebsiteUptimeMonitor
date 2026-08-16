from pydantic import Field, BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str = Field(..., max_length=72)

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class PingLogResponse(BaseModel):
    id: int
    status_code: Optional[int]
    response_time_ms: Optional[int]
    is_up: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class MonitorCreate(BaseModel):
    name: str
    url: HttpUrl

class MonitorResponse(BaseModel):
    id: int
    name: str
    url: str
    is_active: bool
    owner_id: int
    pings: List[PingLogResponse] = []

    class Config:
        from_attributes = True