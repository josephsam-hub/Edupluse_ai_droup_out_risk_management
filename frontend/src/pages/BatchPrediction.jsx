import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { batchAPI } from '../services/api';
import { SectionHeader, Spinner, ErrorBox, RiskBadge } from '../components/UI';

const SAMPLE_CSV = `student_id,name,department,semester,age,previous_gpa,current_gpa,marks_percentage,failed_subjects,assignment_completion_rate,internal_assessment_score,exam_performance_score,attendance_percentage,absent_days,late_arrivals,lms_logins_per_week,study_hours_per_week,assignment_consistency,classroom_participation,online_activity_hours,scholarship,financial_difficulty,mentoring_available,parent_support_level,distance_from_institute
DEMO001,Test Student A,Computer Science,3,20,8.0,7.5,75,0,85,78,72,88,5,2,12,18,82,7,14,0,0,1,4,8
DEMO002,Test Student B,Mechanical Eng,4,21,6.5,5.0,50,2,55,60,58,62,18,5,3,8,50,3,4,0,1,0,2,20
DEMO003,Test Student C,Data Science,2,19,7.0,7.2,72,0,80,75,78,82,7,1,10,16,79,6,12,1,0,1,5,5`;

export default function BatchPrediction() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setError('');
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a CSV file first'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await batchAPI.batchPredict(formData);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Batch prediction failed. Check your CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result?.csv_data) return;
    const blob = new Blob([result.csv_data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edupulse_batch_predictions.csv';
    a.click();
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edupulse_sample_students.csv';
    a.click();
  };

  return (
    <div>
      <SectionHeader title="📦 Batch Prediction"
        subtitle="Upload a CSV file to run dropout risk predictions on multiple students simultaneously" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Upload Section */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Upload Student CSV</div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${file ? '#2563eb' : '#d1d5db'}`, borderRadius: 10,
              padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
              background: file ? '#eff6ff' : '#fafafa', transition: 'all 0.2s'
            }}
          >
            <Upload size={36} color={file ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 0.75rem' }} />
            {file ? (
              <>
                <div style={{ fontWeight: 700, color: '#2563eb' }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB · Click to replace
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, color: '#374151' }}>Click to select CSV file</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>or drag and drop here</div>
              </>
            )}
          </div>
          <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={downloadSample} style={{ flex: 1 }}>
              <Download size={14} /> Sample CSV
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading || !file} style={{ flex: 1 }}>
              {loading ? <><Spinner size={14} /> Processing...</> : <><FileText size={14} /> Run Batch Predict</>}
            </button>
          </div>

          {error && <div style={{ marginTop: '0.875rem' }}><ErrorBox message={error} /></div>}
        </div>

        {/* Instructions */}
        <div className="card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>📋 CSV Format Requirements</div>
          <div style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.7 }}>
            <p>Your CSV must include these columns:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              {['student_id', 'name', 'department', 'current_gpa', 'previous_gpa', 'attendance_percentage',
                'failed_subjects', 'assignment_completion_rate', 'lms_logins_per_week', 'financial_difficulty'
              ].map(col => (
                <span key={col} style={{
                  background: '#f1f5f9', borderRadius: 4, padding: '2px 8px',
                  fontSize: '0.75rem', fontFamily: 'monospace', color: '#2563eb'
                }}>{col}</span>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>ℹ️ How It Works</div>
              <div style={{ color: '#374151', fontSize: '0.8rem' }}>
                1. Upload CSV → 2. Backend engineers features → 3. ML model runs inference → 4. Download results with risk levels
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
              <strong>⚠️ Note:</strong> Missing columns will use safe default values.
              Download the sample CSV to see the exact format.
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <div className="card" style={{ marginBottom: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                <CheckCircle size={16} style={{ color: '#16a34a', marginRight: 6, verticalAlign: 'middle' }} />
                Batch Prediction Complete!
              </div>
              <button className="btn-primary" onClick={downloadResults} style={{ background: '#16a34a' }}>
                <Download size={14} /> Download Results CSV
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Processed', value: result.batch_summary.total_students_processed, color: '#2563eb' },
                { label: 'High Risk', value: result.batch_summary.high_risk_count, color: '#dc2626' },
                { label: 'Medium Risk', value: result.batch_summary.medium_risk_count, color: '#d97706' },
                { label: 'Low Risk', value: result.batch_summary.low_risk_count, color: '#059669' },
                { label: 'Avg Dropout Risk', value: `${Math.round(result.batch_summary.average_dropout_probability * 100)}%`, color: '#7c3aed' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
              Prediction Results
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Student ID', 'Name', 'Department', 'GPA', 'Attendance', 'Risk Level', 'Dropout Probability', 'Top Risk Factor', 'Recommended Action'].map(h => (
                      <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.predictions.map((p) => (
                    <tr key={p.student_id} style={{ borderBottom: '1px solid #f1f5f9', background: p.risk_level === 'High' ? '#fff5f5' : 'white' }}>
                      <td style={{ padding: '0.625rem 1rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{p.student_id}</td>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '0.625rem 1rem', color: '#64748b' }}>{p.department}</td>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 700 }}>{p.current_gpa}</td>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: p.attendance_percentage < 75 ? '#dc2626' : '#059669' }}>
                        {p.attendance_percentage}%
                      </td>
                      <td style={{ padding: '0.625rem 1rem' }}><RiskBadge level={p.risk_level} /></td>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: p.risk_level === 'High' ? '#dc2626' : p.risk_level === 'Medium' ? '#d97706' : '#059669' }}>
                        {p.dropout_probability_percent}%
                      </td>
                      <td style={{ padding: '0.625rem 1rem', color: '#374151', maxWidth: 200, fontSize: '0.75rem' }}>{p.top_risk_factor}</td>
                      <td style={{ padding: '0.625rem 1rem', color: '#374151', maxWidth: 200, fontSize: '0.75rem' }}>{p.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
