from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import pandas as pd
import duckdb
from typing import List, Dict

app = FastAPI(title="Smart SQL Dashboard")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "../data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global DuckDB connection
conn = duckdb.connect(database=":memory:")

@app.get("/")
async def root():
    return {"message": "Smart SQL Dashboard Backend is Running! 🚀"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, detail="Only CSV files are allowed")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Load into DuckDB
    table_name = file.filename.replace(".csv", "").replace(" ", "_").lower()
    try:
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{file_path}')")
        
        # Get column info
        columns = conn.execute(f"DESCRIBE {table_name}").fetchdf()
        
        return {
            "success": True,
            "filename": file.filename,
            "table_name": table_name,
            "columns": columns.to_dict(orient="records"),
            "row_count": conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.get("/tables")
async def list_tables():
    tables = conn.execute("SHOW TABLES").fetchdf()
    return {"tables": tables.to_dict(orient="records")}

@app.get("/preview/{table_name}")
async def preview_table(table_name: str, limit: int = 50):
    try:
        df = conn.execute(f"SELECT * FROM {table_name} LIMIT {limit}").fetchdf()
        
        # FIX: Replace NaN values with None so JSON works
        df = df.replace({float('nan'): None})
        
        return {
            "table": table_name,
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(404, detail=f"Table {table_name} not found: {str(e)}")
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)