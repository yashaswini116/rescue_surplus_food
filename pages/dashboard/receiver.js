import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  ShoppingCart, Map, Bell, Truck, CreditCard, AlertTriangle,
  Activity, MapPin, Package, Search, X, ArrowRight, Star,
  RefreshCw, RotateCcw, Zap, Navigation, Phone
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import RatingSystem from '../../components/RatingSystem';
import { processEmergencyAlert, fetchNearbyTransitStops, fetchSpoiledFoodEndpoints } from '../../services/aiEngine';
import { getStore, addNotification, isReceiverBlocked, updateReceiverReception } from '../../services/store';

const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { ssr: false });

const RECEIVER_CENTER = [17.32, 78.43];

const DONATION_FEED = [
  { id: 'f1', foodType: 'Wedding Biryani', quantity: 120, donorName: 'Taj Krishna Hotel', donorType: 'Hotel', donorTrust: 98, distance: '1.4 km', ingredients: ['basmati rice','chicken','saffron','spices'], urgency: 'high', score: 83, coords: [17.385, 78.4867], isSpoiled: false, expiryLabel: 'Expires in 2h 15m', splitAvail: 60 },
  { id: 'f2', foodType: 'Mixed Veg Dal', quantity: 80, donorName: 'Anna Canteen JNTU', donorType: 'Hostel', donorTrust: 91, distance: '3.1 km', ingredients: ['lentils','vegetables','spices'], urgency: 'medium', score: 72, coords: [17.44, 78.55], isSpoiled: false, expiryLabel: 'Expires in 5h', splitAvail: 25 },
  { id: 'f3', foodType: 'Paneer Tikka Masala', quantity: 45, donorName: 'Paradise Restaurant', donorType: 'Restaurant', donorTrust: 88, distance: '0.9 km', ingredients: ['paneer','tomato','cream','spices'], urgency: 'medium', score: 78, coords: [17.36, 78.52], isSpoiled: false, expiryLabel: 'Expires in 3h', splitAvail: 45 },
];

const RECEIVER_LOCATIONS = [
  { name: 'Sai Ashram', type: 'Ashram', addr: 'Dilsukhnagar, Hyderabad' },
  { name: 'Helping Hands NGO', type: 'NGO', addr: 'Kukatpally, Hyderabad' },
  { name: 'Mothinagar Slum', type: 'Slum Colony', addr: 'Mothinagar, Near Ring Road' },
  { name: 'Day Labor Hub', type: 'Community', addr: 'Secunderabad Railway Area' },
];

