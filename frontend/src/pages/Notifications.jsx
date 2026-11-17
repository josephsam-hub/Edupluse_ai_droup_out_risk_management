import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  High: {
    border: '#ef4444',
    bg: '#fef2f2',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
  },
  Medium: {
    border: '#f59e0b',
    bg: '#fffbeb',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  },
  Low: {
    border: '#10b981',
    bg: '#f0fdf4',
    badge: 'bg-green-100 text-green-700 border border-green-200',
    icon: <Info className="w-4 h-4 text-green-500" />,
  },
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading notifications…</p>
    </div>
  );
}

function EmptyState({ activeTab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      <Bell className="w-14 h-14 opacity-30" />
      <p className="text-lg font-medium text-gray-500">No notifications</p>
      <p className="text-sm">
        {activeTab === 'Unread'
          ? 'You\'re all caught up! No unread notifications.'
          : activeTab === 'High Priority'
          ? 'No high-priority notifications at the moment.'
          : activeTab === 'History'
          ? 'No past notifications found.'
          : 'You have no notifications yet.'}
      </p>
    </div>
  );
}

function NotificationCard({ notification, onMarkRead }) {
  const priority = notification.priority || 'Low';
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Low;

  return (
    <div
      className="bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
      style={{
        borderLeft: `4px solid ${cfg.border}`,
        opacity: notification.is_read ? 0.75 : 1,
      }}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Priority icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: cfg.bg }}
        >
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-sm font-semibold text-gray-800 leading-snug"
                style={{ fontWeight: notification.is_read ? 500 : 700 }}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}
            >
              {priority}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(notification.created_at || notification.timestamp)}</span>
            </div>

            {!notification.is_read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                <Check className="w-3.5 h-3.5" />
                Mark as read
              </button>
            )}
            {notification.is_read && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5" />
                Read
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ['All Notifications', 'Unread', 'High Priority', 'History'];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Notifications');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/notifications');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.notifications ?? res.data?.data ?? [];
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'Unread') return !n.is_read;
    if (activeTab === 'High Priority') return n.priority === 'High';
    if (activeTab === 'History') return n.is_read;
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div
        className="px-6 py-6 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #142B4A 0%, #1e3a5f 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {unreadCount > 0 ? (
                  <BellRing className="w-7 h-7 text-white" />
                ) : (
                  <Bell className="w-7 h-7 text-white" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Notifications</h1>
                <p className="text-sm text-blue-200">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {markingAll ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === 'Unread'
                  ? unreadCount
                  : tab === 'High Priority'
                  ? notifications.filter((n) => n.priority === 'High').length
                  : tab === 'History'
                  ? notifications.filter((n) => n.is_read).length
                  : notifications.length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  style={
                    isActive
                      ? { borderBottom: '2px solid #356AE6' }
                      : { borderBottom: '2px solid transparent' }
                  }
                >
                  {tab}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchNotifications}
              className="ml-auto underline hover:no-underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                isMarking={markingId === notification.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
