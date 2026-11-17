import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Award, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from 'recharts';
import { modelAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox } from '../components/UI';

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [trainMsg, setTrainMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await modelAPI.getPerformance();
      setData(res.data);
    } catch (e) {
      setError('Failed to load model performance data');
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
      setTrainMsg(`✅ Training complete! Best model: ${res.data.best_model_name} (F1: ${res.data.results[res.data.best_model_name]?.f1_score})`);
      fetchData();
    } catch (e) {
      setError('Training failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setTraining(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
      <Spinner size={28} /><span style={{ color: '#64748b' }}>Loading ML performance metrics...</span>
    </div>
  );

  if (error && !data) return <ErrorBox message={error} />;

  const results = data?.results || {};
  const bestModel = data?.best_model_name || '';
  const featureImportances = data?.feature_importances || [];
  const datasetStats = data?.dataset_stats || {};
  const tuningInfo = data?.tuning_info || {};

  // Chart data
  const comparisonData = Object.entries(results).map(([name, m]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '..' : name,
    Accuracy: Math.round(m.accuracy * 100),
    Precision: Math.round(m.precision * 100),
    Recall: Math.round(m.recall * 100),
    F1: Math.round(m.f1_score * 100),
    AUC: Math.round(m.roc_auc * 100),
    isBest: name === bestModel,
  }));

  const featTop = featureImportances.slice(0, 10);

  const COLORS_BAR = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <SectionHeader title="⚗️ ML Model Performance"
          subtitle="Algorithm comparison, evaluation metrics, hyperparameter tuning results, and feature importances" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={fetchData}><RefreshCw size={14} /></button>
          <button className="btn-primary" onClick={handleTrain} disabled={training}>
            {training ? <><Spinner size={14} /> Training models...</> : <><Play size={14} /> Retrain Models</>}
          </button>
        </div>
      </div>

      {trainMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.25rem', color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
          {trainMsg}
        </div>
      )}

      {error && <div style={{ marginBottom: '1.25rem' }}><ErrorBox message={error} /></div>}

      {/* Best Model Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        color: 'white', display: 'flex', alignItems: 'center', gap: '1.25rem'
      }}>
        <Award size={36} color="#fbbf24" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8125rem', opacity: 0.8, marginBottom: 4 }}>🏆 Best Performing Model (by F1 Score)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{bestModel}</div>
          {results[bestModel] && (
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: 6, fontSize: '0.8125rem', opacity: 0.9, flexWrap: 'wrap' }}>
              {[
                ['Accuracy', Math.round(results[bestModel].accuracy * 100) + '%'],
                ['Precision', Math.round(results[bestModel].precision * 100) + '%'],
                ['Recall', Math.round(results[bestModel].recall * 100) + '%'],
                ['F1 Score', Math.round(results[bestModel].f1_score * 100) + '%'],
                ['ROC-AUC', Math.round(results[bestModel].roc_auc * 100) + '%'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ opacity: 0.7, fontSize: '0.7rem' }}>{k}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Training Samples</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{datasetStats.train_samples}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Test Samples</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{datasetStats.test_samples}</div>
        </div>
      </div>

      {/* Dataset Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Samples', value: datasetStats.total_samples, icon: '📊' },
          { label: 'Features Used', value: datasetStats.features_count, icon: '🔢' },
          { label: 'Missing Values', value: datasetStats.missing_values || 0, icon: '🔍' },
          { label: 'Non-Dropout (0)', value: datasetStats.class_distribution?.['Low Risk (0)'], icon: '✅' },
          { label: 'Dropout Risk (1)', value: datasetStats.class_distribution?.['High Risk (1)'], icon: '⚠️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{value ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Model Comparison Chart */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
          📊 Model Comparison (All Metrics — %)
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData} margin={{ left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Accuracy" fill="#2563eb" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Precision" fill="#7c3aed" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Recall" fill="#059669" radius={[2, 2, 0, 0]} />
            <Bar dataKey="F1" fill="#dc2626" radius={[2, 2, 0, 0]} />
            <Bar dataKey="AUC" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Table */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', fontSize: '0.9375rem' }}>
          Detailed Model Evaluation
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC', 'Confusion Matrix'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(results).map(([name, m]) => (
                <tr key={name} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: name === bestModel ? '#fefce8' : 'white',
                  fontWeight: name === bestModel ? 700 : 400
                }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {name === bestModel && <span style={{ color: '#d97706', marginRight: 5 }}>🏆</span>}
                    {name}
                  </td>
                  {['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'].map(k => (
                    <td key={k} style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                      <span style={{ fontWeight: 700 }}>{Math.round(m[k] * 100)}%</span>
                    </td>
                  ))}
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {m.confusion_matrix ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: '0.75rem', maxWidth: 80 }}>
                        {m.confusion_matrix.flat().map((v, i) => (
                          <div key={i} style={{
                            background: [0, 3].includes(i) ? '#d1fae5' : '#fee2e2',
                            borderRadius: 3, padding: '2px 6px', textAlign: 'center', fontWeight: 700,
                            color: [0, 3].includes(i) ? '#059669' : '#dc2626'
                          }}>{v}</div>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Feature Importances */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
            🔍 Top Feature Importances (Explainable AI)
          </div>
          {featTop.map((f, i) => (
            <div key={i} style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: '#374151', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.feature.replace(/_/g, ' ').replace('department ', '').substring(0, 30)}
                </span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${(f.importance / (featTop[0]?.importance || 1)) * 100}%`,
                  background: `hsl(${220 - i * 15}, 70%, 50%)`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Hyperparameter Tuning */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
            🎛️ Hyperparameter Tuning (Random Forest)
          </div>
          {tuningInfo?.model ? (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, background: '#fee2e2', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>Before Tuning</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                    {Math.round(tuningInfo.before_tuning_f1 * 100)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>F1 Score</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem' }}>→</div>
                <div style={{ flex: 1, background: '#d1fae5', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>After Tuning</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                    {Math.round(tuningInfo.after_tuning_f1 * 100)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669' }}>F1 Score</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Best Parameters (GridSearchCV):</div>
              {Object.entries(tuningInfo.best_params || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>{String(v)}</span>
                </div>
              ))}
            </>
          ) : <div style={{ color: '#94a3b8' }}>Tuning info not available.</div>}
        </div>
      </div>

      {/* ML Pipeline Diagram */}
      <div className="card">
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>🔄 ML Pipeline</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          {[
            '📄 CSV Dataset', '→', '🔍 Inspect & Clean', '→', '⚙️ Feature Engineering',
            '→', '✂️ Train/Test Split (80/20)', '→', '🤖 Multi-Model Training',
            '→', '🎛️ Hyperparameter Tuning', '→', '📊 Evaluation & Comparison',
            '→', '💾 Save Best Model (joblib)', '→', '🚀 FastAPI Inference'
          ].map((step, i) => (
            <div key={i} style={step === '→' ? { color: '#94a3b8', fontSize: '1.1rem' } : {
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
              padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#1e40af'
            }}>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
