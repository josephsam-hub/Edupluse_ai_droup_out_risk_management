import React, { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, Clock, TrendingUp, Search, Filter,
  Eye, BookOpen, Activity, ChevronDown, RefreshCw, UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import api from '../services/api';
import { Spinner, ErrorBox, RiskBadge, SectionHeader } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

const DEMO_STUDENTS = [
  { student_id: 'STU001', name: 'Aarav Sharma', department: 'CSE', semester: 4, attendance_percentage: 62.5, current_gpa: 5.8, risk_level: 'High', probability: 0.81, last_predicted_at: new Date(Date.now() - 86400000).toISOString(), intervention_count: 2 },
  { student_id: 'STU002', name: 'Priya Nair', department: 'ECE', semester: 3, attendance_percentage: 71.0, current_gpa: 6.4, risk_level: 'Medium', probability: 0.56, last_predicted_at: new Date(Date.now() - 3 * 86400000).toISOString(), intervention_count: 1 },
  { student_id: 'STU003', name: 'Rohan Mehta', department: 'CSE', semester: 5, attendance_percentage: 88.0, current_gpa: 8.2, risk_level: 'Low', probability: 0.18, last_predicted_at: new Date(Date.now() - 86400000).toISOString(), intervention_count: 0 },
  { student_id: 'STU004', name: 'Sneha Reddy', department: 'Mechanical', semester: 2, attendance_percentage: 55.0, current_gpa: 5.1, risk_level: 'High', probability: 0.88, last_predicted_at: new Date(Date.now() - 7 * 86400000).toISOString(), intervention_count: 3 },
  { student_id: 'STU005', name: 'Kiran Patel', department: 'Civil', semester: 6, attendance_percentage: 79.0, current_gpa: 7.0, risk_level: 'Medium', probability: 0.47, last_predicted_at: new Date(Date.now() - 2 * 86400000).toISOString(), intervention_count: 1 },
];

const RISK_COLOR = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 22, color })}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TeacherDashboard({ setCurrentPage, setSelectedStudentId }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/teacher/students');
      setStudents(res.data?.students || res.data || []);
      setIsDemo(false);
    } catch {
      setStudents(DEMO_STUDENTS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const matchRisk = filter === 'All' || s.risk_level === filter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase());
    return matchRisk && matchSearch;
  });

  const highCount = students.filter(s => s.risk_level === 'High').length;
  const medCount = students.filter(s => s.risk_level === 'Medium').length;
  const needFollowup = students.filter(s => !s.last_predicted_at || (Date.now() - new Date(s.last_predicted_at).getTime()) > 7 * 86400000).length;
  const avgAttendance = students.length ? (students.reduce((a, s) => a + (s.attendance_percentage || 0), 0) / students.length).toFixed(1) : 0;

  const deptData = [...new Set(students.map(s => s.department))].map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    return {
      dept: dept.length > 10 ? dept.substring(0, 10) : dept,
      High: deptStudents.filter(s => s.risk_level === 'High').length,
      Medium: deptStudents.filter(s => s.risk_level === 'Medium').length,
      Low: deptStudents.filter(s => s.risk_level === 'Low').length,
    };
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <Spinner size={28} /><span style={{ color: '#64748b', fontWeight: 600 }}>Loading teacher dashboard…</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            👨‍🏫 Teacher Dashboard
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
            Welcome back, {user?.full_name || user?.username} · Your students' risk overview
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {isDemo && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '0.75rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ <strong>Demo Mode:</strong> Showing sample data. Ensure the backend is running and the ML model is trained.
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard icon={<Users />} label="Assigned Students" value={students.length} color="#356AE6" sub="Total in your class" />
        <StatCard icon={<AlertTriangle />} label="High Risk" value={highCount} color="#ef4444" sub="Immediate attention needed" />
        <StatCard icon={<AlertTriangle />} label="Medium Risk" value={medCount} color="#f59e0b" sub="Requires monitoring" />
        <StatCard icon={<Clock />} label="Need Follow-up" value={needFollowup} color="#8b5cf6" sub="No prediction > 7 days" />
        <StatCard icon={<Activity />} label="Avg Attendance" value={`${avgAttendance}%`} color="#14B8A6" sub="Across all students" />
      </div>

      {/* Chart + At-Risk List */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Bar Chart */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9rem' }}>Dept-wise Risk</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="High" fill="#ef4444" stackId="a" />
              <Bar dataKey="Medium" fill="#f59e0b" stackId="a" />
              <Bar dataKey="Low" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9rem' }}>Risk Overview Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'High Risk', count: highCount, pct: students.length ? ((highCount / students.length) * 100).toFixed(0) : 0, color: '#ef4444' },
              { label: 'Medium Risk', count: medCount, pct: students.length ? ((medCount / students.length) * 100).toFixed(0) : 0, color: '#f59e0b' },
              { label: 'Low Risk', count: students.length - highCount - medCount, pct: students.length ? (((students.length - highCount - medCount) / students.length) * 100).toFixed(0) : 0, color: '#10b981' },
            ].map(({ label, count, pct, color }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', textAlign: 'center', border: `2px solid ${color}30` }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pct}% of class</div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: '#e2e8f0' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: 8, fontSize: '0.8125rem', color: '#1d4ed8' }}>
            💡 <strong>{needFollowup}</strong> student{needFollowup !== 1 ? 's' : ''} have not been assessed in the last 7 days. Consider running predictions.
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem', flex: 1 }}>
            Student Risk List
            <span style={{ marginLeft: 8, background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
              {filtered.length} students
            </span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or ID…"
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8125rem', color: '#374151', outline: 'none', width: 200 }}
            />
          </div>

          {/* Risk Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
            {['All', 'High', 'Medium', 'Low'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? (f === 'High' ? '#ef4444' : f === 'Medium' ? '#f59e0b' : f === 'Low' ? '#10b981' : '#356AE6') : '#64748b',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}>{f} {f !== 'All' && <span>({students.filter(s => s.risk_level === f).length})</span>}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Student ID', 'Name', 'Dept', 'Attendance', 'GPA', 'Risk Level', 'Risk %', 'Last Prediction', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.03em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <UserCheck size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div style={{ fontWeight: 600 }}>No students match the current filter</div>
                  </td>
                </tr>
              ) : filtered.map((s, i) => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafbfc'}>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem', fontWeight: 600, color: '#356AE6' }}>{s.student_id}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem', color: '#475569' }}>{s.department}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem' }}>
                    <span style={{ color: (s.attendance_percentage || 0) < 75 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {(s.attendance_percentage || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem' }}>
                    <span style={{ color: (s.current_gpa || 0) < 6 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {(s.current_gpa || 0).toFixed(1)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}><RiskBadge level={s.risk_level || 'Low'} /></td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ height: 6, width: 60, background: '#e2e8f0', borderRadius: 3 }}>
                        <div style={{ height: '100%', borderRadius: 3, background: RISK_COLOR[s.risk_level] || '#94a3b8', width: `${((s.probability || 0) * 100).toFixed(0)}%` }} />
                      </div>
                      <span style={{ fontWeight: 700, color: RISK_COLOR[s.risk_level] || '#475569' }}>
                        {((s.probability || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(s.last_predicted_at)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => { setSelectedStudentId && setSelectedStudentId(s.student_id); setCurrentPage && setCurrentPage('student-profile', s.student_id); }}
                      style={{ background: '#eff6ff', color: '#356AE6', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
