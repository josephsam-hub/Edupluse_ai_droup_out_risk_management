import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { studentsAPI, reportAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge, MetricBar } from '../components/UI';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function StudentProfile({ studentId, setCurrentPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudent = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentsAPI.get(studentId);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (studentId) fetchStudent(); }, [studentId]);

  const downloadReport = async () => {
    try {
      const res = await reportAPI.getReport(studentId);
      const content = JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${studentId}.json`;
      a.click();
    } catch (e) {
      alert('Report generation failed');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
      <Spinner size={28} /><span style={{ color: '#64748b' }}>Loading student profile...</span>
    </div>
  );

  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const { student_info: info, current_prediction: pred, history, interventions } = data;

  const historyChartData = history.slice(0, 8).reverse().map((h, i) => ({
    name: `Pred ${i + 1}`,
    probability: Math.round(h.probability * 100),
    date: h.timestamp?.slice(0, 10)
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => setCurrentPage('students')}>
          <ArrowLeft size={14} /> Back to Students
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{info.name}</h1>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            {info.student_id} · {info.department} · Semester {info.semester}
          </div>
        </div>
        <button className="btn-secondary" onClick={fetchStudent}><RefreshCw size={14} /></button>
        <button className="btn-primary" onClick={downloadReport}><FileText size={14} /> Download Report</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Details */}
        <div>
          {/* Academic */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>📚 Academic Performance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <MetricBar label="Current GPA" value={info.current_gpa} max={10} color="#2563eb" />
              <MetricBar label="Previous GPA" value={info.previous_gpa} max={10} color="#7c3aed" />
              <MetricBar label="Marks %" value={info.marks_percentage} color="#0891b2" />
              <MetricBar label="Exam Performance" value={info.exam_performance_score} color="#059669" />
              <MetricBar label="Internal Assessment" value={info.internal_assessment_score} color="#8b5cf6" />
              <MetricBar label="Assignment Completion" value={info.assignment_completion_rate} color="#f59e0b" />
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#fee2e2', color: '#dc2626', borderRadius: 6,
                padding: '3px 10px', fontSize: '0.8rem', fontWeight: 700
              }}>
                {info.failed_subjects} Failed Subject{info.failed_subjects !== 1 ? 's' : ''}
              </span>
              <span style={{
                background: pred.engineered_metrics.academic_trend >= 0 ? '#d1fae5' : '#fee2e2',
                color: pred.engineered_metrics.academic_trend >= 0 ? '#059669' : '#dc2626',
                borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                {pred.engineered_metrics.academic_trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                GPA Trend: {pred.engineered_metrics.academic_trend > 0 ? '+' : ''}{pred.engineered_metrics.academic_trend}
              </span>
            </div>
          </div>

          {/* Attendance & Engagement */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>📅 Attendance & Engagement</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <MetricBar label="Attendance %" value={info.attendance_percentage}
                color={info.attendance_percentage < 75 ? '#ef4444' : '#10b981'} />
              <MetricBar label="Assignment Consistency" value={info.assignment_consistency} color="#f59e0b" />
              <MetricBar label="LMS Logins/Week" value={info.lms_logins_per_week} max={30} color="#2563eb" />
              <MetricBar label="Study Hours/Week" value={info.study_hours_per_week} max={40} color="#7c3aed" />
              <MetricBar label="Engagement Score" value={pred.engineered_metrics.engagement_score} max={30} color="#0891b2" />
              <MetricBar label="Online Activity Hrs" value={info.online_activity_hours} max={30} color="#059669" />
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem', color: '#64748b' }}>
                Absent Days: <strong>{info.absent_days}</strong>
              </span>
              <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem', color: '#64748b' }}>
                Late Arrivals: <strong>{info.late_arrivals}</strong>
              </span>
            </div>
          </div>

          {/* Prediction History Chart */}
          {historyChartData.length > 1 && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>📈 Dropout Risk Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Dropout Risk']} />
                  <Line type="monotone" dataKey="probability" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Prediction History Table */}
          <div className="card">
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.875rem', fontSize: '0.9375rem' }}>🕐 Prediction History</div>
            {history.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No prediction history found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date/Time', 'Model', 'Risk Level', 'Probability'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 8).map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{h.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#374151' }}>{h.model_used}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><RiskBadge level={h.risk_level} /></td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#1e293b' }}>{h.probability_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Risk Summary */}
        <div>
          {/* Risk Card */}
          <div style={{
            background: pred.risk_level === 'High' ? '#fef2f2' : pred.risk_level === 'Medium' ? '#fffbeb' : '#f0fdf4',
            border: `2px solid ${pred.risk_level === 'High' ? '#fecaca' : pred.risk_level === 'Medium' ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>CURRENT RISK STATUS</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: pred.risk_level === 'High' ? '#ef4444' : pred.risk_level === 'Medium' ? '#f59e0b' : '#10b981', lineHeight: 1, marginBottom: 4 }}>
              {Math.round(pred.dropout_probability * 100)}%
            </div>
            <div style={{ marginBottom: '0.75rem' }}><RiskBadge level={pred.risk_level} /></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Model: {pred.model_used}</div>
          </div>

          {/* Support Info */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>🤝 Support Profile</div>
            {[
              { label: 'Scholarship', val: info.scholarship ? '✅ Active' : '❌ None', ok: info.scholarship },
              { label: 'Financial Difficulty', val: info.financial_difficulty ? '⚠️ Yes' : '✓ No', ok: !info.financial_difficulty },
              { label: 'Mentoring', val: info.mentoring_available ? '✅ Available' : '❌ None', ok: info.mentoring_available },
              { label: 'Parent Support', val: `${info.parent_support_level}/5`, ok: info.parent_support_level >= 3 },
              { label: 'Distance', val: `${info.distance_from_institute} km`, ok: true },
            ].map(({ label, val, ok }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: ok ? '#059669' : '#dc2626' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Risk Factors */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>⚠️ Risk Factors</div>
            {pred.risk_factors.map((f, i) => (
              <div key={i} style={{ fontSize: '0.7875rem', color: '#374151', padding: '3px 0', display: 'flex', gap: 6 }}>
                <span style={{ fontSize: '0.65rem', marginTop: 2 }}>🔴</span>{f}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>💡 Recommended Actions</div>
            {pred.recommendations.map((r, i) => (
              <div key={i} style={{ fontSize: '0.7875rem', color: '#374151', padding: '4px 0', display: 'flex', gap: 6, borderBottom: i < pred.recommendations.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                <span style={{ color: '#2563eb', fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>{r}
              </div>
            ))}
          </div>

          {/* Interventions */}
          {interventions.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>🏥 Interventions</div>
              {interventions.map(iv => (
                <div key={iv.id} style={{
                  borderLeft: `3px solid ${iv.status === 'Resolved' ? '#10b981' : iv.priority === 'High' ? '#ef4444' : '#f59e0b'}`,
                  paddingLeft: 10, marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>{iv.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{iv.status} · {iv.assigned_to}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
