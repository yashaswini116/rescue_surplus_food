'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingSystem({ initialRating = 0, trustScore = 95, onRate, label = 'Rate this' }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initialRating);

  const handleRate = (val) => {
    setSelected(val);
    if (onRate) onRate(val);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>{label}</span>
        <div className="star-rating">
          {[1,2,3,4,5].map(i => (
            <Star
              key={i}
              size={18}
              fill={(hovered || selected) >= i ? 'var(--accent)' : 'none'}
              color={(hovered || selected) >= i ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => handleRate(i)}
              style={{ cursor: 'pointer', transition: 'all 0.1s' }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
          {selected || initialRating}/5
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: trustScore >= 90 ? 'var(--secondary)' : trustScore >= 70 ? 'var(--accent)' : 'var(--danger)'
        }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>Trust Score: </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: trustScore >= 90 ? 'var(--secondary)' : trustScore >= 70 ? 'var(--accent)' : 'var(--danger)'
        }}>{trustScore}%</span>
      </div>
    </div>
  );
}
