import React, { useState } from 'react';
import { Search, FileText, Download, Eye } from 'lucide-react';
import { studentsAPI, reportAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge } from '../components/UI';

export default function Reports({ setCurrentPage, setSelectedStudentId }) {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [generating, setGenerating] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await studentsAPI.list({ search, sort_by: 'probability_desc' });
      setStudents(res.data);
    } catch (e) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (studentId) => {
    setGenerating(studentId);
    try {
      const res = await reportAPI.getReport(studentId);
      const report = res.data;
      const content = JSON.stringify(report, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edupulse_report_${studentId}.json`;
      a.click();
    } catch (e) {
      alert('Report download failed');
    } finally {
      setGenerating('');
    }
  };

  return (
    <div>
      <SectionHeader title="📋 Reports"
        subtitle="Search students and generate individual dropout risk assessment reports" />

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Search Students for Report</div>
        <div style={{ display: 'flex', gap: '0.875rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? <Spinner size={14} /> : <Search size={14} />} Search
          </button>
        </div>
        {error && <div style={{ marginTop: '0.75rem' }}><ErrorBox message={error} /></div>}
      </div>

      <div style={{ marginBottom: '1.25rem', padding: '1.25rem', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>📄 What's Included in Each Report?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.375rem', fontSize: '0.8125rem', color: '#1d4ed8' }}>
          {[
            '✓ Student personal & enrollment info',
            '✓ Full academic performance metrics',
            '✓ Attendance & engagement data',
            '✓ ML dropout probability score',
            '✓ Risk classification (High/Medium/Low)',
            '✓ Top identified risk factors',
            '✓ Personalized intervention recommendations',
            '✓ Engineered feature values',
            '✓ Model used & prediction timestamp',
          ].map((item, i) => <div key={i}>{item}</div>)}
        </div>
      </div>

      {searched && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
            {students.length} student(s) found
          </div>
          {students.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No students found. Try a different search term.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Student ID', 'Name', 'Department', 'GPA', 'Attendance', 'Risk Level', 'Probability', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{s.student_id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{s.department}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{s.current_gpa}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: s.attendance_percentage < 75 ? '#dc2626' : '#059669' }}>
                      {s.attendance_percentage}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}><RiskBadge level={s.risk_level} /></td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{Math.round((s.probability || 0) * 100)}%</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { setSelectedStudentId(s.student_id); setCurrentPage('student-profile'); }}
                          style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => downloadReport(s.student_id)}
                          disabled={generating === s.student_id}
                          style={{ background: '#f0fdf4', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                          {generating === s.student_id ? <Spinner size={12} /> : <Download size={13} />}
                          {generating === s.student_id ? 'Generating...' : 'Report'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
