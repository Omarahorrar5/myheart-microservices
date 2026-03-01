from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import motor.motor_asyncio
from bson import ObjectId
import os

app = FastAPI(title="Prescription Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://prescription-db:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.prescriptiondb

class Prescription(BaseModel):
    patient_id: int
    doctor_name: str
    medication: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None
    status: Optional[str] = "active"

def serialize(doc) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@app.get("/api/prescriptions")
async def get_all():
    prescriptions = []
    async for doc in db.prescriptions.find():
        prescriptions.append(serialize(doc))
    return prescriptions

@app.get("/api/prescriptions/patient/{patient_id}")
async def get_by_patient(patient_id: int):
    prescriptions = []
    async for doc in db.prescriptions.find({"patient_id": patient_id}):
        prescriptions.append(serialize(doc))
    return prescriptions

@app.get("/api/prescriptions/{id}")
async def get_by_id(id: str):
    doc = await db.prescriptions.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(doc)

@app.post("/api/prescriptions", status_code=201)
async def create(p: Prescription):
    data = p.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    result = await db.prescriptions.insert_one(data)
    created = await db.prescriptions.find_one({"_id": result.inserted_id})
    return serialize(created)

@app.put("/api/prescriptions/{id}")
async def update(id: str, p: Prescription):
    await db.prescriptions.update_one({"_id": ObjectId(id)}, {"$set": p.dict()})
    doc = await db.prescriptions.find_one({"_id": ObjectId(id)})
    return serialize(doc)

@app.delete("/api/prescriptions/{id}", status_code=204)
async def delete(id: str):
    await db.prescriptions.delete_one({"_id": ObjectId(id)})
