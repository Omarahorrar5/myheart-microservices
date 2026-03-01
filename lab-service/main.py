from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import motor.motor_asyncio
from bson import ObjectId
import os

app = FastAPI(title="Lab Report Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://lab-db:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.labdb

class LabReport(BaseModel):
    patient_id: int
    doctor_name: str
    test_type: str
    test_name: str
    result: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = "pending"
    notes: Optional[str] = None

def serialize(doc) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@app.get("/api/lab-reports")
async def get_all():
    reports = []
    async for doc in db.reports.find():
        reports.append(serialize(doc))
    return reports

@app.get("/api/lab-reports/patient/{patient_id}")
async def get_by_patient(patient_id: int):
    reports = []
    async for doc in db.reports.find({"patient_id": patient_id}):
        reports.append(serialize(doc))
    return reports

@app.get("/api/lab-reports/{id}")
async def get_by_id(id: str):
    doc = await db.reports.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(404, "Not found")
    return serialize(doc)

@app.post("/api/lab-reports", status_code=201)
async def create(r: LabReport):
    data = r.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    result = await db.reports.insert_one(data)
    created = await db.reports.find_one({"_id": result.inserted_id})
    return serialize(created)

@app.put("/api/lab-reports/{id}")
async def update(id: str, r: LabReport):
    await db.reports.update_one({"_id": ObjectId(id)}, {"$set": r.dict()})
    doc = await db.reports.find_one({"_id": ObjectId(id)})
    return serialize(doc)

@app.delete("/api/lab-reports/{id}", status_code=204)
async def delete(id: str):
    await db.reports.delete_one({"_id": ObjectId(id)})