function PaymentModal({ order, onPay, onClose }) {
  const [step, setStep] = useState(1);
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="btn btn-ghost btn-sm"><X size={16} /></button>
        <CreditCard size={28} color="var(--secondary)" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Secure Payment — Rapido / Private Courier</h3>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Booking private delivery for <b>{order?.foodType}</b> ({order?.splitAvail || order?.quantity} meals)
        </p>
        {step === 1 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <button className="btn btn-outline" style={{ flexDirection: 'column', gap: '0.3rem', padding: '1rem', height: 'auto' }}
                onClick={() => setStep(2)}>
                <span style={{ fontSize: '1.5rem' }}>🛵</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Rapido Bike</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>₹89 · 18 min</span>
              </button>
              <button className="btn btn-outline" style={{ flexDirection: 'column', gap: '0.3rem', padding: '1rem', height: 'auto' }}
                onClick={() => setStep(2)}>
                <span style={{ fontSize: '1.5rem' }}>🚐</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Van Courier</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>₹249 · 32 min</span>
              </button>
              <button className="btn btn-outline" style={{ flexDirection: 'column', gap: '0.3rem', padding: '1rem', height: 'auto' }}
                onClick={() => setStep(2)}>
                <span style={{ fontSize: '1.5rem' }}>🚗</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Send Own Vehicle</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>Free · Your timing</span>
              </button>
              <button className="btn btn-outline" style={{ flexDirection: 'column', gap: '0.3rem', padding: '1rem', height: 'auto' }}
                onClick={() => setStep(2)}>
                <span style={{ fontSize: '1.5rem' }}>📦</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Courier Partner</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>₹149 · 45 min</span>
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input className="input font-mono" placeholder="Card Number (4242 4242 4242 4242)" value={cardNum}
                onChange={e => setCardNum(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input className="input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
                <input className="input" placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value)} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🔒 End-to-end encrypted · Sandbox Mode
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onPay}>
              Confirm & Pay — ₹89
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function EmergencyModal({ onSubmit, onClose }) {
  const [desc, setDesc] = useState('');
  const [meals, setMeals] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await processEmergencyAlert(desc, 3);
    setResult(res);
    setLoading(false);
    addNotification({ type: 'alert', title: '🚨 Emergency Dispatched', message: `AI rerouting ${res.mealsAllocated} meals. ETA: ${res.estimatedArrival}`, urgency: 'critical' });
    setTimeout(() => { onSubmit(res); onClose(); }, 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ borderColor: 'var(--danger)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="btn btn-ghost btn-sm"><X size={16} /></button>
        <Activity size={28} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--danger)' }}>
          🚨 Reverse Hunger Alert — Emergency
        </h3>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          AI decision engine will reroute active donations and notify all nearby donors &amp; volunteers with critical priority.
        </p>
        {!result ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label className="label">Describe Emergency</label>
              <textarea className="input" rows={3} required value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Community flooded, 300 people need meals immediately, no food since 24hrs…" />
            </div>
            <div>
              <label className="label">Meals Needed (Approx)</label>
              <input className="input" type="number" placeholder="e.g. 200" value={meals} onChange={e => setMeals(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={loading}>
              {loading ? <><Zap size={16} className="animate-spin" /> AI Processing Emergency…</> : '🚨 Deploy AI Rescue Dispatch'}
            </button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Emergency Dispatched!</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem' }}>{result.aiReason}</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-secondary">{result.mealsAllocated} meals rerouted</span>
              <span className="badge badge-primary">{result.volunteersNotified} volunteers notified</span>
              <span className="badge badge-accent">ETA: {result.estimatedArrival}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function ReceiverDashboard() {
  const [tab, setTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showReturn, setShowReturn] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [myLocation, setMyLocation] = useState(RECEIVER_LOCATIONS[0]);
  const [transitStops, setTransitStops] = useState([]);
  const [spoilEndpoints, setSpoilEndpoints] = useState([]);
  const [trackingActive, setTrackingActive] = useState(false);

  useEffect(() => {
    // Initial load
    const store = getStore();
    setFeed(store.donations);
    setNotifications(store.notifications.slice(0, 5));
    
    fetchNearbyTransitStops().then(setTransitStops);
    fetchSpoiledFoodEndpoints().then(setSpoilEndpoints);

    // Refresh interval for live feed
    const interval = setInterval(() => {
      setFeed([...getStore().donations]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const placeOrder = (food, transport) => {
    if (isReceiverBlocked('r1')) {
      addNotification({ 
        type: 'alert', 
        title: '🔴 Service Paused', 
        message: 'To ensure equity, you can only request food once every 4 hours. System will unlock soon.', 
        urgency: 'high' 
      });
      return;
    }
    setActiveOrder({ ...food, transport });
    if (transport === 'private') setShowPayment(true);
    else {
      updateReceiverReception('r1');
      addNotification({ type: 'match', title: '✅ Order Confirmed', message: `${food.foodType} on the way via ${transport}. ETA ~22 min`, urgency: 'medium' });
    }
    setTrackingActive(true);
  };

  const filteredFeed = feed.filter(f =>
    (f.foodType?.toLowerCase() || '').includes(locationSearch.toLowerCase()) ||
    (f.donorName?.toLowerCase() || '').includes(locationSearch.toLowerCase()) ||
    locationSearch === ''
  );

  const mapMarkers = [
    { pos: RECEIVER_CENTER, type: 'receiver', popup: `${myLocation.name} (You)` },
    ...filteredFeed.map(f => ({ pos: f.coords, type: 'donor', popup: f.donorName, sub: `${f.foodType} · ${f.quantity || f.splitAvail} meals` })),
    ...transitStops.slice(0, 3).map(t => ({ pos: [RECEIVER_CENTER[0] + 0.01, RECEIVER_CENTER[1] + 0.01], type: 'bus', popup: t.name, sub: t.routes.join(', ') })),
    ...(trackingActive ? [{ pos: [17.36, 78.48], type: 'volunteer', popup: 'Volunteer — En Route', sub: 'ETA: 12 min' }] : []),
  ];

  const urgColor = { high: 'var(--warning)', medium: 'var(--accent)', low: 'var(--secondary)', critical: 'var(--danger)' };

  return (
    <DashboardLayout role="receiver">
      <AnimatePresence>
        {showPayment && <PaymentModal order={activeOrder} onClose={() => setShowPayment(false)} onPay={() => { 
          setShowPayment(false); 
          updateReceiverReception('r1');
          addNotification({ type: 'match', title: '💳 Payment Done', message: 'Rapido Bike booked. Tracking active.', urgency: 'low' }); 
        }} />}
        {showEmergency && <EmergencyModal onSubmit={() => {}} onClose={() => setShowEmergency(false)} />}
        {showReturn && (
          <div className="modal-overlay" onClick={() => setShowReturn(null)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <button onClick={() => setShowReturn(null)} style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="btn btn-ghost btn-sm"><X size={16} /></button>
              <RotateCcw size={28} color="var(--warning)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Return / Spoiled Food Options</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--foreground-muted)', marginBottom: '1rem' }}>
                This food appears to be spoiled or unsuitable. Choose what to do:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => setShowReturn(null)}>
                  <RotateCcw size={16} /> Return to Donor (with feedback)
                </button>
                {spoilEndpoints.map((ep, i) => (
                  <button key={i} className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => {
                    addNotification({ type: 'alert', title: '🐷 Spoiled Rerouted', message: `Food sent to ${ep.name}`, urgency: 'medium' });
                    setShowReturn(null);
                  }}>
                    {ep.type === 'pig_farm' ? '🐷' : '🌱'} Send to {ep.name} <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>{ep.distance}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
            🤝 Receiver Portal — <span style={{ color: 'var(--secondary)' }}>Phase 2</span>
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
            Ashrams · NGOs · Slum Colonies · Low-wage Communities
          </p>
        </div>
        <button className="btn btn-danger btn-lg" onClick={() => setShowEmergency(true)}>
          <Activity size={18} /> Emergency Alert
        </button>
      </div>

      {/* My Location + Search */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <MapPin size={16} color="var(--secondary)" style={{ flexShrink: 0 }} />
        <select className="input" style={{ maxWidth: 240 }} value={myLocation.name} onChange={e => setMyLocation(RECEIVER_LOCATIONS.find(l => l.name === e.target.value))}>
          {RECEIVER_LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name} — {l.type}</option>)}
        </select>
        <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-muted)' }} />
          <input className="input" style={{ paddingLeft: '2rem' }} placeholder="Search donations by food or donor…"
            value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
        </div>
        <span className="badge badge-secondary">{myLocation.addr}</span>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Available Donations', val: filteredFeed.length, color: 'var(--secondary)', icon: '🍽️' },
          { label: 'Orders Today', val: 3, color: 'var(--primary)', icon: '✅' },
          { label: 'Meals Received', val: 142, color: 'var(--accent)', icon: '🤝' },
          { label: 'Trust Score', val: '95%', color: 'var(--secondary)', icon: '🛡️' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><div className="stat-value" style={{ color: s.color }}>{s.val}</div><div className="stat-label">{s.label}</div></div>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'feed', label: '🍽️ Food Feed', icon: ShoppingCart },
          { id: 'map', label: '🗺️ Track & Map', icon: Map },
          { id: 'notifs', label: '🔔 AI Alerts', icon: Bell },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-secondary' : 'btn-ghost'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Food Feed */}
      {tab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <AnimatePresence>
            {filteredFeed.map((food, i) => {
              const urgency = food.urgency || food.urgencyLevel || 'medium';
              return (
                <motion.div key={food.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }} className="glass-card"
                  style={{ padding: '1.25rem', borderLeft: `4px solid ${urgColor[urgency] || 'var(--secondary)'}` }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: `${urgColor[urgency]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                      🍛
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{food.foodType}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                            From: <b>{food.donorName}</b> ({food.donorType}) · {food.distance || 'Nearby'} · Trust: <span style={{ color: 'var(--secondary)' }}>{food.donorTrust || food.trustScore || 90}%</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: urgColor[urgency], marginTop: 2, fontWeight: 600 }}>⏱ {food.expiryLabel || 'Expires soon'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge badge-urgency-${urgency}`}>{urgency}</span>
                          <span className="badge badge-primary">AI Score: {food.score}%</span>
                          <span className="badge badge-secondary">{food.quantity || food.splitAvail} meals available</span>
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.6rem 0' }}>
                        {(food.ingredients || []).map((ing, j) => (
                          <span key={j} style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: 999, background: 'var(--glass)', border: '1px solid var(--border)' }}>{ing}</span>
                        ))}
                      </div>

                    {/* Source Location Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                      <Navigation size={12} color="var(--primary)" />
                      Source: <a href={`https://www.google.com/maps?q=${food.coords[0]},${food.coords[1]}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                        View on Google Maps ↗
                      </a>
                    </div>

                    {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { placeOrder(food, 'volunteer'); }}>
                          <Truck size={13} /> Volunteer (Free)
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => placeOrder(food, 'public')}>
                          🚌 Public Transport
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setActiveOrder(food); setShowPayment(true); }}>
                          <CreditCard size={13} /> Private / Rapido
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setTab('map')}>
                          <Map size={13} /> Track
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setShowReturn(food)}>
                          <RotateCcw size={13} /> Return
                        </button>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <RatingSystem initialRating={Math.round((food.score || 80) / 20)} trustScore={food.donorTrust || food.trustScore || 100} label="" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredFeed.length === 0 && (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              <Package size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No donations match your search. Try clearing the filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Map Tracking */}
      {tab === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Map size={16} color="var(--secondary)" /> Live Tracking Map
              </h3>
              {trackingActive && <span className="badge badge-secondary animate-pulse">🟢 Tracking Active</span>}
            </div>
            <div className="map-container" style={{ height: 420 }}>
              <LeafletMap center={RECEIVER_CENTER} zoom={13} markers={mapMarkers} height="420px" showSearch
                onLocationSearch={q => setLocationSearch(q)} showHeatmapLegend />
            </div>
            {/* Public Transit Stops */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>🚌 Fixed Public Transit Stops Nearby:</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {transitStops.map(s => (
                  <span key={s.name} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                    🚌 {s.name} ({s.distance})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {trackingActive && (
              <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'var(--secondary)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Navigation size={14} color="var(--secondary)" /> Active Delivery
                </h4>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}>Driver</span>
                    <span style={{ fontWeight: 600 }}>🚴 Ravi Kumar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}>ETA</span>
                    <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>~12 min</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}>Status</span>
                    <span className="badge badge-secondary">En Route</span>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem', gap: '0.4rem' }}>
                    <Phone size={13} /> Call Driver
                  </button>
                </div>
              </div>
            )}
            {/* Spoiled Return Options */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🐷 Spoiled Food Endpoints</h4>
              {spoilEndpoints.map((ep, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < spoilEndpoints.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ep.type === 'pig_farm' ? '🐷' : '🌱'} {ep.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>{ep.distance}</div>
                  </div>
                  <button className="btn btn-outline btn-sm">Route</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { title: '🎯 AI Match Found', msg: '120 meals of Wedding Biryani at 1.4km — Taj Krishna Hotel', urgency: 'high', time: '2 min ago', type: 'match' },
            { title: '🤖 AI Surplus Forecast', msg: 'Expect food surplus in Banjara Hills tonight. Reserve transport early.', urgency: 'medium', time: '1 hr ago', type: 'ai' },
            { title: '📦 Your Order Dispatched', msg: 'Mixed Veg Dal — Volunteer Ravi Kumar en route, ETA 14 min', urgency: 'low', time: '35 min ago', type: 'success' },
            { title: '🚨 Emergency Processed', msg: '3 donors notified. 150 meals rerouted to Mothinagar Slum Colony', urgency: 'critical', time: '3 hr ago', type: 'alert' },
          ].map((n, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className="notif-item" style={{ borderLeftColor: n.urgency === 'critical' ? 'var(--danger)' : n.urgency === 'high' ? 'var(--warning)' : 'var(--primary)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{n.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)', marginBottom: '0.3rem' }}>{n.msg}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--foreground-muted)' }}>{n.time}</div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
