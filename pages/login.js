import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Shield, Heart, Truck, Users, Brain, Zap, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.push('/dashboard/donor'); 
      } else {
        await signup(email, password, role);
        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      console.error("Auth Error:", err.code, err.message);
      if (err.code === 'auth/configuration-not-found') {
        setError('Firebase Error: Email/Password provider is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable it.');
      } else if (err.code === 'auth/invalid-credential') {
        setError(isLogin 
          ? "Invalid credentials. If you haven't created an account yet, please click 'Register Here' below." 
          : "Could not create account. Please ensure your email is valid and password is at least 6 characters.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please Login instead.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--background)', overflow: 'hidden' }}>
      {/* Left Decoration - Desktop only */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem', background: 'radial-gradient(circle at 10% 10%, rgba(99,102,241,0.1), transparent)', justifyContent: 'center' }} className="hide-mobile">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 15,
            background: 'linear-gradient(135deg,var(--primary),var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', marginBottom: '2rem', boxShadow: '0 0 30px var(--primary-glow)'
          }}>🍃</div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Predict. <span className="gradient-text">Rescue.</span><br />Empower.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--foreground-muted)', maxWidth: 450, lineHeight: 1.6, marginBottom: '3rem' }}>
            Access the world&apos;s most intelligent food rescue ecosystem. Join our network of nodes making zero waste a reality.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 500 }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <Brain size={24} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>AI Decision Core</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Real-time freshness prediction & route optimization.</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <Shield size={24} color="var(--secondary)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>Trust Protocol</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Decentralized accountability scoring for all participants.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Form */}
      <div style={{ width: 'min(100%, 500px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', borderLeft: '1px solid var(--border)', background: 'rgba(7,17,32,0.5)', backdropFilter: 'blur(20px)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="glass-card" style={{ width: '100%', padding: '2.5rem', background: 'rgba(4,13,26,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Join the mission to end food waste today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="label">Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input type="email" className="input" placeholder="name@organization.com" required
                  value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Secure Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input type="password" className="input" placeholder="••••••••" required
                  value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <label className="label">Select Your Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[
                      { id: 'donor', label: 'Donor', icon: Heart },
                      { id: 'receiver', label: 'Receiver', icon: Users },
                      { id: 'volunteer', label: 'Volunteer', icon: Truck },
                    ].map(r => (
                      <div key={r.id} onClick={() => setRole(r.id)} style={{
                        padding: '0.75rem 0.5rem', borderRadius: 8, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)',
                        background: role === r.id ? `${r.id === 'donor' ? 'var(--primary)' : r.id === 'receiver' ? 'var(--secondary)' : 'var(--accent)'}20` : 'transparent',
                        borderColor: role === r.id ? (r.id === 'donor' ? 'var(--primary)' : r.id === 'receiver' ? 'var(--secondary)' : 'var(--accent)') : 'var(--border)'
                      }}>
                        <r.icon size={16} style={{ margin: '0 auto 0.25rem', display: 'block', color: role === r.id ? 'inherit' : 'var(--foreground-muted)' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: role === r.id ? 700 : 500 }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Zap size={18} className="animate-spin" /> : isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Register Now</>}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                {isLogin ? 'Register Here' : 'Login Here'}
              </button>
            </p>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
              Back to Home <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
