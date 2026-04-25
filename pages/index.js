import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Heart, Truck, MapPin, BarChart3, Brain, Database, Zap, Shield, ArrowRight, Users, Package, TrendingDown, LogOut } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ===== NAV ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(4,13,26,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg,var(--primary),var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', boxShadow: '0 0 20px var(--primary-glow)'
          }}>🍃</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>
              FoodRescue <span style={{ color: 'var(--secondary)' }}>DS-AI</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Real-Time Rescue System
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/dashboard/donor" className="btn btn-ghost">Donor</Link>
          <Link href="/dashboard/receiver" className="btn btn-ghost">Receiver</Link>
          <Link href="/dashboard/volunteer" className="btn btn-ghost">Volunteer</Link>
          <Link href="/dashboard/analytics" className="btn btn-ghost">Analytics</Link>
          {user ? (
            <button onClick={() => logout()} className="btn btn-outline" style={{ gap: '0.5rem' }}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary">Login →</Link>
          )}
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '8rem 2rem 4rem', position: 'relative',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 70%)'
      }}>
        {/* orbit rings */}
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.1)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.1)', border: '1px solid var(--primary)',
            borderRadius: 999, padding: '0.3rem 1rem', marginBottom: '1.5rem',
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)'
          }}>
            <Zap size={13} /> AI-Powered • 3-Phase Ecosystem • Real-Time
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: 800 }}>
            <span className="gradient-text">Predict. Split. Rescue.</span>
            <br />Zero Food Waste.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--foreground-muted)', maxWidth: 620, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            The world&apos;s most intelligent food rescue platform. Using LLM ingredient detection, regression freshness models, VRP route optimization, and real-time heatmap split distribution.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={user ? "/dashboard/donor" : "/login"} className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
              <Heart size={18} /> I Want to Donate <ArrowRight size={16} />
            </Link>
            <Link href={user ? "/dashboard/receiver" : "/login"} className="btn btn-secondary btn-lg">
              <Users size={18} /> I Need Food
            </Link>
            <Link href={user ? "/dashboard/volunteer" : "/login"} className="btn btn-outline btn-lg">
              <Truck size={18} /> Volunteer
            </Link>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
          style={{
            display: 'flex', gap: '0', marginTop: '5rem',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden'
          }}
        >
          {[
            { icon: '🍽️', val: '48,392', label: 'Meals Rescued' },
            { icon: '📉', val: '72.4%', label: 'Waste Reduced' },
            { icon: '🤝', val: '148', label: 'NGOs Served' },
            { icon: '🚴', val: '312', label: 'Active Volunteers' },
            { icon: '⚡', val: '28 min', label: 'Avg Delivery' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '1.5rem 2rem', textAlign: 'center',
              borderRight: i < 4 ? '1px solid var(--border)' : 'none',
              minWidth: 140
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '6rem 3rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem' }}>3-Phase Intelligence System</h2>
          <p style={{ color: 'var(--foreground-muted)', maxWidth: 600, margin: '0 auto' }}>
            Every phase uses dedicated AI models to ensure food reaches the right people at the right time.
          </p>
        </div>
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          {[
            {
              phase: 'Phase 1', title: 'Donor Hub', color: 'var(--primary)', icon: '🍽️',
              points: ['Hotels, Hostels, Temples, Convention Halls', 'AI LLM ingredient auto-detection', 'Freshness regression scoring', 'Spoiled food → Pig farm / Agriculture routing', 'AI surplus heatmap forecasting', 'Split distribution engine'],
              link: '/dashboard/donor', label: 'Open Donor Dashboard'
            },
            {
              phase: 'Phase 2', title: 'Receiver Portal', color: 'var(--secondary)', icon: '🤝',
              points: ['Ashrams, NGOs, Slum colonies, Low-wage communities', 'Real-time food feed with AI match scores', 'Location search + source map tracking', 'Triple transport modes (Public/Volunteer/Private)', 'Reverse hunger alerts & emergency AI dispatch', 'Return option for spoiled food'],
              link: '/dashboard/receiver', label: 'Open Receiver Portal'
            },
            {
              phase: 'Phase 3', title: 'Volunteer Engine', color: 'var(--accent)', icon: '🚴',
              points: ['VRP route optimization model', 'Rapido-style push notifications', 'Free-time slot scheduling', 'Credits + incentive reward system', 'Rating & trust score tracking', 'Massive food → multi-volunteer split'],
              link: '/dashboard/volunteer', label: 'Join as Volunteer'
            },
          ].map((ph, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="glass-card" style={{ padding: '2rem', borderTop: `3px solid ${ph.color}` }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{ph.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ph.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{ph.phase}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>{ph.title}</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {ph.points.map((p, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--foreground-muted)' }}>
                    <span style={{ color: ph.color, marginTop: 2 }}>✓</span> {p}
                  </li>
                ))}
              </ul>
              <Link href={ph.link} className="btn btn-outline" style={{ width: '100%', borderColor: ph.color, color: ph.color }}>
                {ph.label} <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== AI FEATURES ===== */}
      <section style={{ padding: '4rem 3rem', background: 'rgba(99,102,241,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>AI & Data Science Stack</h2>
            <p style={{ color: 'var(--foreground-muted)' }}>Every decision is model-driven</p>
          </div>
          <div className="grid-4">
            {[
              { icon: <Brain size={24} />, color: 'var(--primary)', title: 'LLM Ingredient Parser', desc: 'HuggingFace flan-t5 auto-extracts ingredients from free-text food descriptions' },
              { icon: <TrendingDown size={24} />, color: 'var(--secondary)', title: 'Freshness Regression', desc: 'TensorFlow polynomial regression predicts food safety score from time & storage conditions' },
              { icon: <BarChart3 size={24} />, color: 'var(--accent)', title: 'Surplus Forecasting', desc: 'Prophet time-series predicts zones of surplus & hunger based on historical patterns' },
              { icon: <MapPin size={24} />, color: 'var(--danger)', title: 'VRP Route Optimizer', desc: 'Vehicle Routing Problem solver assigns optimal multi-stop routes to available volunteers' },
              { icon: <Database size={24} />, color: 'var(--purple)', title: 'Split Distribution', desc: 'Priority-weighted algorithm divides large donations across multiple receivers fairly' },
              { icon: <Zap size={24} />, color: 'var(--warning)', title: 'Emergency AI Dispatch', desc: 'AI decision engine processes reverse hunger alerts and reroutes active donations in seconds' },
              { icon: <Shield size={24} />, color: 'var(--info)', title: 'Trust Core System', desc: 'Continuous scoring of donors, receivers, and volunteers based on behavior and ratings' },
              { icon: <Package size={24} />, color: 'var(--secondary)', title: 'Spoil Rerouting', desc: 'Spoiled food auto-routes to nearest pig farms or agriculture composting centers via map' },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ color: f.color, marginBottom: '0.75rem' }}>{f.icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>{f.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ padding: '2rem 3rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--foreground-muted)', fontSize: '0.8rem' }}>
        <p>🍃 FoodRescue DS-AI — Powered by LLM · TensorFlow · Prophet · VRP Optimization</p>
        <p style={{ marginTop: '0.5rem' }}>Connecting surplus food to those who need it most.</p>
      </footer>
    </div>
  );
}
