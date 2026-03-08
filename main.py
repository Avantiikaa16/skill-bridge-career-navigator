from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
import hashlib
import pymysql
from pymysql.cursors import DictCursor

# 1. LOAD CONFIGURATION
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "skillbridge"),
    "cursorclass": DictCursor,
}

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)


def get_db():
    return pymysql.connect(**DB_CONFIG)


app = FastAPI(title="Skill-Bridge Strategic Career API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Fine for local demo / prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    persona: str
    resume: str
    job_description: str

    @field_validator("persona", "resume", "job_description")
    @classmethod
    def not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Field cannot be empty.")
        return value.strip()


def extract_json_object(raw_text: str) -> dict:
    """
    Attempts to safely extract a JSON object from model output.
    Handles fenced code blocks and extra text around JSON.
    """
    cleaned = raw_text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or start >= end:
        raise ValueError("No valid JSON object found in AI response.")

    json_str = cleaned[start:end + 1]
    return json.loads(json_str)


def save_analysis_to_cache(job_hash: str, request: AnalysisRequest, result: dict) -> None:
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO analysis_cache
                (job_hash, job_role, persona, verified_skills, missing_skills, roadmap_json, match_percentage, interview_prep_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    job_role=%s,
                    persona=%s,
                    verified_skills=%s,
                    missing_skills=%s,
                    roadmap_json=%s,
                    match_percentage=%s,
                    interview_prep_json=%s
            """

            verified_skills = json.dumps(result.get("verified_skills", []))
            missing_skills = json.dumps(result.get("missing_skills", []))
            roadmap_json = json.dumps(result.get("roadmap", []))
            interview_prep_json = json.dumps(result.get("interview_prep", []))
            match_percentage = int(result.get("match_percentage", 0))

            cursor.execute(
                sql,
                (
                    job_hash,
                    request.job_description,
                    request.persona,
                    verified_skills,
                    missing_skills,
                    roadmap_json,
                    match_percentage,
                    interview_prep_json,
                    request.job_description,
                    request.persona,
                    verified_skills,
                    missing_skills,
                    roadmap_json,
                    match_percentage,
                    interview_prep_json,
                ),
            )
        conn.commit()
    finally:
        conn.close()


def fetch_analysis_from_cache(job_hash: str):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM analysis_cache WHERE job_hash = %s", (job_hash,))
            return cursor.fetchone()
    finally:
        conn.close()


def normalize_result(result: dict, method_label: str) -> dict:
    """
    Ensures consistent response structure for frontend safety.
    """
    return {
        "match_percentage": int(result.get("match_percentage", 0)),
        "verified_skills": result.get("verified_skills", []),
        "missing_skills": result.get("missing_skills", []),
        "roadmap": result.get("roadmap", []),
        "interview_prep": result.get("interview_prep", []),
        "market_sources": result.get("market_sources", []),
        "method": method_label,
    }


@app.post("/api/analyze")
async def analyze_skills(request: AnalysisRequest):
    # Unique cache key based on normalized target role + resume
    clean_job = request.job_description.lower().strip()
    clean_resume = request.resume.lower().strip()
    combined_input = f"{clean_job}::{clean_resume}"
    job_hash = hashlib.sha256(combined_input.encode()).hexdigest()

    # 1. TRY LIVE AI
    try:
        if not API_KEY:
            raise RuntimeError("Missing GEMINI_API_KEY")

        model = genai.GenerativeModel(MODEL_NAME)

        prompt = f"""
You are a Global Talent Analyst.

Persona: {request.persona}
Target Role/Industry: {request.job_description}
Resume: {request.resume}

Compare this profile against broad industry-standard expectations for the target role.
Return ONLY valid JSON with this exact structure:

{{
  "match_percentage": 0,
  "verified_skills": ["skill1", "skill2"],
  "missing_skills": [
    {{"skill": "Name", "market_demand": "High/Med/Low", "salary_impact": "+X%"}}
  ],
  "roadmap": [
    {{"step": "Actionable step", "time": "X days/weeks", "type": "Project/Course/Certification"}}
  ],
  "interview_prep": ["Question 1", "Question 2", "Question 3"],
  "market_sources": ["LinkedIn", "Indeed", "Glassdoor Hiring Lab"]
}}

Rules:
- Output ONLY JSON
- No markdown
- No explanation text
- Keep match_percentage between 0 and 100
- Provide at least 3 missing_skills if possible
- Provide at least 2 roadmap steps if possible
- Provide exactly 3 interview questions
"""

        response = model.generate_content(prompt)
        raw_text = response.text
        parsed_result = extract_json_object(raw_text)
        normalized_result = normalize_result(parsed_result, "Live AI Analysis")

        # Save only expert/AI data to DB
        try:
            save_analysis_to_cache(job_hash, request, normalized_result)
        except Exception as db_err:
            print(f"Database Persistence Error: {db_err}")

        return normalized_result

    except Exception as ai_err:
        print(f"AI Error: {ai_err}. Checking cache...")

    # 2. TRY DB CACHE
    try:
        cached = fetch_analysis_from_cache(job_hash)
        if cached:
            return {
                "match_percentage": int(cached.get("match_percentage", 0)),
                "verified_skills": json.loads(cached.get("verified_skills", "[]")),
                "missing_skills": json.loads(cached.get("missing_skills", "[]")),
                "roadmap": json.loads(cached.get("roadmap_json", "[]")),
                "interview_prep": json.loads(cached.get("interview_prep_json", "[]")),
                "market_sources": ["Cached Expert Analysis"],
                "method": "Database-Cached Fallback (Expert Data)",
            }
    except Exception as db_err:
        print(f"Database Fetch Error: {db_err}")

    # 3. FINAL RULE-BASED FALLBACK
    return rule_based_fallback(request)


def rule_based_fallback(request: AnalysisRequest) -> dict:
    resume_text = request.resume.lower()
    job_text = request.job_description.lower()

    tech_keywords = [
        "python", "java", "sql", "aws", "docker", "react",
        "security", "linux", "cloud", "api", "data",
        "terraform", "kubernetes", "git", "testing"
    ]
    found_skills = [k.capitalize() for k in tech_keywords if k in resume_text]

    if not found_skills:
        found_skills = ["Resume skills not clearly identified"]

    if any(k in job_text or k in resume_text for k in ["data", "ml", "ai", "analyst"]):
        match_score = 44
        top_skill = "Large Language Model (LLM) Fine-tuning"
        roadmap_step = "Build a RAG-based data pipeline"
    elif any(k in job_text or k in resume_text for k in ["security", "cyber", "soc", "network"]):
        match_score = 46
        top_skill = "Zero Trust Architecture & IAM"
        roadmap_step = "Perform a simulated penetration test"
    elif any(k in job_text or k in resume_text for k in ["cloud", "devops", "aws", "azure"]):
        match_score = 48
        top_skill = "Infrastructure as Code (Terraform)"
        roadmap_step = "Deploy a multi-region cloud architecture"
    elif any(k in job_text or k in resume_text for k in ["backend", "python", "java", "api"]):
        match_score = 45
        top_skill = "Microservices Design Patterns"
        roadmap_step = "Implement a REST API with logging and validation"
    else:
        match_score = 40
        top_skill = "System Design"
        roadmap_step = "Write a comprehensive technical design doc"

    return {
        "match_percentage": match_score,
        "verified_skills": found_skills,
        "missing_skills": [
            {"skill": top_skill, "market_demand": "High", "salary_impact": "+15%"},
            {"skill": "Unit Testing", "market_demand": "High", "salary_impact": "+10%"},
            {"skill": "CI/CD Pipelines", "market_demand": "Medium", "salary_impact": "+8%"},
        ],
        "roadmap": [
            {"step": roadmap_step, "time": "1 week", "type": "Project"},
            {"step": f"Study core concepts for {request.job_description}", "time": "3-5 days", "type": "Course"},
        ],
        "interview_prep": [
            f"What skills are most important for a {request.job_description} role?",
            "Explain a technical challenge you solved in a past project.",
            "How would you learn a missing skill quickly under deadline pressure?",
        ],
        "market_sources": ["Rule-Based Heuristics"],
        "method": "Rule-Based Fallback (Active)",
    }


@app.get("/health")
def health():
    return {"status": "online"}