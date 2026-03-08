# Design Documentation -> Skill-Bridge Career Navigator

## 1. System Design & Architecture

The application is designed using a **Three-Tier Resilience Architecture** to ensure that the platform continues to function even if the external AI service becomes unavailable. This architecture prioritizes reliability, graceful degradation, and a consistent user experience.

### Tier 1: Generative AI Engine (Primary Analysis Layer)

The primary analysis layer uses **Google Gemini-3-Flash** to perform semantic analysis between a user's resume input and the selected target job role.

The AI model evaluates:

- Verified skills extracted from the resume  
- Missing skills based on industry expectations  
- A recommended learning roadmap  
- Mock interview preparation questions  

The AI response is structured as a **JSON object**, allowing the frontend dashboard to render the analysis results dynamically.

---

### Tier 2: Persistence Layer (Expert Cache)

A **MySQL database** acts as a persistence layer that stores successful AI-generated analyses.

Each analysis is saved using a **SHA-256 hash identifier** generated from a normalized combination of:

- Target job role  
- Resume text  

This enables the system to:

- Store previously generated expert analyses for fallback use
- Retrieve cached results when the AI service is unavailable
- Preserve structured analysis data for reliability and consistency  

If the same role–resume pair is analyzed again, the system performs an **UPSERT operation**, ensuring the latest analysis replaces older data when necessary.

---

### Tier 3: Resilience Layer (Rule-Based Fallback)

To guarantee application reliability, the system includes a **rule-based fallback engine**.

If any of the following occurs:

- The Gemini API fails or is unavailable  
- The AI response cannot be parsed correctly  

the system performs the following steps:

1. Attempt to retrieve previously stored results from the **database cache**.
2. If no cached data exists, activate a **local heuristic analysis engine**.

The fallback engine uses a **keyword-based skill detection approach** to identify technical terms in the resume input (for example: Python, SQL, AWS).

If the system cannot confidently classify the role, it returns a default **40% foundational match score** and generates a baseline roadmap focused on:

- System design fundamentals  
- Unit testing practices  
- CI/CD pipelines  

This ensures that the application **never returns an empty result** and always provides actionable guidance.

---

## 2. Technology Stack

The technology stack was selected to balance **rapid prototyping with scalable system design**.

### Frontend

The frontend is built using **React.js**, which provides a responsive and interactive user interface.

The dashboard visualizes:

- Industry alignment score  
- Verified skills  
- Market skill gaps  
- Timed learning roadmap  
- Mock interview preparation questions  

A **basic filtering feature** is included, allowing users to prioritize skill gaps based on market demand.

---

### Backend

The backend is implemented using **FastAPI with Python 3.12**.

FastAPI was selected because it provides:

- High-performance asynchronous request handling  
- Built-in request validation using Pydantic  
- Automatic API documentation generation  

---

### Database

The system uses **MySQL** for persistent storage of analysis results.

The database stores:

- Job hash identifiers  
- Persona type  
- Verified skills  
- Missing skills  
- Learning roadmap steps  
- Match percentage  
- Interview preparation questions  

---

### AI Engine

The application integrates with the **Google Gemini API** for natural language analysis.

The model evaluates the user's resume against industry expectations and generates structured recommendations for skill development and career growth.

The system enforces **strict JSON formatting** to ensure compatibility with the frontend interface.

---

### Testing

Automated tests are implemented using **Pytest**.

The test script verifies:

- API response structure  
- Roadmap schema validation  
- Edge-case handling for invalid inputs  

---

## 3. Future Enhancements

Several enhancements could further improve the platform:

- **Role Comparison Engine:** Allow users to compare their current skills against multiple career paths to determine the most efficient upskilling strategy.

- **Live Course Integration:** Integrate educational platforms such as Coursera, edX, or LinkedIn Learning to provide direct course recommendations for identified skill gaps.

- **Progress Tracking & Authentication:** Add authenticated user accounts to allow learners to track completed roadmap steps and monitor skill progression over time.

- **Professional Development Report:** Generate downloadable PDF reports summarizing user roadmaps, skill gaps, and learning progress that can be shared with mentors or recruiters.

- **Automated Resume Parsing:** Support PDF or DOCX resume uploads with a parsing pipeline that automatically extracts skills, projects, and experience.