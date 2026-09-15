from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "work_schedule/database.db"

def init_db():
    """Creates the database file and tables if they do not exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
  
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL
        )
    """)
    

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
        )
    """)    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", ("Hayme", "Password"))
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", ("Camille", "Ganda"))

        print("🚀 Database successfully seeded with custom accounts!")
        
    conn.commit()
    conn.close()


init_db()


class LoginModel(BaseModel):
    username: str
    password: str

class SubjectModel(BaseModel):
    name: str
    code: str

class TaskModel(BaseModel):
    title: str
    subject_id: int

class TaskStatusUpdate(BaseModel):
    status: str


@app.post("/login")
def login(data: LoginModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (data.username, data.password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return {"message": "Success", "token": f"mock-token-for-{data.username}"}
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")


@app.get("/subjects")
def get_subjects():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, code FROM subjects")
    rows = cursor.fetchall()
    conn.close()
   
    return [{"id": row[0], "name": row[1], "code": row[2]} for row in rows]


@app.post("/subjects")
def add_subject(data: SubjectModel):
   
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
   
    cursor.execute("INSERT INTO subjects (name, code) VALUES (?, ?)", (data.name, data.code))
    new_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return {"id": new_id, "name": data.name, "code": data.code}




@app.delete("/subjects/{sub_id}")
def delete_subject(sub_id: int):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
  
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("DELETE FROM subjects WHERE id = ?", (sub_id,))
    
    conn.commit()
    conn.close()
    return {"message": "Subject and its tasks deleted successfully"}


@app.get("/subjects/{sub_id}/tasks")
def get_tasks_for_subject(sub_id: int):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject_id, title, status FROM tasks WHERE subject_id = ?", (sub_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [{"id": row[0], "subject_id": row[1], "title": row[2], "status": row[3]} for row in rows]


@app.post("/tasks")
def add_task(data: TaskModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (subject_id, title, status) VALUES (?, ?, 'pending')", (data.subject_id, data.title))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": new_id, "subject_id": data.subject_id, "title": data.title, "status": "pending"}


@app.patch("/tasks/{task_id}")
def update_task_status(task_id: int, data: TaskStatusUpdate):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (data.status, task_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
        
    conn.commit()
    conn.close()
    return {"message": "Status updated"}
