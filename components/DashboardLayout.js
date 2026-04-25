'use client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Heart, Truck, Users, BarChart3, Settings, LogOut,
  Bell, Home, ChevronRight, Shield, Menu, X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const NotificationSystem = dynamic(() => import('./NotificationSystem'), { ssr: false });
const AIChatBot = dynamic(() => import('./AIChatBot'), { ssr: false });

const navItems = [
  { href: '/dashboard/donor', icon: Heart, label: 'Phase 1 — Donor', color: 'var(--primary)' },
  { href: '/dashboard/receiver', icon: Users, label: 'Phase 2 — Receiver', color: 'var(--secondary)' },
  { href: '/dashboard/volunteer', icon: Truck, label: 'Phase 3 — Volunteer', color: 'var(--accent)' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'AI Analytics', color: 'var(--purple)' },
];

export default function DashboardLayout({ children, role = 'donor' }) {
  const router = useRouter();
  const pathname = router.pathname;
  const { user, userData, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  const trustScore = userData?.trustScore || 100;

  const roleColors = { donor: 'var(--primary)', receiver: 'var(--secondary)', volunteer: 'var(--accent)' };
  const activeColor = roleColors[role] || 'var(--primary)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <AIChatBot />
      {/* ===== SIDEBAR ===== */}
      <aside style={{
        width: sidebarOpen ? 260 : 0, flexShrink: 0,
        background: 'rgba(7,17,32,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.3s ease',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', minWidth: 260 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: `linear-gradient(135deg, ${activeColor}, var(--secondary))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: `0 0 15px ${activeColor}40`, flexShrink: 0
            }}>🍃</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.1 }}>
                FoodRescue <span style={{ color: activeColor }}>DS-AI</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Real-Time System
              </div>
            </div>
          </Link>
          {/* Trust Score */}
          <div style={{
            marginTop: '1rem', padding: '0.6rem 0.75rem',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Shield size={14} color="var(--secondary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trust Score</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--secondary)' }}>{trustScore}%</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 8px var(--secondary)' }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--foreground-muted)', padding: '0.5rem 0.75rem 0.4rem' }}>
            Core Phases
          </div>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 0.75rem', borderRadius: 8, marginBottom: '0.15rem',
                fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                color: active ? item.color : 'var(--foreground-muted)',
                background: active ? `${item.color}15` : 'transparent',
                transition: 'all 0.2s', textDecoration: 'none'
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.color = 'var(--foreground)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)'; }}}
              >
                <item.icon size={16} color={active ? item.color : undefined} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: item.color }} />}
              </Link>
            );
          })}

          <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--foreground-muted)', padding: '0.25rem 0.75rem 0.4rem' }}>
            System
          </div>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.65rem 0.75rem', borderRadius: 8, marginBottom: '0.15rem',
            fontSize: '0.85rem', color: 'var(--foreground-muted)', textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            <Home size={16} /> Home
          </Link>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', textTransform: 'capitalize' }}>{userData?.role || role} Account</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
          <div 
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            style={{ padding: '0.65rem 0.75rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--foreground-muted)', transition: 'all 0.2s' }}>
            <LogOut size={16} /> Logout
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{
          padding: '0.85rem 2rem',
          background: 'rgba(4,13,26,0.9)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(o => !o)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div style={{ height: 24, width: 1, background: 'var(--border)' }} />
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={12} />
              <span style={{ color: activeColor, fontWeight: 600, textTransform: 'capitalize' }}>{role} Dashboard</span>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificationSystem />
            <div style={{
              padding: '0.35rem 0.8rem', borderRadius: 999,
              background: `${activeColor}15`, border: `1px solid ${activeColor}40`,
              fontSize: '0.75rem', fontWeight: 700, color: activeColor,
              textTransform: 'capitalize'
            }}>
              {role} Mode
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
