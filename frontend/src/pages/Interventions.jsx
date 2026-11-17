import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { interventionsAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge } from '../components/UI';

const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

export default function Interventions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const fetchInterventions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      const res = await interventionsAPI.list(params);
      setItems(res.data);
    } catch (e) {
      setError('Failed to load interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterventions(); }, [statusFilter, priorityFilter]);

  const updateStatus = async (id, status) => {
    try {
      await interventionsAPI.update(id, { status });
      fetchInterventions();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const statusIcon = (s) => ({
    Pending: <Clock size={14} color="#f59e0b" />,
    'In Progress': <AlertCircle size={14} color="#2563eb" />,
    Resolved: <CheckCircle size={14} color="#10b981" />
  })[s] || null;

  const statusColor = (s) => ({
    Pending: { bg: '#fef3c7', color: '#d97706' },
    'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
    Resolved: { bg: '#d1fae5', color: '#059669' }
  })[s] || {};

  const counts = {
    Pending: items.filter(i => i.status === 'Pending').length,
    'In Progress': items.filter(i => i.status === 'In Progress').length,
    Resolved: items.filter(i => i.status === 'Resolved').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <SectionHeader title="🏥 Intervention Management"
          subtitle="Track and manage academic support protocols for at-risk students" />
        <button className="btn-secondary" onClick={fetchInterventions}><RefreshCw size={14} /></button>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Pending', count: counts.Pending, color: '#d97706', bg: '#fef3c7' },
          { label: 'In Progress', count: counts['In Progress'], color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Resolved', count: counts.Resolved, color: '#059669', bg: '#d1fae5' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 8, padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '0.875rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <Filter size={15} color="#64748b" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: 160 }}>
            {PRIORITY_OPTIONS.map(p => <option key={p}>{p === 'All' ? 'All Priorities' : p + ' Priority'}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: 12 }}>
          <Spinner size={24} /><span style={{ color: '#64748b' }}>Loading interventions...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {items.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No interventions found for the selected filters.
            </div>
          ) : items.map((item) => {
            const sc = statusColor(item.status);
            return (
              <div key={item.id} className="card" style={{
                borderLeft: `4px solid ${item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#10b981'}`,
                padding: '1rem 1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{item.title}</span>
                      <RiskBadge level={item.priority} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: 6 }}>{item.description}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>👤 <strong style={{ color: '#374151' }}>{item.student_name}</strong> ({item.student_id})</span>
                      <span>🏛️ {item.department}</span>
                      <span>📋 Assigned to: {item.assigned_to}</span>
                      <span>🗓️ {item.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: sc.bg, color: sc.color, borderRadius: 6,
                      padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap'
                    }}>
                      {statusIcon(item.status)} {item.status}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {item.status !== 'In Progress' && (
                        <button onClick={() => updateStatus(item.id, 'In Progress')}
                          style={{ background: '#dbeafe', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 600 }}>
                          Mark In Progress
                        </button>
                      )}
                      {item.status !== 'Resolved' && (
                        <button onClick={() => updateStatus(item.id, 'Resolved')}
                          style={{ background: '#d1fae5', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                          ✓ Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
