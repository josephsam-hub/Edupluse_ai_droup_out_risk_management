import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import { Spinner } from './components/UI';

// Eagerly loaded (critical path)
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

// Lazily loaded dashboard pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const PredictRisk = lazy(() => import('./pages/PredictRisk'));
const BatchPrediction = lazy(() => import('./pages/BatchPrediction'));
const Interventions = lazy(() => import('./pages/Interventions'));
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'));
const ModelComparison = lazy(() => import('./pages/ModelComparison'));
const DatasetTraining = lazy(() => import('./pages/DatasetTraining'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const EngagementAnalytics = lazy(() => import('./pages/EngagementAnalytics'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));

/** Full-screen loading fallback */
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16
    }}>
      <Spinner size={36} />
      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9375rem' }}>Loading…</span>
    </div>
  );
}

/** Pages available to each role */
const ROLE_PAGES = {
  Admin: ['dashboard', 'students', 'predict', 'batch', 'interventions', 'model', 'model-comparison', 'dataset', 'reports', 'notifications', 'engagement'],
  Faculty: ['teacher-dashboard', 'students', 'predict', 'model', 'model-comparison', 'reports', 'notifications'],
  Counselor: ['dashboard', 'students', 'interventions', 'engagement', 'reports', 'notifications'],
};

function AppContent() {
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [currentPage, setCurrentPage] = useState(null); // null = role default
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  /* ── Boot loader ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        background: 'linear-gradient(135deg, #142B4A 0%, #356AE6 100%)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem'
        }}>🧠</div>
        <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>EduPulse AI</div>
        <Spinner size={28} />
      </div>
    );
  }

  /* ── Not logged in – show landing or login ───────────────────── */
  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onNavigateToLogin={() => setShowLanding(false)}
        />
      );
    }
    return <Login onBackToLanding={() => setShowLanding(true)} />;
  }

  /* ── Determine which page to show ───────────────────────────── */
  const rolePagesMap = ROLE_PAGES[user.role] || ROLE_PAGES.Admin;
  const activePage = currentPage || (user.role === 'Faculty' ? 'teacher-dashboard' : 'dashboard');

  // Guard: if page not allowed for role, fall back to first allowed
  const page = rolePagesMap.includes(activePage) ? activePage : rolePagesMap[0];

  const navigate = (pageId, studentId = null) => {
    setCurrentPage(pageId);
    if (studentId) setSelectedStudentId(studentId);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':          return <Dashboard />;
      case 'teacher-dashboard':  return <TeacherDashboard setCurrentPage={navigate} setSelectedStudentId={setSelectedStudentId} />;
      case 'students':           return <Students setCurrentPage={navigate} setSelectedStudentId={setSelectedStudentId} />;
      case 'student-profile':    return <StudentProfile studentId={selectedStudentId} setCurrentPage={navigate} />;
      case 'predict':            return <PredictRisk />;
      case 'batch':              return <BatchPrediction />;
      case 'interventions':      return <Interventions />;
      case 'model':              return <ModelPerformance />;
      case 'model-comparison':   return <ModelComparison />;
      case 'dataset':            return <DatasetTraining />;
      case 'reports':            return <Reports setCurrentPage={navigate} setSelectedStudentId={setSelectedStudentId} />;
      case 'notifications':      return <Notifications />;
      case 'engagement':         return <EngagementAnalytics />;
      default:                   return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FB' }}>
      <Sidebar
        currentPage={page}
        setCurrentPage={navigate}
        userRole={user.role}
      />
      <main style={{
        marginLeft: 240,
        flex: 1,
        padding: '1.75rem',
        maxWidth: 'calc(100vw - 240px)',
        minHeight: '100vh'
      }}>
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
