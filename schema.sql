-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS skillbridge;
USE skillbridge;

-- 2. Create the Analysis Cache Table
CREATE TABLE IF NOT EXISTS analysis_cache (
    job_hash VARCHAR(64) NOT NULL, -- Unique identifier for the normalized role + resume pair
    job_role VARCHAR(255),         -- Human-readable role name
    persona VARCHAR(50),           -- User type (e.g., Recent Graduate)
    verified_skills TEXT,          -- Parsed resume skills (JSON format)
    missing_skills TEXT,           -- Gaps identified by AI (JSON format)
    roadmap_json TEXT,             -- Dynamic learning steps (JSON format)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tracking date
    match_percentage INT DEFAULT 0, -- Industry alignment score
    interview_prep_json TEXT,      -- Technical prep questions (JSON format)
    PRIMARY KEY (job_hash)         -- Ensures unique entries per role
);