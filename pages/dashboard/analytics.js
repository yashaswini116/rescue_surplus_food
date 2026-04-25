import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  BarChart3, TrendingUp, Network, Activity, Database,
  AlertTriangle, FileText, Cpu, Share2, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import { getAnalyticsData } from '../../services/store';
import { forecastSurplusZones } from '../../services/aiEngine';

const LeafletMap = dynamic(() => import('../../components/LeafletMap'), { ssr: false });

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(7,17,32,0.95)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--foreground)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const data = getAnalyticsData();
  const [surplusZones, setSurplusZones] = useState([]);
  const [liveLog, setLiveLog] = useState([
    { time: '12:41', event: 'HuggingFace flan-t5 extracted 12 ingredients from Donor #91 (Wedding Biryani)', type: 'llm' },
    { time: '12:38', event: 'Regression Check: Batch #41 (24hrs, room temp) → Score: 8.5% — Rerouted to Srinivas Pig Farm', type: 'alert' },
    { time: '12:35', event: 'Reverse Hunger Alert processed. 500 meals split → Sai Ashram (200), NGO (180), Slum (120)', type: 'info' },
    { time: '12:29', event: 'Rapido Private delivery confirmed for Transit #88. Payment: ₹89 collected.', type: 'payment' },
    { time: '12:15', event: 'VRP Optimizer assigned 3 volunteers to 5 pickups. Avg efficiency: 94.2%', type: 'llm' },
    { time: '12:01', event: 'Prophet Time-Series: Predicted 320-meal surplus in Banjara Hills (tonight 7–9pm)', type: 'info' },
  ]);

  useEffect(() => {
    forecastSurplusZones().then(setSurplusZones);
    // Simulate live log entries
    const t = setInterval(() => {
      const events = [
        { event: `AI matched Donor #${Math.floor(Math.random() * 99)} to ${Math.floor(Math.random() * 3) + 2} receivers.`, type: 'info' },
        { event: `TF Regression: Batch #${Math.floor(Math.random() * 99)} freshness score ${Math.floor(Math.random() * 40 + 60)}% — Safe.`, type: 'llm' },
        { event: `Volunteer Ravi Kumar completed delivery #${Math.floor(Math.random() * 20) + 40}. Meals saved: ${Math.floor(Math.random() * 80 + 40)}`, type: 'llm' },
      ];
      const pick = events[Math.floor(Math.random() * events.length)];
      const now = new Date();
      setLiveLog(prev => [{ time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, ...pick }, ...prev].slice(0, 12));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const mapMarkers = [
    ...surplusZones.map(z => ({
      pos: z.pos, type: 'heatmap',
      color: z.type === 'surplus' ? '#10b981' : z.type === 'deficit' ? '#ef4444' : '#f59e0b',
      radius: 2500 + z.intensity * 1500, popup: z.label, meals: z.meals
    })),
    { pos: [17.31, 78.50], type: 'pig_farm', popup: 'Srinivas Pig Farm' },
    { pos: [17.29, 78.54], type: 'agriculture', popup: 'Green Earth Compost' },
  ];

  const mealsData = data.monthlyImpact.map(d => ({ month: d.month, meals: d.meals, waste: d.waste }));
  const weekData = data.mealsPerDay.map((v, i) => ({ day: `D${i + 1}`, meals: v }));

  const logColor = { llm: 'var(--secondary)', alert: 'var(--danger)', info: 'var(--primary)', payment: 'var(--accent)' };
  const logIcon = { llm: <FileText size={13} />, alert: <AlertTriangle size={13} />, info: <Activity size={13} />, payment: <Database size={13} /> };

  return (
    <DashboardLayout role="donor">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
          📊 AI Analytics — <span style={{ color: 'var(--purple)' }}>Intelligence Layer</span>
        </h1>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
          Powered by HuggingFace · TensorFlow · Prophet · VRP Optimizer
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Donations', val: data.totalDonations.toLocaleString(), icon: '🍽️', color: 'var(--primary)', sub: '+12% this month' },
          { label: 'Meals Rescued', val: data.foodRescued.toLocaleString(), icon: '💚', color: 'var(--secondary)', sub: `${data.hungerAlerts} alerts resolved` },
          { label: 'Waste Reduced', val: `${data.wasteReduced}%`, icon: '📉', color: 'var(--accent)', sub: 'vs 40% baseline' },
          { label: 'Spoiled Rerouted', val: data.spoiledRerouted, icon: '🐷', color: 'var(--danger)', sub: 'To farms / compost' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>{s.sub}</div>
              </div>
              <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Monthly Meals Rescued */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={15} color="var(--primary)" /> Monthly Meals Rescued vs Waste Reduction
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mealsData}>
              <defs>
                <linearGradient id="meals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.5rem' }} />
              <Area type="monotone" dataKey="meals" name="Meals Rescued" stroke="#6366f1" fill="url(#meals)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="waste" name="Waste Reduced %" stroke="#10b981" fill="url(#waste)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Receiver Type Distribution */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Share2 size={15} color="var(--secondary)" /> Receiver Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.receiverTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {data.receiverTypes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Daily Meals (14 days) */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart3 size={15} color="var(--accent)" /> Daily Meals Rescued (Last 14 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="meals" name="Meals" radius={[4, 4, 0, 0]}>
                {weekData.map((_, i) => <Cell key={i} fill={`hsl(${240 + i * 8},80%,${55 + (i % 3) * 5}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transport Mode */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={15} color="var(--primary)" /> Transport Mode Split
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.transportModes} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {data.transportModes.map((_, i) => <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b'][i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Map + Live Logs */}
      <div className="grid-2">
        {/* Global Heatmap */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Network size={15} color="var(--secondary)" /> Global AI Routing Heatmap
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem' }}>
            Red = Hunger Deficit · Green = Surplus · Pig/Farm icons = Spoiled food endpoints
          </p>
          <div className="map-container" style={{ height: 320 }}>
            <LeafletMap center={[17.385, 78.4867]} zoom={11} markers={mapMarkers} height="320px" showHeatmapLegend />
          </div>

          {/* Impact Summary */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Surplus Zones', count: surplusZones.filter(z => z.type === 'surplus').length, color: 'var(--secondary)' },
              { label: 'Deficit Zones', count: surplusZones.filter(z => z.type === 'deficit').length, color: 'var(--danger)' },
              { label: 'Farm Endpoints', count: 2, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '0.5rem', borderRadius: 6, background: 'var(--glass)', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: s.color, fontSize: '1rem' }}>{s.count}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--foreground-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live AI Pipeline Log */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={15} color="var(--accent)" /> Live AI Pipeline Logs
            </h3>
            <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Live
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 440 }}>
            {liveLog.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                style={{
                  padding: '0.6rem 0.75rem', borderRadius: 6,
                  background: 'var(--glass)', borderLeft: `3px solid ${logColor[log.type]}`,
                  fontSize: '0.78rem'
                }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: logColor[log.type], marginTop: 1, flexShrink: 0 }}>{logIcon[log.type]}</span>
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--foreground-muted)' }}>[{log.time}]</span>
                    {' '}{log.event}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, background: 'rgba(0,0,0,0.2)', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', color: 'var(--foreground-muted)' }}>
            <span>🤗 HuggingFace NLP · TF Regression · Prophet</span>
            <span>Firestore Sync: Active ✓</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
