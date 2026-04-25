import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Truck, Cpu, Clock, Gift, Star, Navigation, Package,
  TrendingUp, Bell, Zap, CheckCircle, X, Phone, MapPin, AlertTriangle, UserPlus, Users
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import RatingSystem from '../../components/RatingSystem';
import { optimizeVolunteerRoutes, optimizeVolunteerSelection } from '../../services/aiEngine';
import { getStore, addNotification, addVolunteer } from '../../services/store';

const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { ssr: false });

const VOL_CENTER = [17.41, 78.45];

const MOCK_PICKUPS = [
  { id: 'pk1', foodType: 'Wedding Biryani', quantity: 120, donorName: 'Taj Krishna Hotel', donorAddr: 'Banjara Hills', receiverName: 'Sai Ashram', receiverAddr: 'Dilsukhnagar', urgency: 'critical', expiryHours: 1.5, incentive: 120, pickupCoords: [17.385, 78.4867], dropCoords: [17.35, 78.43], distance: '4.2 km', estimatedTime: 18, efficiency: 96.2, isLarge: true },
  { id: 'pk2', foodType: 'Dal Tadka + Roti', quantity: 60, donorName: 'Anna Canteen', donorAddr: 'JNTU Kukatpally', receiverName: 'Helping Hands NGO', receiverAddr: 'Kukatpally', urgency: 'high', expiryHours: 3, incentive: 70, pickupCoords: [17.44, 78.38], dropCoords: [17.47, 78.41], distance: '2.1 km', estimatedTime: 12, efficiency: 92.5, isLarge: false },
  { id: 'pk3', foodType: 'Paneer Masala', quantity: 45, donorName: 'Paradise Restaurant', donorAddr: 'Abids', receiverName: 'Day Labor Hub', receiverAddr: 'Secunderabad', urgency: 'medium', expiryHours: 4, incentive: 50, pickupCoords: [17.36, 78.52], dropCoords: [17.44, 78.50], distance: '5.8 km', estimatedTime: 25, efficiency: 88.1, isLarge: false },
];

