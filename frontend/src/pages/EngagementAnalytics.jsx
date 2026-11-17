import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Activity,
  TrendingUp,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = {
  blue: '#356AE6',
  teal: '#14B8A6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  navy: '#142B4A',
  purple: '#8b5cf6',
};

// ─── Demo / Fallback Data ──────────────────────────────────────────────────────
const demoAttendance = [
  { month: 'Jun', attendance: 78 },
  { month: 'Jul', attendance: 82 },
  { month: 'Aug', attendance: 75 },
  { month: 'Sep', attendance: 88 },
  { month: 'Oct', attendance: 85 },
  { month: 'Nov', attendance: 91 },
];

const demoAssignmentCompletion = [
  { department: 'CS', completion: 87 },
  { department: 'Math', completion: 73 },
  { department: 'Physics', completion: 68 },
  { department: 'English', completion: 91 },
  { department: 'History', completion: 79 },
  { department: 'Biology', completion: 84 },
];

const demoEngagementDistribution = [
  { name: 'High', value: 38 },
  { name: 'Medium', value: 45 },
  { name: 'Low', value: 17 },
];

const demoActivityTimeline = [
  { week: 'Wk 1', logins: 320, submissions: 210, discussions: 95 },
  { week: 'Wk 2', logins: 410, submissions: 290, discussions: 130 },
  { week: 'Wk 3', logins: 380, submissions: 260, discussions: 115 },
  { week: 'Wk 4', logins: 450, submissions: 330, discussions: 160 },
  { week: 'Wk 5', logins: 490, submissions: 370, discussions: 185 },
  { week: 'Wk 6', logins: 520, submissions: 400, discussions: 210 },
];

const demoDeptEngagement = [
  { department: 'CS', score: 84, attendance: 88, assignments: 87 },
  { department: 'Math', score: 72, attendance: 75, assignments: 73 },
  { department: 'Physics', score: 68, attendance: 70, assignments: 68 },
  { department: 'English', score: 89, attendance: 90, assignments: 91 },
  { department: 'History', score: 76, attendance: 78, assignments: 79 },
  { department: 'Biology', score: 82, attendance: 83, assignments: 84 },
];

const DEPARTMENTS = ['All', 'CS', 'Math', 'Physics', 'English', 'History', 'Biology'];
const PIE_COLORS = [COLORS.green, COLORS.amber, COLORS.red];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-gray-600 capitalize">{p.name}:</span>
          <span className="font-medium text-gray-800">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {p.name?.toLowerCase().includes('attendance') ||
            p.name?.toLowerCase().includes('score') ||
            p.name?.toLowerCase().includes('completion')
              ? '%'
              : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, fullWidth = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow ${
        fullWidth ? 'col-span-full' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color: COLORS.blue }} />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Explanation Panel ────────────────────────────────────────────────────────
