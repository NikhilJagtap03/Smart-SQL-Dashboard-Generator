from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import json
import time
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import pandas as pd
import duckdb
from typing import List, Dict

app = FastAPI(title="Smart SQL Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "../data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Persistent DuckDB file instead of :memory:
db_path = "dashboard.db"
conn = duckdb.connect(database=db_path)

@app.get("/")
async def root():
    return {"message": "Smart SQL Dashboard Backend is Running! 🚀"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, detail="Only CSV files are allowed")
    
    # Very strict table name cleaning
    base_name = file.filename.replace(".csv", "").strip()
    base_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name)  # Remove all special chars
    base_name = base_name.lower()
    table_name = f"{base_name}_{int(time.time())}"
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Drop and create table
        conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        
        conn.execute(f'''
            CREATE TABLE "{table_name}" AS 
            SELECT * FROM read_csv_auto('{file_path}')
        ''')
        
        columns = conn.execute(f'DESCRIBE "{table_name}"').fetchdf()
        row_count = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]

        return {
            "success": True,
            "filename": file.filename,
            "table_name": table_name,
            "columns": columns.to_dict(orient="records"),
            "row_count": row_count
        }
    except Exception as e:
        print("=== UPLOAD ERROR ===")
        print(str(e))
        raise HTTPException(500, detail=f"Failed to process file: {str(e)}")

@app.get("/tables")
async def list_tables():
    try:
        tables = conn.execute("SHOW TABLES").fetchdf()
        return {"tables": tables.to_dict(orient="records")}
    except:
        return {"tables": []}

@app.get("/preview/{table_name}")
async def preview_table(table_name: str, page: int = 1, limit: int = 100):
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get total rows
        total_rows = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        # Get paginated data
        df = conn.execute(
            f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}"
        ).fetchdf()
        
        # Fix NaN values
        df = df.replace({float('nan'): None})
        
        return {
            "table": table_name,
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records"),
            "total_rows": total_rows,
            "current_page": page,
            "total_pages": (total_rows + limit - 1) // limit,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(404, detail=f"Table {table_name} not found: {str(e)}")

# Initialize Ollama
llm = ChatOllama(model="llama3.1", temperature=0.7)

@app.get("/insights/{table_name}")
async def get_insights(table_name: str):
    try:
        # Get schema and sample data
        schema = conn.execute(f"DESCRIBE {table_name}").fetchdf()
        sample_df = conn.execute(f"SELECT * FROM {table_name} LIMIT 15").fetchdf()
        
        # Clean NaN for prompt
        sample_df = sample_df.replace({float('nan'): None})
        
        prompt = f"""
        You are an expert business analyst.
        Analyze the following table and provide clear, actionable business insights.

        Table: {table_name}
        
        Columns:
        {schema.to_string(index=False)}
        
        Sample Rows:
        {sample_df.to_string(index=False)}
        
        Provide the response in this format:
        - Key Observations:
        - Important Trends / Issues:
        - Business Recommendations:
        - Suggested Next Questions:
        """

        response = llm.invoke(prompt)
        
        return {
            "table": table_name,
            "insights": response.content.strip(),
            "success": True
        }
    except Exception as e:
        print("Insights Error:", str(e))   # This will show in terminal
        return {
            "table": table_name,
            "insights": f"Error generating insights: {str(e)}\n\nMake sure Ollama is running.",
            "success": False
        }

# Initialize LLM (make sure it matches your running model)
llm = ChatOllama(model="llama3.1", temperature=0.3)   # Change to phi3 if you're using that

@app.post("/text-to-sql")
async def text_to_sql(request: dict):
    table_name = request.get("table_name")
    user_question = request.get("question")
    
    if not table_name or not user_question:
        raise HTTPException(400, detail="table_name and question are required")
    
    try:
        # Get table schema
        schema = conn.execute(f'DESCRIBE "{table_name}"').fetchdf()
        
        prompt = f"""
        You are an expert SQL analyst.
        Generate a valid SQL query for the following table.

        Table Name: {table_name}
        
        Schema:
        {schema.to_string(index=False)}
        
        User Question: {user_question}
        
        Rules:
        - Return only the SQL query.
        - Use double quotes for table and column names if needed.
        - Do not add any explanation.
        - Make sure the query is correct for DuckDB.
        """

        response = llm.invoke(prompt)
        sql_query = response.content.strip()
        
        # Clean up if LLM adds extra text
        if "```sql" in sql_query:
            sql_query = sql_query.split("```sql")[1].split("```")[0].strip()
        if sql_query.startswith("```"):
            sql_query = sql_query.split("```")[1].strip()

        # Execute the query safely
        try:
            result_df = conn.execute(sql_query).fetchdf()
            result_df = result_df.replace({float('nan'): None})
            
            return {
                "success": True,
                "sql_query": sql_query,
                "data": result_df.to_dict(orient="records"),
                "columns": result_df.columns.tolist(),
                "row_count": len(result_df)
            }
        except Exception as exec_error:
            return {
                "success": False,
                "sql_query": sql_query,
                "error": str(exec_error)
            }
            
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.post("/generate-charts")
async def generate_charts(request: dict):
    table_name = request.get("table_name")
    
    if not table_name:
        raise HTTPException(400, detail="table_name is required")
    
    try:
        schema = conn.execute(f'DESCRIBE "{table_name}"').fetchdf()
        sample = conn.execute(f'SELECT * FROM "{table_name}" LIMIT 10').fetchdf()
        
        prompt = f"""
        You are a data visualization expert.
        Analyze this table and suggest the best 3 charts.

        Table: {table_name}
        Schema:
        {schema.to_string(index=False)}

        Sample Data:
        {sample.to_string(index=False)}

        Return a JSON array with 3 chart suggestions in this exact format:
        [
            {{"type": "bar", "title": "...", "x": "column_name", "y": "column_name", "sql": "SQL query here"}},
            {{"type": "line", "title": "...", "x": "column_name", "y": "column_name", "sql": "SQL query here"}},
            {{"type": "pie", "title": "...", "x": "column_name", "y": "column_name", "sql": "SQL query here"}}
        ]
        
        Only return valid JSON. No extra text.
        """

        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean JSON if needed
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```")[0].strip()
        
        import json
        charts = json.loads(content)
        
        return {
            "success": True,
            "charts": charts,
            "table_name": table_name
        }
    except Exception as e:
        print("Chart Generation Error:", str(e))
        raise HTTPException(500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)