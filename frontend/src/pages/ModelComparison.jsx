import React, { useState, useEffect } from 'react';
import {
  Trophy, Target, TrendingUp, Database, Cpu, CheckCircle,
  AlertCircle, BarChart3, RefreshCw, Info, Settings
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../services/api';
import { Spinner } from '../components/UI';

// Colour helpers
const metricColor = (v) => {
  if (v >= 0.80) return '#10b981';
  if (v >= 0.65) return '#f59e0b';
  return '#ef4444';
};

const MetricCell = ({ value }) => {
  const pct = (value * 100).toFixed(1);
  const color = metricColor(value);
  return (
    <span style={{ fontWeight: 700, color, fontSize: '0.875rem' }}>{pct}%</span>
  );
};

const BestBadge = () => (
  <span style={{ background: 'linear-gradient(135deg,#356AE6,#14B8A6)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.05em', marginLeft: 6 }}>
    ★ BEST
  </span>
);

function ConfusionMatrix({ cm, modelName }) {
  if (!cm || cm.length < 2) return null;
  const [[tn, fp], [fn, tp]] = cm;
  const total = tn + fp + fn + tp;
  const cells = [
    { label: 'True Negative', value: tn, pct: total ? ((tn / total) * 100).toFixed(1) : 0, bg: '#d1fae5', color: '#065f46', note: 'Correctly predicted Low Risk' },
    { label: 'False Positive', value: fp, pct: total ? ((fp / total) * 100).toFixed(1) : 0, bg: '#fef3c7', color: '#92400e', note: 'Incorrectly flagged as High Risk' },
    { label: 'False Negative', value: fn, pct: total ? ((fn / total) * 100).toFixed(1) : 0, bg: '#fecaca', color: '#991b1b', note: 'Missed High Risk student ⚠' },
    { label: 'True Positive', value: tp, pct: total ? ((tp / total) * 100).toFixed(1) : 0, bg: '#d1fae5', color: '#065f46', note: 'Correctly predicted High Risk' },
  ];

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '0.9375rem' }}>Confusion Matrix</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>{modelName}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '0.75rem' }}>
        {cells.map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: c.color, marginTop: 2 }}>{c.label}</div>
            <div style={{ fontSize: '0.65rem', color: c.color + 'aa', marginTop: 2 }}>{c.pct}%</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.7rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
        <div style={{ gridColumn: '1 / -1', fontWeight: 600, color: '#475569', marginBottom: 2 }}>↑ Actual Class →</div>
        <div>Low Risk (Actual 0)</div>
        <div>High Risk (Actual 1)</div>
      </div>
      {cells.map(c => (
        <div key={c.note} style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: c.bg, border: `1px solid ${c.color}44`, flexShrink: 0 }} />
          {c.note}
        </div>
      ))}
    </div>
  );
}

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/model-performance');
      setData(res.data);
    } catch (e) {
      setError('Model performance data unavailable. Train the model first.');
    } finally { setLoading(false); }
  };

  const handleTrain = async () => {
    setTraining(true); setTrainMsg('');
    try {
      await api.post('/api/train');
      setTrainMsg('✅ Training complete! Refreshing metrics…');
      setTimeout(() => { fetchData(); setTrainMsg(''); }, 2000);
    } catch (e) {
      setTrainMsg('❌ Training failed: ' + (e.response?.data?.detail || e.message));
    } finally { setTraining(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <Spinner size={28} /><span style={{ color: '#64748b', fontWeight: 600 }}>Loading model metrics…</span>
    </div>
  );

  const noModel = error || !data;

  // Build table rows from results
  const models = data?.results ? Object.entries(data.results).map(([name, metrics]) => ({
    name,
    ...metrics,
    isBest: name === data.best_model_name
  })) : [];

  // Chart data for grouped bar
  const barData = models.map(m => ({
    name: m.name.replace(' (Tuned)', '†').replace(' Classifier', ''),
    Accuracy: parseFloat((m.accuracy * 100).toFixed(1)),
    Precision: parseFloat((m.precision * 100).toFixed(1)),
    Recall: parseFloat((m.recall * 100).toFixed(1)),
    'F1-Score': parseFloat((m.f1_score * 100).toFixed(1)),
    'ROC-AUC': parseFloat((m.roc_auc * 100).toFixed(1)),
  }));

  // Radar data for best model
  const bestModel = models.find(m => m.isBest);
  const radarData = bestModel ? [
    { metric: 'Accuracy', value: parseFloat((bestModel.accuracy * 100).toFixed(1)) },
    { metric: 'Precision', value: parseFloat((bestModel.precision * 100).toFixed(1)) },
    { metric: 'Recall', value: parseFloat((bestModel.recall * 100).toFixed(1)) },
    { metric: 'F1-Score', value: parseFloat((bestModel.f1_score * 100).toFixed(1)) },
    { metric: 'ROC-AUC', value: parseFloat((bestModel.roc_auc * 100).toFixed(1)) },
  ] : [];

  const ds = data?.dataset_stats;
  const tuning = data?.tuning_info;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>⚗️ ML Model Comparison</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
            Comparative analysis of all trained classification algorithms
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleTrain} disabled={training} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
            <Cpu size={14} /> {training ? 'Training…' : 'Retrain Models'}
          </button>
        </div>
      </div>

      {trainMsg && (
        <div style={{ background: trainMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', border: `1px solid ${trainMsg.startsWith('✅') ? '#6ee7b7' : '#fca5a5'}`, borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: trainMsg.startsWith('✅') ? '#065f46' : '#991b1b' }}>
          {trainMsg}
        </div>
      )}

      {noModel ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <BarChart3 size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
          <div style={{ fontWeight: 700, color: '#475569', fontSize: '1.125rem', marginBottom: 8 }}>No Trained Model Found</div>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            {error || 'Train the ML model to view algorithm comparison, metrics, and feature importances.'}
          </div>
          <button className="btn-primary" onClick={handleTrain} disabled={training}>
            <Cpu size={14} /> {training ? 'Training in progress…' : 'Train ML Models Now'}
          </button>
        </div>
      ) : (
        <>
          {/* Best Model Banner */}
          {bestModel && (
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#356AE6,#14B8A6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                  Best Model: {bestModel.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 2 }}>
                  Selected based on highest F1-Score — balancing precision and recall for dropout classification
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                {[['F1-Score', bestModel.f1_score], ['Accuracy', bestModel.accuracy], ['ROC-AUC', bestModel.roc_auc]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: metricColor(val) }}>{(val * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Algorithm Comparison Table */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
              📊 Algorithm Performance Comparison
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Model', 'Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.03em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={m.name} style={{ borderBottom: '1px solid #f1f5f9', background: m.isBest ? '#f0fdf4' : i % 2 === 0 ? 'white' : '#fafbfc' }}>
                      <td style={{ padding: '10px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                        {m.name}{m.isBest && <BestBadge />}
                      </td>
                      <td style={{ padding: '10px 16px' }}><MetricCell value={m.accuracy} /></td>
                      <td style={{ padding: '10px 16px' }}><MetricCell value={m.precision} /></td>
                      <td style={{ padding: '10px 16px' }}><MetricCell value={m.recall} /></td>
                      <td style={{ padding: '10px 16px' }}><MetricCell value={m.f1_score} /></td>
                      <td style={{ padding: '10px 16px' }}><MetricCell value={m.roc_auc} /></td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.isBest
                          ? <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>✓ Deployed</span>
                          : <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>Compared</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Green ≥ 80%</span>
              {' · '}
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Amber 65–80%</span>
              {' · '}
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Red &lt; 65%</span>
              {' · † = Hyperparameter tuned'}
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Grouped Bar Chart */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>Metric Comparison (% per model)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Accuracy" fill="#356AE6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Precision" fill="#14B8A6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Recall" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="F1-Score" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ROC-AUC" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart for best model */}
            {bestModel && radarData.length > 0 && (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '0.9375rem' }}>Best Model Profile</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>{bestModel.name}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name={bestModel.name} dataKey="value" stroke="#356AE6" fill="#356AE6" fillOpacity={0.25} />
                    <Tooltip formatter={(v) => `${v}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bottom Row: Confusion Matrix + Dataset Stats + Tuning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Confusion Matrix */}
            {bestModel?.confusion_matrix && (
              <ConfusionMatrix cm={bestModel.confusion_matrix} modelName={bestModel.name} />
            )}

            {/* Dataset Stats */}
            {ds && (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={16} color="#356AE6" /> Dataset Statistics
                </div>
                {[
                  ['Total Samples', ds.total_samples],
                  ['Training Samples', ds.train_samples],
                  ['Test Samples', ds.test_samples],
                  ['Input Features', ds.features_count],
                  ['Encoded Features', ds.transformed_features_count],
                  ['Missing Values', ds.missing_values],
                  ['Duplicates Found', ds.duplicates],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#475569' }}>{label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>{val?.toLocaleString?.() ?? val}</span>
                  </div>
                ))}
                {ds.class_distribution && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Class Distribution</div>
                    {Object.entries(ds.class_distribution).map(([cls, cnt]) => {
                      const total = Object.values(ds.class_distribution).reduce((a, b) => a + b, 0);
                      const pct = total ? ((cnt / total) * 100).toFixed(0) : 0;
                      return (
                        <div key={cls} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                            <span style={{ color: '#475569' }}>{cls}</span>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{cnt} ({pct}%)</span>
                          </div>
                          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                            <div style={{ height: '100%', borderRadius: 3, background: cls.includes('High') ? '#ef4444' : '#10b981', width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Hyperparameter Tuning */}
            {tuning && (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={16} color="#8b5cf6" /> Hyperparameter Tuning
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.875rem', marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>F1-SCORE IMPROVEMENT</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{(tuning.before_tuning_f1 * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>BEFORE</div>
                    </div>
                    <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right,#f59e0b,#10b981)', borderRadius: 1 }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{(tuning.after_tuning_f1 * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>AFTER</div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Best Parameters ({tuning.model})</div>
                {Object.entries(tuning.best_params || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                    <code style={{ color: '#7c3aed', fontSize: '0.75rem' }}>{k}</code>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature Importances */}
          {data?.feature_importances?.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                🔍 Top Feature Importances (Best Model)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {data.feature_importances.slice(0, 12).map((f, i) => {
                  const max = data.feature_importances[0]?.importance || 1;
                  const pct = ((f.importance / max) * 100).toFixed(0);
                  return (
                    <div key={f.feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '0.78rem', color: '#475569', width: 170, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.feature}</span>
                      <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                        <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(to right, #356AE6, #14B8A6)`, width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#356AE6', width: 36, textAlign: 'right', flexShrink: 0 }}>
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.625rem 1rem', background: '#eff6ff', borderRadius: 8, fontSize: '0.78rem', color: '#1d4ed8' }}>
                <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
                Feature importances show the relative contribution of each input variable to the model's predictions. Higher values indicate stronger predictive influence.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
