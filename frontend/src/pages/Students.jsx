import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Brain, Trash2, UserPlus, RefreshCw } from 'lucide-react';
import { studentsAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge } from '../components/UI';

const DEPARTMENTS = ['All', 'Computer Science', 'Electronics & Comm', 'Mechanical Eng', 'Civil Eng', 'Business Admin', 'Data Science'];
const RISK_LEVELS = ['All', 'High', 'Medium', 'Low'];

export default function Students({ setCurrentPage, setSelectedStudentId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('probability_desc');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort_by: sortBy };
      if (search) params.search = search;
      if (riskFilter !== 'All') params.risk_level = riskFilter;
      if (deptFilter !== 'All') params.department = deptFilter;
      const res = await studentsAPI.list(params);
      setStudents(res.data);
    } catch (e) {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [search, riskFilter, deptFilter, sortBy]);

  const handleView = (id) => {
    setSelectedStudentId(id);
    setCurrentPage('student-profile');
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete student ${id}?`)) return;
    try {
      await studentsAPI.delete(id);
      fetchStudents();
    } catch (e) {
      alert('Failed to delete student');
    }
  };

  const riskCounts = {
    High: students.filter(s => s.risk_level === 'High').length,
    Medium: students.filter(s => s.risk_level === 'Medium').length,
    Low: students.filter(s => s.risk_level === 'Low').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <SectionHeader title="👥 Student Management"
          subtitle="Search, filter and monitor all enrolled students with live ML risk assessments" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={fetchStudents}><RefreshCw size={14} /></button>
          <button className="btn-primary" onClick={() => setCurrentPage('predict')}>
            <UserPlus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Summary Counts */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', count: students.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'High Risk', count: riskCounts.High, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Medium Risk', count: riskCounts.Medium, color: '#d97706', bg: '#fef3c7' },
          { label: 'Low Risk', count: riskCounts.Low, color: '#059669', bg: '#d1fae5' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{
            background: bg, borderRadius: 8, padding: '0.5rem 1rem',
            border: `1px solid ${color}30`
          }}>
            <div style={{ fontSize: '0.6875rem', color, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name or ID..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }} />
          </div>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ width: 150 }}>
            {RISK_LEVELS.map(r => <option key={r}>{r === 'All' ? 'All Risk Levels' : r + ' Risk'}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: 180 }}>
            {DEPARTMENTS.map(d => <option key={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 170 }}>
            <option value="probability_desc">Sort: Highest Risk</option>
            <option value="probability_asc">Sort: Lowest Risk</option>
            <option value="gpa_asc">Sort: Lowest GPA</option>
            <option value="attendance_asc">Sort: Lowest Attendance</option>
          </select>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: 12 }}>
          <Spinner size={24} /><span style={{ color: '#64748b' }}>Loading students...</span>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Student ID', 'Name', 'Department', 'Sem', 'GPA', 'Attendance', 'Failed', 'Risk Level', 'Probability', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>No students found.</td></tr>
                ) : students.map((s) => (
                  <tr key={s.student_id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: s.risk_level === 'High' ? '#fff5f5' : 'white',
                    transition: 'background 0.1s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = s.risk_level === 'High' ? '#fff5f5' : 'white'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{s.student_id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{s.department}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', textAlign: 'center' }}>{s.semester}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: s.current_gpa < 5.5 ? '#dc2626' : '#1e293b' }}>{s.current_gpa}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: s.attendance_percentage < 75 ? '#dc2626' : '#059669' }}>
                      {s.attendance_percentage}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: s.failed_subjects > 0 ? '#dc2626' : '#64748b', fontWeight: s.failed_subjects > 0 ? 700 : 400 }}>
                      {s.failed_subjects}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}><RiskBadge level={s.risk_level} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 999 }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${Math.round((s.probability || 0) * 100)}%`,
                            background: s.risk_level === 'High' ? '#ef4444' : s.risk_level === 'Medium' ? '#f59e0b' : '#10b981'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>
                          {Math.round((s.probability || 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleView(s.student_id)} title="View Profile"
                          style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#2563eb' }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDelete(s.student_id)} title="Delete"
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
