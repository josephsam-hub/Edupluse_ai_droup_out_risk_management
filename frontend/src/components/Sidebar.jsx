import React from 'react';
import {
  LayoutDashboard, Users, Brain, Upload, Lightbulb,
  BarChart3, Database, FileText, LogOut,
  BrainCircuit, ChevronRight, Bell, Activity,
  GraduationCap, GitCompare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Nav items with role visibility
const NAV_ITEMS = [
  { id: 'dashboard',         label: 'Dashboard',          icon: LayoutDashboard, roles: ['Admin', 'Counselor'] },
  { id: 'teacher-dashboard', label: 'My Students',         icon: GraduationCap,   roles: ['Faculty'] },
  { id: 'students',          label: 'Students',            icon: Users,           roles: ['Admin', 'Faculty', 'Counselor'] },
  { id: 'predict',           label: 'Predict Risk',        icon: Brain,           roles: ['Admin', 'Faculty'] },
  { id: 'batch',             label: 'Batch Prediction',    icon: Upload,          roles: ['Admin'] },
  { id: 'interventions',     label: 'Interventions',       icon: Lightbulb,       roles: ['Admin', 'Counselor'] },
  { id: 'engagement',        label: 'Engagement',          icon: Activity,        roles: ['Admin', 'Faculty', 'Counselor'] },
  { id: 'model',             label: 'Model Performance',   icon: BarChart3,       roles: ['Admin', 'Faculty'] },
  { id: 'model-comparison',  label: 'Model Comparison',    icon: GitCompare,      roles: ['Admin', 'Faculty'] },
  { id: 'dataset',           label: 'Dataset & Training',  icon: Database,        roles: ['Admin'] },
  { id: 'reports',           label: 'Reports',             icon: FileText,        roles: ['Admin', 'Faculty', 'Counselor'] },
  { id: 'notifications',     label: 'Notifications',       icon: Bell,            roles: ['Admin', 'Faculty', 'Counselor'] },
];

const ROLE_BADGE_COLOR = {
  Admin:     '#356AE6',
  Faculty:   '#059669',
  Counselor: '#7c3aed',
};

export default function Sidebar({ currentPage, setCurrentPage, userRole }) {
  const { user, logout } = useAuth();
  const role = userRole || user?.role;
  const allowedItems = NAV_ITEMS.filter(n => n.roles.includes(role));

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #142B4A 0%, #356AE6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BrainCircuit size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#142B4A', lineHeight: 1.2 }}>EduPulse AI</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 500 }}>Dropout Risk System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem 0', overflowY: 'auto' }}>
        {allowedItems.map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#356AE6' : '#475569',
                background: isActive ? '#eff6ff' : 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} style={{ color: '#356AE6' }} />}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '0.625rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              background: ROLE_BADGE_COLOR[user?.role] || '#64748b',
              color: 'white',
              fontSize: '0.6875rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 999
            }}>
              {user?.role}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.5rem 0.75rem', borderRadius: 6, border: 'none',
            background: 'none', cursor: 'pointer', fontSize: '0.8125rem',
            color: '#64748b', fontWeight: 500, transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <LogOut size={14} style={{ color: '#ef4444' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
