import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { predictAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge } from '../components/UI';

const DEPARTMENTS = ['Computer Science', 'Electronics & Comm', 'Mechanical Eng', 'Civil Eng', 'Business Admin', 'Data Science'];

const defaultForm = {
  name: '', department: 'Computer Science', semester: 4, age: 20,
  previous_gpa: 7.0, current_gpa: 7.0, marks_percentage: 70.0,
  failed_subjects: 0, assignment_completion_rate: 80.0,
  internal_assessment_score: 75.0, exam_performance_score: 75.0,
  attendance_percentage: 80.0, absent_days: 5, late_arrivals: 2,
  lms_logins_per_week: 10, study_hours_per_week: 15,
  assignment_consistency: 80.0, classroom_participation: 6, online_activity_hours: 12.0,
  scholarship: 0, financial_difficulty: 0, mentoring_available: 1,
  parent_support_level: 4, distance_from_institute: 10.0,
};

function FormField({ label, name, type = 'number', min, max, step = 1, options, value, onChange, hint }) {
  return (
    <div>
      <label>{label} {hint && <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' }}>({hint})</span>}</label>
      {options ? (
        <select name={name} value={value} onChange={onChange}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} min={min} max={max} step={step} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function Section({ title, icon, children, open, toggle }) {
  return (
    <div className="form-section">
      <button
        type="button"
        className="form-section-title"
        onClick={toggle}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', justifyContent: 'space-between' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
        {children}
      </div>}
    </div>
  );
}

function ProbabilityRing({ probability, riskLevel }) {
  const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
  const color = colors[riskLevel] || '#64748b';
  const pct = Math.round(probability * 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>Risk Score</div>
      </div>
    </div>
  );
}

export default function PredictRisk() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState({ academic: true, attendance: true, engagement: false, support: false });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  const validate = () => {
    if (form.current_gpa < 0 || form.current_gpa > 10) return 'GPA must be between 0 and 10';
    if (form.attendance_percentage < 0 || form.attendance_percentage > 100) return 'Attendance must be 0-100%';
    if (form.assignment_completion_rate < 0 || form.assignment_completion_rate > 100) return 'Assignment rate must be 0-100%';
    return '';
  };

  const handlePredict = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await predictAPI.predict(form);
      setResult(res.data);
      setTimeout(() => document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Ensure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const riskConfig = {
    High: { bg: '#fef2f2', border: '#fecaca', accent: '#ef4444', icon: '🔴', label: 'HIGH DROPOUT RISK' },
    Medium: { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', icon: '🟡', label: 'MEDIUM DROPOUT RISK' },
    Low: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', icon: '🟢', label: 'LOW DROPOUT RISK' },
  };
  const cfg = riskConfig[result?.risk_level] || {};

  return (
    <div>
      <SectionHeader title="🧠 Predict Student Dropout Risk"
        subtitle="Enter student academic, attendance, and engagement data to get a live ML-powered risk assessment" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div>
          {/* Student Info */}
          <div className="form-section">
            <div className="form-section-title">👤 Student Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
              <div>
                <label>Student Name</label>
                <input type="text" name="name" placeholder="Enter name (optional)" value={form.name} onChange={handleChange} />
              </div>
              <FormField label="Department" name="department" options={DEPARTMENTS} value={form.department} onChange={handleChange} />
              <FormField label="Semester" name="semester" min={1} max={8} value={form.semester} onChange={handleChange} />
              <FormField label="Age" name="age" min={16} max={40} value={form.age} onChange={handleChange} />
            </div>
          </div>

          <Section title="📚 Academic Performance" icon="📚" open={sections.academic} toggle={() => toggleSection('academic')}>
            <FormField label="Previous GPA" name="previous_gpa" min={0} max={10} step={0.1} hint="0–10" value={form.previous_gpa} onChange={handleChange} />
            <FormField label="Current GPA" name="current_gpa" min={0} max={10} step={0.1} hint="0–10" value={form.current_gpa} onChange={handleChange} />
            <FormField label="Marks Percentage" name="marks_percentage" min={0} max={100} step={0.1} hint="0–100" value={form.marks_percentage} onChange={handleChange} />
            <FormField label="Failed Subjects" name="failed_subjects" min={0} max={10} value={form.failed_subjects} onChange={handleChange} />
            <FormField label="Assignment Completion %" name="assignment_completion_rate" min={0} max={100} step={0.1} value={form.assignment_completion_rate} onChange={handleChange} />
            <FormField label="Internal Assessment Score" name="internal_assessment_score" min={0} max={100} step={0.1} value={form.internal_assessment_score} onChange={handleChange} />
            <FormField label="Exam Performance Score" name="exam_performance_score" min={0} max={100} step={0.1} value={form.exam_performance_score} onChange={handleChange} />
          </Section>

          <Section title="📅 Attendance" icon="📅" open={sections.attendance} toggle={() => toggleSection('attendance')}>
            <FormField label="Attendance %" name="attendance_percentage" min={0} max={100} step={0.1} hint="0–100" value={form.attendance_percentage} onChange={handleChange} />
            <FormField label="Absent Days" name="absent_days" min={0} max={100} value={form.absent_days} onChange={handleChange} />
            <FormField label="Late Arrivals" name="late_arrivals" min={0} max={50} value={form.late_arrivals} onChange={handleChange} />
          </Section>

          <Section title="💡 Engagement & Learning" icon="💡" open={sections.engagement} toggle={() => toggleSection('engagement')}>
            <FormField label="LMS Logins / Week" name="lms_logins_per_week" min={0} max={50} value={form.lms_logins_per_week} onChange={handleChange} />
            <FormField label="Study Hours / Week" name="study_hours_per_week" min={0} max={80} value={form.study_hours_per_week} onChange={handleChange} />
            <FormField label="Assignment Consistency %" name="assignment_consistency" min={0} max={100} step={0.1} value={form.assignment_consistency} onChange={handleChange} />
            <FormField label="Classroom Participation" name="classroom_participation" min={1} max={10} hint="1–10" value={form.classroom_participation} onChange={handleChange} />
            <FormField label="Online Activity Hours" name="online_activity_hours" min={0} max={60} step={0.5} value={form.online_activity_hours} onChange={handleChange} />
          </Section>

          <Section title="🤝 Support Factors" icon="🤝" open={sections.support} toggle={() => toggleSection('support')}>
            <div>
              <label>Scholarship</label>
              <select name="scholarship" value={form.scholarship} onChange={handleChange}>
                <option value={0}>No Scholarship</option>
                <option value={1}>Has Scholarship</option>
              </select>
            </div>
            <div>
              <label>Financial Difficulty</label>
              <select name="financial_difficulty" value={form.financial_difficulty} onChange={handleChange}>
                <option value={0}>No Financial Difficulty</option>
                <option value={1}>Experiencing Difficulty</option>
              </select>
            </div>
            <div>
              <label>Mentoring Available</label>
              <select name="mentoring_available" value={form.mentoring_available} onChange={handleChange}>
                <option value={1}>Has Mentor</option>
                <option value={0}>No Mentor</option>
              </select>
            </div>
            <FormField label="Parent Support Level" name="parent_support_level" min={1} max={5} hint="1–5" value={form.parent_support_level} onChange={handleChange} />
            <FormField label="Distance from Institute (km)" name="distance_from_institute" min={0} max={200} step={0.5} value={form.distance_from_institute} onChange={handleChange} />
          </Section>

          {error && <ErrorBox message={error} />}

          <button className="btn-primary" onClick={handlePredict} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}>
            {loading ? <><Spinner size={18} /> Analyzing with ML Model...</> : <><Brain size={18} /> Predict Dropout Risk</>}
          </button>
        </div>

        {/* Result Panel */}
        <div id="result-panel">
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <Brain size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Awaiting Prediction</div>
              <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>Fill in the form and click<br />"Predict Dropout Risk"</div>
            </div>
          )}

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <Spinner size={40} />
              <div style={{ marginTop: '1rem', fontWeight: 600, color: '#64748b' }}>Running ML inference...</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Random Forest model processing</div>
            </div>
          )}

          {result && (
            <div>
              {/* Main Risk Card */}
              <div style={{
                background: cfg.bg, border: `2px solid ${cfg.border}`,
                borderRadius: 12, padding: '1.5rem', marginBottom: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: cfg.accent, letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  STUDENT RISK ASSESSMENT
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <ProbabilityRing probability={result.dropout_probability} riskLevel={result.risk_level} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cfg.accent, marginBottom: 4 }}>
                  {cfg.icon} {cfg.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', textAlign: 'left' }}>
                  {[
                    ['Model', result.model_used],
                    ['Confidence', `${Math.round(result.confidence * 100)}%`],
                    ['Att. Risk', result.engineered_metrics.attendance_risk === 1.0 ? '⚠️ Critical' : '✓ OK'],
                    ['GPA Trend', result.engineered_metrics.academic_trend > 0 ? '📈 Improving' : '📉 Declining'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'white', borderRadius: 6, padding: '0.5rem' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>{k}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  ⚠️ Risk Factors Identified
                </div>
                {result.risk_factors.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '0.4rem 0', borderBottom: i < result.risk_factors.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <span style={{ fontSize: '0.7rem', marginTop: 2 }}>🔴</span>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="card">
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  💡 Recommended Interventions
                </div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '0.4rem 0', borderBottom: i < result.recommendations.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem', minWidth: 18 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{r}</span>
                  </div>
                ))}

                <div style={{ marginTop: '0.875rem', padding: '0.625rem', background: '#f0fdf4', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                    ℹ️ ML predicts the risk. Recommendations are rule-based interventions layered on top.
                  </div>
                </div>
              </div>

              {/* Feature Impacts */}
              <div className="card" style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  🔍 Explainable AI — Feature Contributions
                </div>
                {result.feature_impacts.map((f, i) => (
                  <div key={i} style={{ marginBottom: '0.625rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>{f.feature}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: f.direction === 'Negative' ? '#ef4444' : '#10b981' }}>
                        {f.impact} Impact
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999, transition: 'width 0.5s ease',
                        width: `${Math.round(f.score * 100)}%`,
                        background: f.direction === 'Negative' ? '#ef4444' : '#10b981'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
