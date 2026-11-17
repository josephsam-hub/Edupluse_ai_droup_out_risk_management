import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Database, Download } from 'lucide-react';
import { modelAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox } from '../components/UI';

const FEATURE_DESCRIPTIONS = {
  previous_gpa: 'Prior semester GPA score (0–10)',
  current_gpa: 'Current semester GPA score (0–10)',
  marks_percentage: 'Overall marks percentage (0–100%)',
  failed_subjects: 'Number of currently failed/pending subjects',
  attendance_percentage: 'Overall attendance percentage (0–100%)',
  lms_logins_per_week: 'Frequency of Learning Management System access',
  study_hours_per_week: 'Self-reported study hours per week',
  assignment_completion_rate: 'Percentage of assignments submitted',
  financial_difficulty: 'Binary flag: facing financial hardship',
  scholarship: 'Binary flag: has active scholarship',
  academic_trend: 'ENGINEERED: current_gpa - previous_gpa',
  engagement_score: 'ENGINEERED: composite engagement index',
  attendance_risk: 'ENGINEERED: binary attendance risk flag',
  academic_risk_index: 'ENGINEERED: composite academic risk score',
};

export default function DatasetTraining() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [trainMsg, setTrainMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await modelAPI.getPerformance();
      setData(res.data);
    } catch (e) {
      setError('Failed to load dataset info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTrain = async () => {
    setTraining(true);
    setTrainMsg('');
    setError('');
    try {
      const res = await modelAPI.train();
      setTrainMsg(`✅ Retraining complete! Best model: ${res.data.best_model_name}`);
      fetchData();
    } catch (e) {
      setError('Training failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setTraining(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
      <Spinner size={28} /><span style={{ color: '#64748b' }}>Loading dataset information...</span>
    </div>
  );

  const stats = data?.dataset_stats || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <SectionHeader title="🗄️ Dataset & Training"
          subtitle="Synthetic educational dataset overview, class distribution, and model retraining controls" />
        <button className="btn-primary" onClick={handleTrain} disabled={training}
          style={{ flexShrink: 0 }}>
          {training ? <><Spinner size={14} /> Training...</> : <><Play size={14} /> Train Model</>}
        </button>
      </div>

      {trainMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.25rem', color: '#16a34a', fontWeight: 600 }}>
          {trainMsg}
        </div>
      )}
      {error && <div style={{ marginBottom: '1.25rem' }}><ErrorBox message={error} /></div>}

      {/* Demo banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)',
        border: '1px solid #fde68a', borderRadius: 10, padding: '1rem 1.5rem',
        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span style={{ fontSize: '1.5rem' }}>🎓</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Demo Dataset — For Academic Demonstration</div>
          <div style={{ fontSize: '0.8125rem', color: '#78350f' }}>
            This application uses a <strong>synthetic educational dataset</strong> generated with realistic statistical patterns
            (attendance–GPA correlations, financial factors, engagement trends).
            The dataset closely mirrors real student retention research findings.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Dataset Info */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
            <Database size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#2563eb' }} />
            Dataset Overview
          </div>
          {[
            ['Dataset Name', 'Synthetic Student Dropout Dataset'],
            ['Source', 'Algorithmically Generated (Academic Demo)'],
            ['Total Records', stats.total_samples || '—'],
            ['Training Records', stats.train_samples || '—'],
            ['Test Records', stats.test_samples || '—'],
            ['Split Ratio', '80% Train / 20% Test (Stratified)'],
            ['Total Features', stats.features_count || '—'],
            ['Engineered Features', '5 (derived composite metrics)'],
            ['Target Variable', 'dropout_risk (0 = No Risk, 1 = Risk)'],
            ['Missing Values', stats.missing_values ?? 0],
            ['Duplicates', stats.duplicates ?? 0],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8125rem' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#1e293b', maxWidth: '55%', textAlign: 'right' }}>{String(v)}</span>
            </div>
          ))}
        </div>

        {/* Class Distribution */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>📊 Target Variable Distribution</div>
          {stats.class_distribution && (
            <>
              {[
                { label: 'Low/No Dropout Risk (class 0)', count: stats.class_distribution['Low Risk (0)'], color: '#10b981', bg: '#d1fae5' },
                { label: 'At-Risk Dropout (class 1)', count: stats.class_distribution['High Risk (1)'], color: '#ef4444', bg: '#fee2e2' },
              ].map(({ label, count, color, bg }) => {
                const total = (stats.class_distribution['Low Risk (0)'] || 0) + (stats.class_distribution['High Risk (1)'] || 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
                      <span style={{ fontWeight: 700, color }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 12, background: '#f1f5f9', borderRadius: 999 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚖️ Class Imbalance Strategy</div>
                <div style={{ fontSize: '0.7875rem', color: '#78350f' }}>
                  <code>class_weight="balanced"</code> is applied to all classifiers where supported.
                  This assigns higher penalty to the minority dropout class, preventing model bias.
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.875rem' }}>🤖 Models Trained</div>
            {Object.keys(data?.results || {}).map(name => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                borderBottom: '1px solid #f9fafb', fontSize: '0.8125rem'
              }}>
                {name === data?.best_model_name ? '🏆' : '🔹'}
                <span style={{ fontWeight: name === data?.best_model_name ? 700 : 400, color: '#374151' }}>{name}</span>
                {name === data?.best_model_name && (
                  <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 999, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>BEST</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="card">
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>🔢 Input Features</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.5rem' }}>
          {Object.entries(FEATURE_DESCRIPTIONS).map(([feat, desc]) => (
            <div key={feat} style={{
              display: 'flex', gap: 8, padding: '0.5rem 0.75rem',
              background: feat.startsWith('academic_') || feat === 'attendance_risk' || feat === 'engagement_score' || feat === 'submission_consistency_rate'
                ? '#eff6ff' : '#fafafa',
              borderRadius: 6, border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>{feat}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.875rem', fontSize: '0.8rem', color: '#64748b', padding: '0.625rem', background: '#eff6ff', borderRadius: 6 }}>
          ℹ️ <strong>Blue highlighted features</strong> are engineered derived metrics computed during preprocessing.
        </div>
      </div>
    </div>
  );
}