function ScoreExplanation() {
  const factors = [
    { label: 'Attendance Rate', weight: '35%', color: COLORS.blue },
    { label: 'Assignment Completion', weight: '30%', color: COLORS.teal },
    { label: 'Discussion Participation', weight: '20%', color: COLORS.green },
    { label: 'Login Frequency', weight: '15%', color: COLORS.amber },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 col-span-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" style={{ color: COLORS.blue }} />
        <h3 className="text-sm font-semibold text-gray-700">
          How Engagement Score Is Calculated
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {factors.map((f) => (
          <div key={f.label} className="text-center">
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: f.color }}
            >
              {f.weight}
            </div>
            <div className="text-xs text-gray-500 font-medium">{f.label}</div>
            <div
              className="mt-2 h-1.5 rounded-full w-full"
              style={{ background: f.color + '33' }}
            >
              <div
                className="h-1.5 rounded-full"
                style={{
                  background: f.color,
                  width: f.weight,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        The engagement score is a composite index calculated weekly for each student. Scores
        above <strong>80</strong> are classified as <strong className="text-green-600">High</strong>,
        between <strong>50–79</strong> as <strong className="text-amber-600">Medium</strong>, and
        below <strong>50</strong> as <strong className="text-red-500">Low</strong>.
      </p>
    </div>
  );
}

// ─── Custom Pie Label ─────────────────────────────────────────────────────────
const renderPieLabel = ({ name, percent }) =>
  `${name} ${(percent * 100).toFixed(0)}%`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EngagementAnalytics() {
  const [engagementData, setEngagementData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(demoAttendance);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [department, setDepartment] = useState('All');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    let demo = false;

    try {
      const [engRes, attRes] = await Promise.allSettled([
        api.get('/api/analytics/engagement'),
        api.get('/api/analytics/attendance'),
      ]);

      if (engRes.status === 'fulfilled') {
        setEngagementData(engRes.value.data);
      } else {
        demo = true;
      }

      if (attRes.status === 'fulfilled') {
        const d = attRes.value.data;
        const arr = Array.isArray(d) ? d : d?.attendance ?? demoAttendance;
        setAttendanceData(arr.length ? arr : demoAttendance);
      } else {
        demo = true;
      }
    } catch {
      demo = true;
    } finally {
      setUsingDemo(demo);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived / merged data ──────────────────────────────────────────────────
  const assignmentData =
    engagementData?.assignment_completion ?? demoAssignmentCompletion;
  const distributionData =
    engagementData?.engagement_distribution ?? demoEngagementDistribution;
  const activityData =
    engagementData?.activity_timeline ?? demoActivityTimeline;
  const deptData =
    engagementData?.department_engagement ?? demoDeptEngagement;

  const filteredDeptData =
    department === 'All'
      ? deptData
      : deptData.filter((d) => d.department === department);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const avgScore =
    engagementData?.avg_engagement_score ??
    Math.round(
      deptData.reduce((sum, d) => sum + (d.score ?? 0), 0) / deptData.length
    );

  const highPct =
    engagementData?.high_engagement_pct ??
    distributionData.find((d) => d.name === 'High')?.value ??
    38;

  const lowPct =
    engagementData?.low_engagement_pct ??
    distributionData.find((d) => d.name === 'Low')?.value ??
    17;

  const activeStudents = engagementData?.active_students ?? 1248;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-6 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #142B4A 0%, #1e3a5f 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">Engagement Analytics</h1>
              <p className="text-sm text-blue-200">
                Student performance & activity insights
              </p>
            </div>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-200" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-sm font-medium rounded-lg px-3 py-2 bg-white/15 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} style={{ color: '#142B4A', background: '#fff' }}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Demo banner ────────────────────────────────────────────────────── */}
      {usingDemo && !loading && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700 text-sm">
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>
              Could not reach the API — showing <strong>demo data</strong> for
              illustration purposes.
            </span>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* ── Summary Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={TrendingUp}
              label="Avg Engagement Score"
              value={`${avgScore}`}
              sub="Out of 100"
              color={COLORS.blue}
              bg="#eff6ff"
            />
            <SummaryCard
              icon={Activity}
              label="High Engagement"
              value={`${highPct}%`}
              sub="Students above threshold"
              color={COLORS.green}
              bg="#f0fdf4"
            />
            <SummaryCard
              icon={BookOpen}
              label="Low Engagement"
              value={`${lowPct}%`}
              sub="Needs attention"
              color={COLORS.red}
              bg="#fef2f2"
            />
            <SummaryCard
              icon={Users}
              label="Active Students"
              value={activeStudents.toLocaleString()}
              sub="This semester"
              color={COLORS.teal}
              bg="#f0fdfa"
            />
          </div>

          {/* ── Charts Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Attendance Trend Line Chart */}
            <ChartCard title="Attendance Trend (Last 6 Months)" icon={Calendar}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={attendanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    domain={[60, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke={COLORS.blue}
                    strokeWidth={2.5}
                    dot={{ fill: COLORS.blue, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Assignment Completion Bar Chart */}
            <ChartCard title="Assignment Completion by Department" icon={BookOpen}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={assignmentData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="completion"
                    name="Completion %"
                    fill={COLORS.teal}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Engagement Distribution Pie Chart */}
            <ChartCard title="Engagement Level Distribution" icon={Activity}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {distributionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => (
                      <span style={{ color: '#374151' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Student Activity Timeline Area Chart */}
            <ChartCard title="Student Activity Timeline (Weekly)" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={activityData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDiscussions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    name="Logins"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    fill="url(#colorLogins)"
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name="Submissions"
                    stroke={COLORS.teal}
                    strokeWidth={2}
                    fill="url(#colorSubmissions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="discussions"
                    name="Discussions"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    fill="url(#colorDiscussions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 5. Department-wise Engagement Comparison */}
            <ChartCard
              title="Department-wise Engagement Comparison"
              icon={BarChart3}
              fullWidth
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={filteredDeptData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="score"
                    name="Engagement Score"
                    fill={COLORS.blue}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="attendance"
                    name="Attendance %"
                    fill={COLORS.teal}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="assignments"
                    name="Assignment %"
                    fill={COLORS.green}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Score Explanation Panel */}
            <ScoreExplanation />
          </div>
        </div>
      )}
    </div>
  );
}
