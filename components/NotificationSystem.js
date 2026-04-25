'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setToastBus } from '../services/store';

export default function NotificationSystem() {
  const [toasts, setToasts] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [allNotifs, setAllNotifs] = useState([
    { id: 'n0', type: 'match', title: '🎯 Match Found!', message: '120 meals of Wedding Biryani matched to 3 receivers', urgency: 'high', read: false, time: new Date(Date.now() - 120000).toISOString() },
    { id: 'n1', type: 'ai', title: '🤖 AI Forecast', message: 'Surplus predicted in Banjara Hills tonight (320 meals)', urgency: 'medium', read: false, time: new Date(Date.now() - 600000).toISOString() },
    { id: 'n2', type: 'alert', title: '🚨 Hunger Alert', message: 'Emergency request from Slum Colony — Mothinagar (200 meals needed)', urgency: 'critical', read: true, time: new Date(Date.now() - 3600000).toISOString() },
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  const addToast = useCallback((notif) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { ...notif, toastId: id };
    setToasts(prev => [toast, ...prev].slice(0, 5));
    setAllNotifs(prev => [{ ...notif, read: false }, ...prev]);
    setUnreadCount(prev => prev + 1);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    setToastBus(addToast);
    // Simulate live notifications
    const intervals = [
      setTimeout(() => addToast({ type: 'volunteer_alert', title: '🚴 Volunteer Needed!', message: 'Wedding Biryani (120 meals) in Banjara Hills needs pickup now!', urgency: 'high' }), 8000),
      setTimeout(() => addToast({ type: 'match', title: '✅ Order Placed', message: 'Helping Hands NGO placed order for 80 meals', urgency: 'medium' }), 15000),
      setTimeout(() => addToast({ type: 'ai', title: '🤖 AI Split Done', message: 'Biryani split: 60→Orphanage, 40→Slum Colony, 20→Old Age Home', urgency: 'low' }), 22000),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [addToast]);

  const markAllRead = () => {
    setAllNotifs(prev => prev.map(n => ({...n, read: true})));
    setUnreadCount(0);
  };

  const iconMap = {
    match: <CheckCircle size={16} color="#10b981" />,
    ai: <Info size={16} color="#6366f1" />,
    alert: <AlertTriangle size={16} color="#ef4444" />,
    volunteer_alert: <Zap size={16} color="#f59e0b" />,
    default: <Bell size={16} color="#6366f1" />
  };

  return (
    <>
      {/* Bell Button */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button onClick={() => setShowPanel(!showPanel)} className="btn btn-ghost" style={{ position: 'relative', padding: '0.5rem' }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: 'var(--danger)', color: 'white',
              borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700,
              padding: '1px 5px', minWidth: '16px', lineHeight: '14px',
              border: '2px solid var(--background)'
            }}>{unreadCount}</span>
          )}
        </button>

        {/* Notification Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 2000,
                width: '360px', background: 'var(--surface-2)',
                border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>🔔 Notifications</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '0.72rem' }}>Mark all read</button>
                  <button className="btn btn-ghost" onClick={() => setShowPanel(false)} style={{ padding: '0.25rem' }}><X size={16} /></button>
                </div>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                {allNotifs.map((n, i) => (
                  <div key={n.id || i} style={{
                    padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.25rem', background: n.read ? 'transparent' : 'rgba(99,102,241,0.08)',
                    borderLeft: `3px solid ${n.urgency === 'critical' ? 'var(--danger)' : n.urgency === 'high' ? 'var(--warning)' : 'var(--primary)'}`,
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      {iconMap[n.type] || iconMap.default}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>{n.message}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>{formatTime(n.time)}</div>
                      </div>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Container */}
      <div className="alert-toast">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.toastId}
              className="toast"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              style={{ borderLeft: `3px solid ${t.urgency === 'critical' ? 'var(--danger)' : t.urgency === 'high' ? 'var(--warning)' : 'var(--primary)'}` }}
            >
              <div className="toast-icon">{iconMap[t.type] || iconMap.default}</div>
              <div className="toast-body">
                <div className="toast-title">{t.title}</div>
                <div className="toast-msg">{t.message}</div>
              </div>
              <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.toastId !== t.toastId))}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function formatTime(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  } catch { return ''; }
}
