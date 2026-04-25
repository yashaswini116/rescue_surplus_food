import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Plus, Brain, MapPin, Sparkles, Leaf, Utensils, AlertTriangle,
  Truck, Package, Clock, ChevronDown, X, Check, Eye, Zap, Search
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import RatingSystem from '../../components/RatingSystem';
import {
  extractIngredientsLLM, predictFreshnessRegression,
  forecastSurplusZones, computeSplitDistribution,
  fetchNearbyDonorTypes, fetchSpoiledFoodEndpoints,
  fetchNearbyTransitStops
} from '../../services/aiEngine';
import { getStore, addDonation, addNotification } from '../../services/store';

const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { ssr: false });

const DONOR_CENTER = [17.385, 78.4867];

function QualityMeter({ score }) {
  const clr = score > 70 ? 'var(--secondary)' : score > 40 ? 'var(--accent)' : 'var(--danger)';
  const r = 28, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width={70} height={70} viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={35} cy={35} r={r} fill="none" stroke={clr} strokeWidth={6}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${clr})` }} />
      <text x={35} y={35} textAnchor="middle" dominantBaseline="central"
        style={{ fill: clr, fontSize: '13px', fontWeight: 900, fontFamily: 'Inter', transform: 'rotate(90deg)', transformOrigin: '35px 35px' }}>
        {score}
      </text>
    </svg>
  );
}

function SplitBar({ segments }) {
  return (
    <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 999, overflow: 'hidden' }}>
      {segments.map((s, i) => (
        <div key={i} style={{ flex: s.percentage, background: ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--danger)', 'var(--purple)'][i % 5], borderRadius: 999, transition: 'flex 0.6s ease' }} title={`${s.name}: ${s.allocated} meals`} />
      ))}
    </div>
  );
}

function AlertModal({ type, data, onClose }) {
  if (!data) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="btn btn-ghost btn-sm"><X size={16} /></button>
        {type === 'spoil' && (
          <>
            <AlertTriangle size={28} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚠️ Food Spoilage Detected</h3>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Quality score: <b style={{ color: 'var(--danger)' }}>{data.score}%</b>. This batch is below safe consumption threshold.
            </p>
            <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>Choose disposal route:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.endpoints?.map((ep, i) => (
                <button key={i} onClick={onClose} className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                  {ep.type === 'pig_farm' ? '🐷' : '🌱'} {ep.name} <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{ep.distance}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {type === 'ingredients' && (
          <>
            <Brain size={28} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>🧬 AI-Detected Ingredients</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {data.ingredients?.map((ing, i) => (
                <span key={i} className="badge badge-primary">{ing}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginBottom: '1rem' }}>Add custom ingredients below:</p>
            <input className="input" placeholder="e.g. peanut butter, sesame, gluten…" style={{ marginBottom: '0.75rem' }} />
            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>Save & Continue</button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLog, setAnalysisLog] = useState([]);
  const [surplusZones, setSurplusZones] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [transitStops, setTransitStops] = useState([]);
  const [spoilEndpoints, setSpoilEndpoints] = useState([]);
  const [modal, setModal] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);

  const [form, setForm] = useState({
    foodType: '', quantity: '', cookingTime: '', expiryHours: '4',
    storageCondition: 'room_temp', rawIngredients: '', extraIngredients: '', 
    preferredTransport: 'volunteer', donorType: 'Hotel', donorName: ''
  });
  const [llmResult, setLlmResult] = useState(null);
  const [qualityResult, setQualityResult] = useState(null);

  useEffect(() => {
    // Load store data
    setDonations(getStore().donations.filter(d => d.donorId?.startsWith('donor')));
    // Load AI data
    forecastSurplusZones().then(setSurplusZones);
    fetchNearbyDonorTypes(...DONOR_CENTER).then(setNearbyHotels);
    fetchNearbyTransitStops().then(setTransitStops);
    fetchSpoiledFoodEndpoints().then(setSpoilEndpoints);
  }, []);

  const log = (msg) => setAnalysisLog(prev => [...prev, { msg, time: new Date().toLocaleTimeString() }]);

  const handleDonate = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisLog([]);
    setLlmResult(null);
    setQualityResult(null);

    log('▸ Starting AI pipeline...');
    await new Promise(r => setTimeout(r, 300));

    log('▸ HuggingFace flan-t5 — parsing ingredients...');
    const aiIngredients = await extractIngredientsLLM(form.rawIngredients || form.foodType);
    
    // Combine AI ingredients with manually entered extra ingredients
    const manualList = form.extraIngredients.split(/[,]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
    const ingredients = [...new Set([...aiIngredients, ...manualList])];
    
    setLlmResult(ingredients);
    log(`  ↳ Found ${aiIngredients.length} core and ${manualList.length} extra ingredients`);

    log('▸ TF Regression — computing freshness score...');
    const quality = await predictFreshnessRegression(form);
    setQualityResult(quality);
    log(`  ↳ Score: ${quality.score}% | Safe: ${quality.isSafe ? 'Yes' : 'No'}`);

    log('▸ Split Distribution Engine — allocating to receivers...');
    const receivers = getStore().receivers.slice(0, 3);
    const splits = await computeSplitDistribution(parseInt(form.quantity) || 50, receivers);
    log(`  ↳ Split to ${splits.length} zones`);

    const urgency = !quality.isSafe ? 'critical' : quality.score < 60 ? 'high' : 'medium';
    const isSpoiled = !quality.isSafe;

    const newDonation = {
      id: 'new_' + Math.random().toString(36).slice(2),
      ...form,
      donorId: 'donor1',
      status: isSpoiled ? 'routed_to_farm' : 'pending',
      urgencyLevel: urgency,
      isSpoiled,
      ingredients,
      score: quality.score,
      dsConfidence: `${quality.confidence}%`,
      transport: isSpoiled ? 'Pig Farm Routing' : form.preferredTransport,
      splitDistribution: isSpoiled ? [] : splits,
      coords: [DONOR_CENTER[0] + (Math.random() - 0.5) * 0.05, DONOR_CENTER[1] + (Math.random() - 0.5) * 0.05],
      createdAt: new Date().toISOString(),
      rating: 0, trustScore: 92
    };

    addDonation(newDonation);
    setDonations(prev => [newDonation, ...prev]);

    if (isSpoiled) {
      setTimeout(() => setModal({ type: 'spoil', data: { score: quality.score, endpoints: spoilEndpoints } }), 500);
    }

    addNotification({
      type: 'match',
      title: '✅ Donation Added',
      message: `${form.foodType} (${form.quantity} meals) submitted. AI matched to ${isSpoiled ? 'farm endpoints' : splits.length + ' receivers'}.`,
      urgency: urgency
    });

    log('✅ Done! Donation live.');
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowForm(false);
      setForm({ foodType: '', quantity: '', cookingTime: '', expiryHours: '4', storageCondition: 'room_temp', rawIngredients: '', extraIngredients: '', preferredTransport: 'volunteer', donorType: 'Hotel', donorName: '' });
    }, 800);
  };

  // Build map markers
  const mapMarkers = [
    { pos: DONOR_CENTER, type: 'donor', popup: 'You (Donor)' },
    ...surplusZones.map(z => ({
      pos: z.pos, type: 'heatmap',
      color: z.type === 'surplus' ? '#10b981' : z.type === 'deficit' ? '#ef4444' : '#f59e0b',
      radius: 3000 + z.intensity * 1000, popup: z.label, meals: z.meals
    })),
    ...spoilEndpoints.map(ep => ({ pos: ep.coords, type: ep.type, popup: ep.name, sub: ep.distance })),
  ];

  const urgColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--accent)', low: 'var(--secondary)' };

  return (
    <DashboardLayout role="donor">
      <AnimatePresence>{modal && <AlertModal {...modal} onClose={() => setModal(null)} />}</AnimatePresence>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
            🍽️ Donor Dashboard — <span style={{ color: 'var(--primary)' }}>Phase 1</span>
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
            Hotels · Convention Halls · Hostels · Temples · Restaurants
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-lg" disabled={isAnalyzing}
          style={{ gap: '0.5rem' }}>
          {isAnalyzing ? <><Brain size={18} className="animate-spin" /> Analyzing…</> : <><Plus size={18} /> Add Donation</>}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Donations', val: donations.length + 15, icon: '🍽️', color: 'var(--primary)' },
          { label: 'Meals Saved', val: donations.reduce((s, d) => s + (parseInt(d.quantity) || 0), 0) + 892, icon: '💚', color: 'var(--secondary)' },
          { label: 'Spoiled Rerouted', val: donations.filter(d => d.isSpoiled).length + 3, icon: '🐷', color: 'var(--danger)' },
          { label: 'Trust Score', val: '96%', icon: '🛡️', color: 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Nearby Hotels */}
      <div className="grid-2" style={{ marginBottom: '1.5rem', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--primary)" /> AI Surplus Heatmap
            </h3>
            <span className="badge badge-secondary">Live Forecast</span>
          </div>
          <div className="map-container" style={{ height: 280 }}>
            <LeafletMap center={DONOR_CENTER} zoom={12} markers={mapMarkers} height="280px" showHeatmapLegend />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={16} color="var(--primary)" /> Nearby Donor Establishments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {nearbyHotels.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.65rem 0.75rem', borderRadius: 8, background: 'var(--glass)',
                border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onClick={() => setForm(f => ({ ...f, donorName: h.name, donorType: h.type }))}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', marginTop: 2 }}>{h.type} · {h.distance}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{h.trustScore}% Trust</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer' }}>+ Select</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={20} color="var(--primary)" /> AI Donation Form
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleDonate}>
              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Donor Type</label>
                  <select className="input" value={form.donorType} onChange={e => setForm(f => ({ ...f, donorType: e.target.value }))}>
                    {['Hotel', 'Restaurant', 'Convention Hall', 'Hostel', 'Temple / Religious', 'Ashram', 'Corporate Canteen', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Establishment Name</label>
                  <input className="input" placeholder="e.g. Taj Krishna Hotel" value={form.donorName}
                    onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Food Item Name</label>
                  <input className="input" placeholder="e.g. Wedding Biryani, Dal Rice…" value={form.foodType} required
                    onChange={e => setForm(f => ({ ...f, foodType: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Number of Meals</label>
                  <input className="input" type="number" min={1} placeholder="e.g. 150" value={form.quantity} required
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Core Ingredients (AI Auto-Detect)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <textarea className="input" rows={2} placeholder="e.g. biryani with chicken, saffron rice, cooked at 11am..."
                      value={form.rawIngredients} onChange={e => setForm(f => ({ ...f, rawIngredients: e.target.value }))} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-outline" style={{ alignSelf: 'flex-end' }}
                      onClick={async () => {
                        const ing = await extractIngredientsLLM(form.rawIngredients || form.foodType);
                        setModal({ type: 'ingredients', data: { ingredients: ing } });
                      }}>
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Extra Ingredients / Allergens (Manual Entry)</label>
                  <textarea className="input" rows={1} placeholder="e.g. peanuts, extra salt, spicy, gluten-free..."
                    value={form.extraIngredients} onChange={e => setForm(f => ({ ...f, extraIngredients: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Time Since Cooking</label>
                  <select className="input" value={form.expiryHours} onChange={e => setForm(f => ({ ...f, expiryHours: e.target.value }))}>
                    <option value="1">Just Cooked (&lt;1hr)</option>
                    <option value="3">2–3 hours ago</option>
                    <option value="6">Half day (~6hrs)</option>
                    <option value="12">12 hours ago</option>
                    <option value="24">24 hours (Spoil Test)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Storage Condition</label>
                  <select className="input" value={form.storageCondition} onChange={e => setForm(f => ({ ...f, storageCondition: e.target.value }))}>
                    <option value="room_temp">Room Temperature</option>
                    <option value="refrigerated">Refrigerated</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
                <div>
                  <label className="label">Transport Mode</label>
                  <select className="input" value={form.preferredTransport} onChange={e => setForm(f => ({ ...f, preferredTransport: e.target.value }))}>
                    <option value="volunteer">Volunteer (Free · Credits)</option>
                    <option value="public">Public Transport</option>
                    <option value="private">Private / Rapido (Paid)</option>
                  </select>
                </div>
                {form.preferredTransport === 'public' && (
                  <div>
                    <label className="label">Nearby Transit Stops</label>
                    <select className="input">
                      {transitStops.map(s => <option key={s.name}>{s.name} ({s.distance}) — {s.routes.join(', ')}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* AI Analysis Log */}
              {analysisLog.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                    <Sparkles size={14} /> AI Pipeline Running…
                  </div>
                  {analysisLog.map((l, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', opacity: 0.85, lineHeight: 1.6 }}>
                      <span style={{ color: 'var(--foreground-muted)' }}>[{l.time}] </span>{l.msg}
                    </div>
                  ))}
                  {llmResult && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {llmResult.map((ing, i) => <span key={i} className="badge badge-primary">{ing}</span>)}
                    </div>
                  )}
                  {qualityResult && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <QualityMeter score={qualityResult.score} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: qualityResult.isSafe ? 'var(--secondary)' : 'var(--danger)' }}>
                          {qualityResult.isSafe ? '✅ Safe for consumption' : '❌ Not safe — routing to farm'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                          Risk: {qualityResult.riskLevel} · Confidence: {qualityResult.confidence}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isAnalyzing}>
                  {isAnalyzing ? <><Brain size={16} className="animate-spin" /> Running AI Pipeline…</> : <><Zap size={16} /> Submit to AI Distribution</>}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donations List */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Donations</h2>
        <span style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>{donations.length} entries</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence>
          {donations.map((d, i) => (
            <motion.div key={d.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }} className="glass-card"
              style={{ padding: '1.25rem', borderLeft: `4px solid ${d.isSpoiled ? 'var(--danger)' : urgColor[d.urgencyLevel] || 'var(--primary)'}` }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Quality circle */}
                <div style={{ flexShrink: 0 }}>
                  <QualityMeter score={Math.round(d.score || 75)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {d.isSpoiled ? <Leaf size={14} color="var(--danger)" /> : <Utensils size={14} color="var(--secondary)" />}
                        {d.foodType}
                        <span className={`badge badge-urgency-${d.urgencyLevel}`}>{d.urgencyLevel}</span>
                        {d.isSpoiled && <span className="badge badge-danger">SPOILED</span>}
                        <span className="badge badge-primary"><Brain size={10} /> {d.dsConfidence}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)', marginTop: 2 }}>
                        {d.donorName || 'Your Establishment'} · {d.quantity} meals · Transport: <b style={{ color: 'var(--accent)' }}>{d.transport}</b>
                      </div>
                    </div>
                    {!d.isSpoiled && <div style={{ flexShrink: 0 }}>
                      <RatingSystem initialRating={Math.round(d.rating || 4)} trustScore={d.trustScore || 92} label="Rate" />
                    </div>}
                  </div>

                  {/* Ingredients */}
                  {d.ingredients?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {d.ingredients.slice(0, 6).map((ing, j) => <span key={j} style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: 999, background: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>{ing}</span>)}
                      {d.ingredients.length > 6 && <span style={{ fontSize: '0.68rem', color: 'var(--primary)' }}>+{d.ingredients.length - 6} more</span>}
                    </div>
                  )}

                  {/* Split Distribution */}
                  {d.splitDistribution?.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', marginBottom: '0.3rem' }}>
                        Auto-Split Distribution:
                      </div>
                      <SplitBar segments={d.splitDistribution} />
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {d.splitDistribution.map((s, j) => (
                          <span key={j} style={{ fontSize: '0.68rem', color: 'var(--foreground-muted)' }}>
                            {['🔵','🟢','🟡','🔴','🟣'][j]} {s.name}: <b style={{ color: 'var(--foreground)' }}>{s.allocated}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spoiled routing */}
                  {d.isSpoiled && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.78rem', color: 'var(--danger)' }}>
                      <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Auto-routing to nearest pig farm / agriculture composting center
                      <button className="btn btn-danger btn-sm" style={{ marginLeft: '0.75rem', padding: '0.2rem 0.6rem' }}
                        onClick={() => setModal({ type: 'spoil', data: { score: d.score, endpoints: spoilEndpoints } })}>
                        View Endpoints
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
