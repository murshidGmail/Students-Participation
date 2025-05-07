from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Body, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import pandas as pd
from io import StringIO
import random
import json

# JWT Configuration
SECRET_KEY = "your-secret-key"  # In production, use a secure key from environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Define Models
class Token(BaseModel):
    access_token: str
    token_type: str
    teacher_id: str
    name: str

class TokenData(BaseModel):
    email: str = None

class TeacherBase(BaseModel):
    name: str
    email: str

class TeacherCreate(TeacherBase):
    password: str

class Teacher(TeacherBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True

class StudentBase(BaseModel):
    name: Optional[str] = None
    student_number: str

class Student(StudentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True

class ClassBase(BaseModel):
    name: str

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        orm_mode = True

class Assessment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    class_id: str
    teacher_id: str
    score: int  # 1 for correct, 0 for wrong
    date: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        orm_mode = True

class FileUpload(BaseModel):
    content: str

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_teacher(email: str):
    teacher = await db.teachers.find_one({"email": email})
    if teacher:
        return Teacher(**teacher)

async def authenticate_teacher(email: str, password: str):
    teacher = await get_teacher(email)
    if not teacher:
        return False
    teacher_dict = await db.teachers.find_one({"email": email})
    if not verify_password(password, teacher_dict["password"]):
        return False
    return teacher

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_teacher(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    teacher = await get_teacher(email=token_data.email)
    if teacher is None:
        raise credentials_exception
    return teacher

# Authentication routes
@api_router.post("/register", response_model=Token)
async def register_teacher(teacher: TeacherCreate):
    db_teacher = await db.teachers.find_one({"email": teacher.email})
    if db_teacher:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(teacher.password)
    teacher_data = Teacher(
        id=str(uuid.uuid4()),
        name=teacher.name,
        email=teacher.email,
        created_at=datetime.utcnow()
    )
    
    teacher_dict = teacher_data.dict()
    teacher_dict["password"] = hashed_password
    
    await db.teachers.insert_one(teacher_dict)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": teacher.email}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        teacher_id=teacher_data.id,
        name=teacher_data.name
    )

@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    teacher = await authenticate_teacher(form_data.username, form_data.password)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": teacher.email}, expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        teacher_id=teacher.id,
        name=teacher.name
    )

# Class routes
@api_router.post("/classes", response_model=Class)
async def create_class(class_item: ClassCreate, current_teacher: Teacher = Depends(get_current_teacher)):
    class_data = Class(
        id=str(uuid.uuid4()),
        name=class_item.name,
        teacher_id=current_teacher.id,
        created_at=datetime.utcnow()
    )
    
    await db.classes.insert_one(class_data.dict())
    return class_data

@api_router.get("/classes", response_model=List[Class])
async def get_classes(current_teacher: Teacher = Depends(get_current_teacher)):
    classes = await db.classes.find({"teacher_id": current_teacher.id}).to_list(1000)
    return [Class(**class_item) for class_item in classes]

@api_router.get("/classes/{class_id}", response_model=Class)
async def get_class(class_id: str, current_teacher: Teacher = Depends(get_current_teacher)):
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    return Class(**class_item)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_teacher: Teacher = Depends(get_current_teacher)):
    result = await db.classes.delete_one({"id": class_id, "teacher_id": current_teacher.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Also delete all students in this class
    await db.students.delete_many({"class_id": class_id})
    
    # Delete all assessments for this class
    await db.assessments.delete_many({"class_id": class_id})
    
    return {"message": "Class deleted successfully"}

# Student routes
@api_router.post("/classes/{class_id}/students", response_model=Student)
async def create_student(
    class_id: str, 
    student: StudentBase, 
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Create student
    student_data = Student(
        id=str(uuid.uuid4()),
        name=student.name,
        student_number=student.student_number,
        created_at=datetime.utcnow()
    )
    
    student_dict = student_data.dict()
    student_dict["class_id"] = class_id
    student_dict["teacher_id"] = current_teacher.id
    
    await db.students.insert_one(student_dict)
    return student_data

@api_router.post("/classes/{class_id}/students/upload")
async def upload_students(
    class_id: str,
    file_upload: FileUpload,
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    try:
        # Parse the CSV content
        df = pd.read_csv(StringIO(file_upload.content))
        
        # Insert students
        students_added = 0
        for _, row in df.iterrows():
            student_data = {
                "id": str(uuid.uuid4()),
                "student_number": str(row.get("student_number", "")),
                "name": row.get("name", None),
                "class_id": class_id,
                "teacher_id": current_teacher.id,
                "created_at": datetime.utcnow()
            }
            await db.students.insert_one(student_data)
            students_added += 1
        
        return {"message": f"{students_added} students added successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/classes/{class_id}/students", response_model=List[Student])
async def get_students(
    class_id: str, 
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await db.students.find({"class_id": class_id}).to_list(1000)
    return [Student(**student) for student in students]

@api_router.delete("/classes/{class_id}/students")
async def delete_all_students(
    class_id: str, 
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    result = await db.students.delete_many({"class_id": class_id})
    
    # Delete all assessments for this class
    await db.assessments.delete_many({"class_id": class_id})
    
    return {"message": f"{result.deleted_count} students deleted successfully"}

# Assessment routes
@api_router.post("/classes/{class_id}/assessments", response_model=Assessment)
async def create_assessment(
    class_id: str,
    student_id: str = Body(...),
    score: int = Body(...),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if student exists and belongs to class
    student = await db.students.find_one({"id": student_id, "class_id": class_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create assessment
    assessment = Assessment(
        id=str(uuid.uuid4()),
        student_id=student_id,
        class_id=class_id,
        teacher_id=current_teacher.id,
        score=score,
        date=datetime.utcnow()
    )
    
    await db.assessments.insert_one(assessment.dict())
    return assessment

@api_router.get("/classes/{class_id}/random-student")
async def get_random_student(
    class_id: str,
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get all students in the class
    students = await db.students.find({"class_id": class_id}).to_list(1000)
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
    
    # Get assessments for each student to find those with the least assessments
    student_assessment_counts = {}
    for student in students:
        count = await db.assessments.count_documents({
            "student_id": student["id"],
            "class_id": class_id
        })
        student_assessment_counts[student["id"]] = count
    
    # Find minimum assessment count
    min_assessments = min(student_assessment_counts.values()) if student_assessment_counts else 0
    
    # Find all students with the minimum number of assessments
    eligible_students = [
        student for student in students 
        if student_assessment_counts[student["id"]] == min_assessments
    ]
    
    # If all students have been assessed equally, start a new cycle
    if not eligible_students:
        eligible_students = students
        
    # Select a random student from eligible students
    if eligible_students:
        random_student = random.choice(eligible_students)
        return Student(**random_student)
    else:
        raise HTTPException(status_code=404, detail="No eligible students found")

@api_router.get("/classes/{class_id}/assessments", response_model=List[Dict])
async def get_assessments(
    class_id: str,
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get all assessments for this class
    assessments = await db.assessments.find({"class_id": class_id}).to_list(1000)
    
    # Get all students in this class
    students = await db.students.find({"class_id": class_id}).to_list(1000)
    students_dict = {student["id"]: student for student in students}
    
    # Enrich assessments with student information
    result = []
    for assessment in assessments:
        student = students_dict.get(assessment["student_id"], {})
        result.append({
            **assessment,
            "student_name": student.get("name", ""),
            "student_number": student.get("student_number", "")
        })
    
    return result

@api_router.get("/classes/{class_id}/statistics")
async def get_class_statistics(
    class_id: str,
    current_teacher: Teacher = Depends(get_current_teacher)
):
    # Check if class exists and belongs to teacher
    class_item = await db.classes.find_one({"id": class_id, "teacher_id": current_teacher.id})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get all students in the class
    total_students = await db.students.count_documents({"class_id": class_id})
    
    # Get unique students who have been assessed
    assessed_students = await db.assessments.distinct("student_id", {"class_id": class_id})
    assessed_count = len(assessed_students)
    
    # Get total counts of correct and wrong answers
    correct_count = await db.assessments.count_documents({"class_id": class_id, "score": 1})
    wrong_count = await db.assessments.count_documents({"class_id": class_id, "score": 0})
    
    # Get student-level statistics
    pipeline = [
        {"$match": {"class_id": class_id}},
        {"$group": {
            "_id": "$student_id",
            "correct": {"$sum": {"$cond": [{"$eq": ["$score", 1]}, 1, 0]}},
            "wrong": {"$sum": {"$cond": [{"$eq": ["$score", 0]}, 1, 0]}},
            "total": {"$sum": 1}
        }}
    ]
    
    student_stats = await db.assessments.aggregate(pipeline).to_list(1000)
    
    # Enrich with student information
    students_dict = {}
    students = await db.students.find({"class_id": class_id}).to_list(1000)
    for student in students:
        students_dict[student["id"]] = student
    
    student_details = []
    for stat in student_stats:
        student = students_dict.get(stat["_id"], {})
        student_details.append({
            "student_id": stat["_id"],
            "student_name": student.get("name", ""),
            "student_number": student.get("student_number", ""),
            "correct": stat["correct"],
            "wrong": stat["wrong"],
            "total": stat["total"],
            "correct_percentage": round((stat["correct"] / stat["total"]) * 100 if stat["total"] > 0 else 0, 2)
        })
    
    # Sort by student number
    student_details.sort(key=lambda x: x["student_number"])
    
    return {
        "total_students": total_students,
        "assessed_students": assessed_count,
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "total_assessments": correct_count + wrong_count,
        "student_details": student_details
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
