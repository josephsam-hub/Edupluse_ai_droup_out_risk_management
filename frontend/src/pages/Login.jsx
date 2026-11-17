import React, { useState } from 'react';
import { BrainCircuit, Shield, BarChart3, Users, Lightbulb, Brain, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin', desc: 'Full access to all modules' },
  { username: 'faculty', password: 'faculty123', role: 'Faculty', desc: 'Student management & predictions' },
  { username: 'counselor', password: 'counselor123', role: 'Counselor', desc: 'Interventions & student support' },
];

export default function LoginPage({ onBackToLanding }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter credentials'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Check credentials and ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #7c3aed 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <BrainCircuit size={38} color="white" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem', lineHeight: 1.1 }}>
          EduPulse AI
        </h1>
        <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginBottom: '0.5rem' }}>
          Student Engagement & Dropout Risk Prediction System
        </div>
        <div style={{
          display: 'inline-block', background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
          padding: '4px 16px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic'
        }}>
          "Predict Early. Intervene Smart. Support Every Student."
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: 900, alignItems: 'flex-start' }}>
        {/* Features Panel */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(10px)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.15)', padding: '1.75rem'
        }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem' }}>
            🚀 Platform Features
          </div>
          {[
            { icon: <Brain size={16} color="#60a5fa" />, title: 'ML-Powered Predictions', desc: 'Random Forest + 4 algorithms compared' },
            { icon: <BarChart3 size={16} color="#34d399" />, title: 'Student Analytics Dashboard', desc: 'Real-time risk distribution charts' },
            { icon: <CheckCircle size={16} color="#a78bfa" />, title: 'Explainable AI', desc: 'Feature importances & risk factors' },
            { icon: <Lightbulb size={16} color="#fbbf24" />, title: 'Intervention Engine', desc: 'Automated support recommendations' },
            { icon: <Users size={16} color="#fb7185" />, title: 'Batch Risk Analysis', desc: 'CSV upload & bulk ML inference' },
            { icon: <Shield size={16} color="#38bdf8" />, title: 'Role-Based Access', desc: 'Admin, Faculty, Counselor roles' },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: '0.875rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Login Form */}
        <div style={{ width: 340 }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)'
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Sign In
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Access the EduPulse AI platform
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username" autoComplete="username" />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#dc2626', marginBottom: '1rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem' }}>
                {loading ? 'Authenticating...' : '→ Login to Dashboard'}
              </button>
            </form>

            {/* Demo Accounts */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.625rem', letterSpacing: '0.05em' }}>
                DEMO ACCOUNTS — CLICK TO FILL
              </div>
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.username} onClick={() => fillAccount(acc)}
                  style={{
                    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 6, padding: '0.5rem 0.75rem', cursor: 'pointer',
                    textAlign: 'left', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b' }}>
                      {acc.role}: <code style={{ color: '#2563eb' }}>{acc.username}</code>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{acc.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        EduPulse AI v2.0 · Academic ML Practical Project · Powered by Random Forest + FastAPI + React
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            style={{ display: 'block', margin: '0.75rem auto 0', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '4px 16px', borderRadius: 999, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            ← Back to Home
          </button>
        )}
      </div>
    </div>
  );
}
