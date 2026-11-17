import React from 'react';

export function RiskBadge({ level }) {
  const cfg = {
    High: { bg: '#fee2e2', color: '#dc2626', label: 'HIGH RISK' },
    Medium: { bg: '#fef3c7', color: '#d97706', label: 'MEDIUM RISK' },
    Low: { bg: '#d1fae5', color: '#059669', label: 'LOW RISK' },
  };
  const { bg, color, label } = cfg[level] || cfg.Low;
  return (
    <span style={{
      background: bg, color, padding: '3px 10px',
      borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em'
    }}>
      {label}
    </span>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {React.cloneElement(icon, { size: 20, color })}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
      padding: '0.875rem 1.25rem', color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8
    }}>
      ⚠️ {message}
    </div>
  );
}

export function InfoBox({ message }) {
  return (
    <div style={{
      background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
      padding: '0.875rem 1.25rem', color: '#2563eb', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8
    }}>
      ℹ️ {message}
    </div>
  );
}

export function MetricBar({ label, value, max = 100, color = '#2563eb' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{typeof value === 'number' ? value.toFixed(1) + (max === 100 ? '%' : '') : value}</span>
      </div>
      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 999, transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  );
}