export default function VolunteerDashboard() {
  const [tab, setTab] = useState('missions');
  const [pickups] = useState(MOCK_PICKUPS);
  const [myTasks, setMyTasks] = useState([]);
  const [optimized, setOptimized] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedPickups, setOptimizedPickups] = useState(pickups);
  const [credits] = useState(1450);
  const [completedDeliveries] = useState(15);
  const [transporterLoc, setTransporterLoc] = useState(null);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({ name: '', zone: 'Banjara Hills', vehicle: 'Bike' });
  const [vols, setVols] = useState([]);

  useEffect(() => {
    setVols(getStore().volunteers);
  }, []);

  // Live Travel Detector Loop
  useEffect(() => {
    const activeTask = myTasks.find(t => t.status === 'accepted' || t.status === 'in_transit');
    if (!activeTask) {
      setTransporterLoc(null);
      return;
    }

    const start = activeTask.pickupCoords;
    const end = activeTask.dropCoords;
    let progress = 0;
    
    setTransporterLoc(start);

    const moveInterval = setInterval(() => {
      progress += 0.05; 
      if (progress > 1) {
        setTransporterLoc(end);
        clearInterval(moveInterval);
      } else {
        const lat = start[0] + (end[0] - start[0]) * progress;
        const lng = start[1] + (end[1] - start[1]) * progress;
        setTransporterLoc([lat, lng]);
      }
    }, 1500);

    return () => clearInterval(moveInterval);
  }, [myTasks]);

  const handleOptimize = async (e) => {
    e.preventDefault();
    setOptimizing(true);
    
    const mission = { coords: VOL_CENTER, foodType: 'Urgent Pickup' };
    const candidates = getStore().volunteers.map(v => ({
      ...v,
      availableSince: Date.now() - Math.random() * 10000000 
    }));

    const bestVol = await optimizeVolunteerSelection(mission, candidates);
    const sortedPickups = await optimizeVolunteerRoutes(candidates, pickups);
    
    setOptimizedPickups(sortedPickups);
    setOptimized(true);
    setOptimizing(false);
    
    addNotification({ 
      type: 'ai', 
      title: '🤖 Selection Logic Applied', 
      message: `Best Volunteer: ${bestVol?.name || 'Searching...'}. Routes Optimized.`, 
      urgency: 'low' 
    });
  };

  const registerVolunteer = async (e) => {
    e.preventDefault();
    const newVol = await addVolunteer({ ...regForm, coords: [17.41 + Math.random() * 0.05, 78.45 + Math.random() * 0.05] });
    setVols([...getStore().volunteers]);
    setRegForm({ name: '', zone: 'Banjara Hills', vehicle: 'Bike' });
    addNotification({ type: 'success', title: '🎉 Welcome!', message: `${newVol.name} added to the rescue force!`, urgency: 'medium' });
  };

  const acceptTask = (task) => {
    if (myTasks.length > 0) {
      addNotification({ type: 'alert', title: '⚠️ Mission Limit', message: 'Please complete your active delivery before accepting another.', urgency: 'high' });
      return;
    }
    setMyTasks([{ ...task, status: 'accepted' }]);
    addNotification({ type: 'task', title: '📦 Mission Started', message: `Proceeding to ${task.donorName} for ${task.foodType}`, urgency: 'medium' });
  };

  const mapMarkers = [
    { pos: VOL_CENTER, type: 'volunteer_active', popup: 'Your Position' },
    ...pickups.map(p => ({ pos: p.pickupCoords, type: 'donor', popup: p.donorName, sub: p.foodType })),
    ...(transporterLoc ? [{ pos: transporterLoc, type: 'volunteer', popup: 'Transporter', sub: 'In Transit' }] : []),
  ];

  return (
    <DashboardLayout role="volunteer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
             Volunteer Force — <span style={{ color: 'var(--accent)' }}>Phase 3</span>
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
            Real-time rescue logistics & dynamic routing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="stat-card" style={{ padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>CREDITS</div>
            <div style={{ fontWeight: 800, color: 'var(--accent)' }}>{credits}</div>
          </div>
          <div className="stat-card" style={{ padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>DELIVERIES</div>
            <div style={{ fontWeight: 800 }}>{completedDeliveries}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'missions', label: '🚚 Missions', icon: Truck },
          { id: 'tracking', label: '🗺️ Ops Center', icon: Navigation },
          { id: 'registry', label: '👥 Team Queue', icon: Users },
          { id: 'credits', label: '🏆 Rewards', icon: Gift },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-accent' : 'btn-ghost'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid-sidebar">
        <main>
          {tab === 'missions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={handleOptimize} disabled={optimizing} className="btn btn-accent btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                {optimizing ? '🤖 AI Calculating Routes...' : <><Zap size={18} /> Apply AI Route Optimization</>}
              </button>
              
              {optimized && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                  style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.05)', border: '1px dashed var(--secondary)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={14} /> Efficiency Gain: +24% vs manual routing. Sequence re-ordered by AI.
                </motion.div>
              )}

              {(optimized ? optimizedPickups : pickups).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${p.urgency === 'critical' ? 'var(--danger)' : 'var(--accent)'}` }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      {p.isLarge ? '🚛' : '📦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.foodType}</div>
                        <span className={`badge ${p.urgency === 'critical' ? 'badge-danger' : 'badge-accent'}`}>{p.urgency}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>📍 <b>Pickup:</b> {p.donorName}</div>
                        <div>🏁 <b>Drop:</b> {p.receiverName}</div>
                        <div style={{ color: 'var(--accent)' }}>⏱ {p.estimatedTime} min · {p.distance}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>💎 Incentive: {p.incentive} CR</div>
                      </div>
                      
                      {optimized && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.6rem', background: 'var(--glass)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <TrendingUp size={12} color="var(--secondary)" /> AI Confidence Score: <b>{p.efficiency}%</b>
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-accent btn-sm" onClick={() => acceptTask(p)}>Confirm Mission</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => window.open(`https://maps.google.com/?q=${p.pickupCoords[0]},${p.pickupCoords[1]}`)}>Map View</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'tracking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '0.75rem', height: 450 }}>
                <LeafletMap center={VOL_CENTER} zoom={13} markers={mapMarkers} height="435px" />
              </div>
              
              {myTasks.length > 0 && (
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                     <h3 style={{ fontWeight: 800 }}>🛰️ Live Mission Progress</h3>
                     <span className="badge badge-accent animate-pulse">In Transit</span>
                   </div>
                   <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.75rem' }}>
                     <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} style={{ height: '100%', background: 'var(--accent)' }} />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                     <span>{myTasks[0].donorName}</span>
                     <span>ETA: 8 min</span>
                     <span>{myTasks[0].receiverName}</span>
                   </div>
                </div>
              )}
            </div>
          )}

          {tab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Registration Form */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} color="var(--accent)" /> Join the Rescue Force
                </h3>
                <form onSubmit={registerVolunteer} style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>FULL NAME</label>
                    <input className="input" placeholder="Enter volunteer name..." value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>PRIMARY ZONE</label>
                      <select className="input" value={regForm.zone} onChange={e => setRegForm({...regForm, zone: e.target.value})}>
                        <option>Banjara Hills</option>
                        <option>Kukatpally</option>
                        <option>Jubilee Hills</option>
                        <option>Madapur</option>
                        <option>Secunderabad</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>VEHICLE TYPE</label>
                      <select className="input" value={regForm.vehicle} onChange={e => setRegForm({...regForm, vehicle: e.target.value})}>
                        <option>Bike</option>
                        <option>Scooter</option>
                        <option>Car/Van</option>
                        <option>Bicycle</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-accent btn-lg" style={{ marginTop: '0.5rem' }}>
                    Register Application
                  </button>
                </form>
              </div>

              {/* Volunteers Queue */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--secondary)" /> Force Registry Queue
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {vols.map((v, i) => (
                    <div key={v.id} className="glass-card" style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {v.name ? v.name[0] : '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>{v.zone} · {v.vehicle}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)' }}>{v.trustScore}%</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--foreground-muted)' }}>Trust Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'credits' && (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Gift size={40} color="var(--warning)" />
              </div>
              <h2 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Reward Central</h2>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
                Redeem your hard-earned credits for fuel vouchers, food coupons, or donate them back to local NGOs.
              </p>
              <div className="grid-2" style={{ gap: '1rem' }}>
                {[
                  { name: 'Petrol Voucher', cost: 500, img: '⛽' },
                  { name: 'Amazon Gift Card', cost: 1200, img: '📦' },
                  { name: 'Zomato Pro', cost: 800, img: '🍕' },
                  { name: 'Toll Pass', cost: 300, img: '🛣️' },
                ].map(r => (
                  <div key={r.name} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{r.img}</div>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>{r.cost} CR</div>
                    <button className="btn btn-outline btn-sm">Redeem</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <aside>
          <div className="glass-card" style={{ padding: '1.25rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>⚡ Live Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', letterSpacing: '0.05em' }}>TRUST RATING</div>
                <div style={{ display: 'flex', gap: '2px', marginTop: '0.2rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="var(--warning)" color="var(--warning)" />)}
                  <span style={{ marginLeft: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>4.9</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', letterSpacing: '0.05em' }}>ACTIVE FORCE</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--secondary)' }}>{vols.length} Registered</div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}><Clock size={14} /> History</button>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}><Bell size={14} /> Alerts</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
