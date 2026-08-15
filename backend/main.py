from fastapi import FastAPI

app = FastAPI(title="Uptime Monitor API")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Uptime Monitor API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}