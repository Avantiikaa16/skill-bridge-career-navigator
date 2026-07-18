# Skill-Bridge Career Navigator

## Candidate Profile

Candidate Name: Avantika Ramesh Chapegadikar  
Scenario Chosen: Scenario 2 – Skill-Bridge Career Navigator  
Estimated Time Spent: 5–6 Hours


## 1. Quick Start

This section explains how to set up and run the application locally.

### Prerequisites

Ensure the following tools are installed before running the project:

- Python 3.12 or higher  
- MySQL Server (local installation or cloud instance)  
- Gemini API Key (from Google AI Studio)  
- Node.js and npm for the React frontend  

Before running the backend:

- Initialize the MySQL database using the provided schema.
- Rename the `.env.example` file in the root directory to `.env`.
- Add your Gemini API key and MySQL credentials inside the `.env` file.


## 2. Running the Application

### Start Backend (Root Directory)

Create a virtual environment:

python -m venv venv

Activate the virtual environment.

Windows:

.\venv\Scripts\activate

macOS / Linux:

source venv/bin/activate

Install required dependencies:

pip install -r requirements.txt

Start the FastAPI server:

uvicorn main:app --reload


### Start Frontend

Navigate to the frontend directory:

cd frontend

Install frontend dependencies:

npm install

Run the development server:

npm run dev


## 3. Database Initialization

Before starting the backend, the MySQL schema must be initialized.

Steps:

1. Open MySQL Workbench or a MySQL command-line client.
2. Locate the `schema.sql` file in the root project directory.
3. Execute the SQL script.

This will create:

- the `skillbridge` database
- the `analysis_cache` table used to store AI analysis results.


## 4. Running Automated Tests

Automated tests verify system resilience and response structure.

Run the following command:

pytest test_main.py -v

The test script validates:

- API response structure
- Roadmap schema format
- Handling of edge-case inputs


## 5. AI Disclosure

### Did you use an AI assistant?

Yes. Google Gemini 3 Flash was used as the AI engine for resume and job-role analysis.


### How were the AI suggestions verified?

The generated outputs were verified using two methods:

1. A local **Pytest suite** was implemented to validate that API responses matched the expected JSON structure required by the frontend.
2. The **MySQL Result Grid** was manually inspected to confirm successful data persistence and correct role mapping.


### Example of a suggestion that was rejected

The AI suggested saving **Rule-Based Fallback results** into the database.

This suggestion was rejected to maintain **data purity** within the expert cache.

Instead:

- Only **AI-generated expert data** is stored in MySQL.
- Rule-based fallback results remain **temporary in memory**.

Additionally, the system stores only the **target job role** rather than a full job description.  
This reduces user friction and keeps the analysis focused on the intended career path.


## 6. Tradeoffs and Prioritization

### What was cut to stay within the 4–6 hour limit?

Several features were intentionally deferred to prioritize reliability and system architecture.

1. **Resilience over UI enhancements**

   Development focused on implementing the **Three-Tier Resilience Path**  
   (Live AI -> MySQL Cache -> Rule-Based Fallback) to ensure the system never crashes.

2. **Synthetic text inputs instead of resume parsing**

   A full PDF/DOCX resume parser was intentionally avoided to reduce complexity and maintain compliance with data safety guidelines.

3. **Target role analysis instead of job scraping**

   Instead of scraping live job postings, the system analyzes a **target job role** such as "Cloud Engineer", simplifying the architecture while still demonstrating the skill-gap analysis concept.

4. **Authentication deferred**

   Login and user authentication features were postponed so development time could focus on the **Expert Cache persistence system**.


### What would you build next if you had more time?

Several improvements could extend the platform's functionality.

1. **Role Comparison Engine**

Allow users to compare their current skills against **multiple career paths simultaneously** to identify the most efficient up-skilling strategy.


2. **Live Course Integration**

Integrate learning platforms such as:

- Coursera  
- edX  
- LinkedIn Learning 
- Udemy 

to provide **direct course recommendations** for missing skills.


3. **Progress Tracking and User Profiles**

Introduce authenticated user accounts that allow learners to:

- track completed roadmap milestones
- monitor skill progression
- dynamically update their alignment score.


4. **Professional Development Reports**

Generate downloadable **PDF career development reports** summarizing skill gaps, recommended learning paths, and progress milestones.


5. **Automated Resume Parsing**

Future versions could support **PDF and DOCX resume uploads**, using a parsing pipeline to automatically extract skills, experience, and projects.


### Known Limitations

Although the prototype demonstrates the core concept, several limitations remain.

1. The **Rule-Based Fallback** relies on a static keyword bank.  
   If the role is non-technical, the system defaults to a **40% foundational match score**.

2. The web dashboard is responsive but does not include native mobile features such as push notifications.

3. The current prototype is **stateless** and does not track user progress across sessions.

4. The system currently supports **one target role per analysis request**. Multi-role comparison will be implemented in future versions.

5. In rare cases, the AI may infer or generate a **hallucinated skill** if the resume input is extremely short or ambiguous.

