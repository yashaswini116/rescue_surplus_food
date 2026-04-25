'use client';
import { useEffect, useRef, useState } from 'react';

export default function LeafletMap({
  center = [17.385, 78.4867],
  zoom = 12,
  markers = [],
  height = '100%',
  showSearch = false,
  showHeatmapLegend = false,
  isLive = true,
  onLocationSearch
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Inject custom styles for pulsating markers
    if (!document.getElementById('map-live-styles')) {
      const style = document.createElement('style');
      style.id = 'map-live-styles';
      style.innerHTML = `
        @keyframes pulse-marker {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .live-pulse { animation: pulse-marker 2s infinite; }
        .moving-transporter { transition: transform 0.8s linear, all 0.8s linear; z-index: 1000 !important; }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const load = () => {
      if (document.getElementById('leaflet-script') && window.L) {
        initMap();
      } else if (!document.getElementById('leaflet-script')) {
        const script = document.createElement('script');
        script.id = 'leaflet-script';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        setTimeout(load, 200);
      }
    };
    load();

    function initMap() {
      if (mapRef.current || !containerRef.current || !window.L) return;
      const L = window.L;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©CartoDB',
        maxZoom: 19
      }).addTo(map);

      // Custom icons with live effects
      const getIcon = (type, isMoving = false) => {
        const icons = {
          donor: { emoji: '🍽️', color: '#6366f1' },
          receiver: { emoji: '🏢', color: '#10b981' },
          volunteer: { emoji: '🏍️', color: '#f59e0b' },
          transporter: { emoji: '🚚', color: '#8b5cf6' },
          pig_farm: { emoji: '🐷', color: '#ef4444' },
          agriculture: { emoji: '🌱', color: '#22c55e' },
          bus: { emoji: '🚌', color: '#3b82f6' }
        };
        const config = icons[type] || { emoji: '📍', color: '#94a3b8' };
        
        return L.divIcon({
          className: '',
          html: `
            <div class="${type === 'transporter' ? 'moving-transporter' : 'live-pulse'}" style="
              background: ${config.color}; 
              width: 32px; height: 32px; 
              border-radius: 50%; border: 3px solid white; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              color: white; font-weight: bold;
            ">
              ${config.emoji}
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
      };

      markers.forEach(m => {
        if (m.type === 'heatmap') {
          L.circle(m.pos, {
            color: m.color || '#ef4444',
            fillColor: m.color || '#ef4444',
            fillOpacity: 0.15,
            radius: m.radius || 3000,
            weight: 1
          }).addTo(map).bindPopup(`<b>${m.popup || 'Zone'}</b>${m.meals ? `<br/>${m.meals} meals` : ''}`);
        } else {
          L.marker(m.pos, { icon: getIcon(m.type) })
            .addTo(map)
            .bindPopup(`<div style="font-family:Inter,sans-serif;min-width:140px">
              <div style="font-weight:900;margin-bottom:4px">${m.popup || 'Point'}</div>
              ${m.sub ? `<div style="font-size:0.75rem;opacity:0.8">${m.sub}</div>` : ''}
              <div style="font-size:0.65rem;color:var(--primary);margin-top:6px;font-weight:700">📡 LIVE DATA CONNECTION</div>
            </div>`);
        }
      });

      // Process live routes
      const activePoints = markers.filter(m => m.type !== 'heatmap' && m.pos);
      if (activePoints.length >= 2) {
        L.polyline(activePoints.map(m => m.pos), {
          color: '#6366f1',
          weight: 4,
          opacity: 0.4,
          dashArray: '1, 10',
          lineCap: 'round'
        }).addTo(map);

        // Add a "flow" animation using a secondary polyline
        const flowLine = L.polyline(activePoints.map(m => m.pos), {
          color: '#8b5cf6',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 20',
          lineCap: 'round'
        }).addTo(map);

        let offset = 0;
        const animate = () => {
          offset = (offset + 1) % 30;
          flowLine.setStyle({ dashOffset: -offset });
          requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [JSON.stringify(center), zoom, JSON.stringify(markers)]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onLocationSearch) onLocationSearch(searchQuery);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: height || '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
      {showSearch && (
        <form className="map-search-bar" onSubmit={handleSearch} style={{ zIndex: 1000, position: 'absolute', top: 10, left: 10 }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Locate Sector..."
            style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', color: 'white' }}
          />
        </form>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
      
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="map-badge" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)', backdropFilter: 'blur(10px)', color: '#818cf8', fontSize: '0.65rem', padding: '4px 8px', borderRadius: 6, fontWeight: 800 }}>
          📡 AI SATELLITE ACTIVE
        </div>
        <div className="map-badge" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)', backdropFilter: 'blur(10px)', color: '#34d399', fontSize: '0.65rem', padding: '4px 8px', borderRadius: 6, fontWeight: 800 }}>
          🟢 {markers.length} NODES CONNECTED
        </div>
      </div>

      {showHeatmapLegend && (
        <div className="heatmap-legend" style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, padding: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div className="legend-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="legend-dot" style={{width:8, height:8, borderRadius:'50%', background:'#ef4444'}}></div>
            <span style={{fontSize:'0.65rem', color: 'white'}}>Demand Deficit</span>
          </div>
          <div className="legend-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="legend-dot" style={{width:8, height:8, borderRadius:'50%', background:'#10b981'}}></div>
            <span style={{fontSize:'0.65rem', color: 'white'}}>Surplus Zone</span>
          </div>
        </div>
      )}
    </div>
  );
}
