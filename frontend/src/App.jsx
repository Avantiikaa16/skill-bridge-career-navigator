import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [persona, setPersona] = useState('Recent Graduate');
  const [resume, setResume] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gapFilter, setGapFilter] = useState('All');

  const loadDemo = () => {
    setResume('B.S. in Computer Science. Skills: Python, Java, SQL, React. Eager to learn Cloud.');
    setJobDesc('Junior Cloud Engineer');
    setPersona('Recent Graduate');
    setError('');
    setResult(null);
    setGapFilter('All');
  };

  const analyze = async () => {
    setError('');
    setResult(null);

    if (!jobDesc.trim() || !resume.trim()) {
      setError('Please enter both the target role and your resume/skills before generating the roadmap.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/analyze`, {
        persona,
        resume,
        job_description: jobDesc,
      });
      setResult(res.data);
      setGapFilter('All');
    } catch (err) {
      const backendMessage =
        err?.response?.data?.detail ||
        'Unable to analyze right now. Please ensure the FastAPI backend is running and try again.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const methodLabelMap = {
    'Live AI Analysis': 'Live AI Analysis',
    'Database-Cached Fallback (Expert Data)': 'Expert Cache Fallback',
    'Rule-Based Fallback (Active)': 'Rule-Based Fallback',
  };

  const normalizeDemand = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'med') return 'medium';
    return v;
  };

  const displayMethod = result?.method ? methodLabelMap[result.method] || result.method : '';

  const verifiedSkills = result?.verified_skills || [];
  const missingSkills = result?.missing_skills || [];
  const roadmap = result?.roadmap || [];
  const interviewPrep = result?.interview_prep || [];

  const filteredMissingSkills =
    gapFilter === 'All'
      ? missingSkills
      : missingSkills.filter(
          (item) => normalizeDemand(item.market_demand) === gapFilter.toLowerCase()
        );

    const pageWrapper = {
    backgroundColor: '#000',   // keep full black background
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',  // centers horizontally
    alignItems: 'center',      // centers vertically
    padding: '40px 20px'
  };

    const mainCard = {
    width: '100%',
    maxWidth: '900px',
    backgroundColor: '#161616',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    border: '1px solid #2a2a2a',
    margin: 'auto'
  };

  const inputField = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #333',
    color: '#fff',
    marginBottom: '15px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#aaa',
    fontWeight: 'bold',
    marginBottom: '6px',
  };

  const sectionCard = {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '12px',
    boxSizing: 'border-box',
  };

  const isStrongMatch = (result?.match_percentage || 0) > 70;

  return (
    <div style={pageWrapper}>
      <div style={mainCard}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0' }}>🚀 Skill-Bridge</h1>
          <p style={{ color: '#888', marginTop: '8px' }}>
            Market Intelligence & Career Strategic Dashboard
          </p>
          <button
            onClick={loadDemo}
            style={{
              marginTop: '10px',
              color: '#fbbf24',
              background: 'none',
              border: '1px solid #fbbf24',
              borderRadius: '20px',
              cursor: 'pointer',
              padding: '6px 16px',
            }}
          >
            Load Demo Data
          </button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Target Role / Industry:</label>
          <input
            style={inputField}
            placeholder="e.g. Cloud Engineer"
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />

          <label style={labelStyle}>Select Persona:</label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            style={inputField}
          >
            <option>Recent Graduate</option>
            <option>Career Switcher</option>
            <option>Senior Professional</option>
          </select>

          <label style={labelStyle}>Your Resume / Skills:</label>
          <textarea
            rows="6"
            style={inputField}
            placeholder="Paste your resume summary, projects, and technical skills here..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />

          {error && (
            <div
              style={{
                backgroundColor: '#2d1a1a',
                border: '1px solid #7f1d1d',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={analyze}
            disabled={loading}
            style={{
              padding: '16px',
              background: loading ? '#1d4ed8' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? 'Scanning Market Requirements...' : 'Generate Strategic Roadmap'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: isStrongMatch ? '#10b981' : '#f59e0b', marginBottom: '10px' }}>
                {result.match_percentage}% Industry Alignment
              </h2>
              <div
                style={{
                  height: '12px',
                  width: '100%',
                  backgroundColor: '#333',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    width: `${result.match_percentage}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 1.2s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  ...sectionCard,
                  backgroundColor: '#1e293b',
                }}
              >
                <h4 style={{ color: '#10b981', marginTop: 0 }}>✓ Your Skills</h4>
                {verifiedSkills.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', color: '#ccc', marginBottom: 0 }}>
                    {verifiedSkills.map((skill, index) => (
                      <li key={`${skill}-${index}`}>{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#aaa', marginBottom: 0 }}>No verified skills available.</p>
                )}
              </div>

              <div
                style={{
                  ...sectionCard,
                  backgroundColor: '#2d1a1a',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '15px',
                  }}
                >
                  <h4 style={{ color: '#ef4444', margin: 0 }}>⚠ Market Gaps</h4>

                  <select
                    value={gapFilter}
                    onChange={(e) => setGapFilter(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#111',
                      border: '1px solid #444',
                      color: '#fff',
                    }}
                  >
                    <option>All</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                {filteredMissingSkills.length > 0 ? (
                  filteredMissingSkills.map((skillItem, index) => (
                    <div
                      key={`${skillItem.skill || 'gap'}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '10px',
                        fontSize: '0.95rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: '#fff' }}>{skillItem.skill}</span>
                      <span
                        style={{
                          backgroundColor: '#3b82f6',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {skillItem.market_demand} ({skillItem.salary_impact})
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#aaa', marginBottom: 0 }}>
                    No market gaps found for the selected filter.
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: '30px',
                backgroundColor: '#1e1e1e',
                padding: '25px',
                borderRadius: '12px',
                borderLeft: '4px solid #3b82f6',
              }}
            >
              <h3 style={{ color: '#60a5fa', marginTop: 0 }}>🗺️ Timed Learning Roadmap</h3>
              {roadmap.length > 0 ? (
                roadmap.map((item, index) => (
                  <div
                    key={`${item.step || 'roadmap'}-${index}`}
                    style={{
                      marginBottom: '15px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #333',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.step}</div>
                    <small style={{ color: '#94a3b8' }}>
                      ⏳ {item.time} | 🛠️ {item.type}
                    </small>
                  </div>
                ))
              ) : (
                <p style={{ color: '#aaa', marginBottom: 0 }}>No roadmap available.</p>
              )}
            </div>

            <div
              style={{
                marginTop: '30px',
                backgroundColor: '#111',
                padding: '25px',
                borderRadius: '12px',
                border: '1px solid #f59e0b',
              }}
            >
              <h3 style={{ color: '#f59e0b', marginTop: 0 }}>🎤 Mock Interview Prep</h3>
              {interviewPrep.length > 0 ? (
                <ul style={{ color: '#ccc', fontStyle: 'italic', paddingLeft: '20px', marginBottom: 0 }}>
                  {interviewPrep.map((question, index) => (
                    <li key={`${question}-${index}`} style={{ marginBottom: '10px' }}>
                      "{question}"
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#aaa', marginBottom: 0 }}>No interview questions available.</p>
              )}
            </div>

            <div
              style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: '#777',
              }}
            >
              Analysis Method: {displayMethod}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;