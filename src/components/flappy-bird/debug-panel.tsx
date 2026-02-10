// ============================================
// DEBUG PANEL — dev-only, hidden in production
// ============================================

import { useState, useCallback } from 'react';
import type { DebugOverrides } from './types';
import { GAME_CONFIG } from './config';

interface DebugPanelProps {
  overrides: DebugOverrides;
  onChange: (overrides: DebugOverrides) => void;
  fps: number;
  score: number;
  speed: number;
  onCompleteWord: () => void;
  onUnlockAll: () => void;
}

const DebugPanel = ({
  overrides,
  onChange,
  fps,
  score,
  speed,
  onCompleteWord,
  onUnlockAll,
}: DebugPanelProps) => {
  const [open, setOpen] = useState(false);

  const set = useCallback(
    (key: keyof DebugOverrides, value: number | boolean | null) => {
      onChange({ ...overrides, [key]: value });
    },
    [overrides, onChange],
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: 6,
          left: 6,
          background: 'rgba(0,0,0,0.6)',
          color: '#00ff88',
          border: '1px solid rgba(0,255,136,0.3)',
          borderRadius: '3px',
          padding: '3px 8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        DEBUG ({fps} fps)
      </button>
    );
  }

  const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    fontSize: '10px',
  };

  const label: React.CSSProperties = {
    color: '#aaa',
    minWidth: '52px',
    fontFamily: 'monospace',
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 6,
        left: 6,
        background: 'rgba(0,0,0,0.85)',
        color: '#00ff88',
        border: '1px solid rgba(0,255,136,0.3)',
        borderRadius: '4px',
        padding: '8px 10px',
        zIndex: 20,
        fontFamily: 'monospace',
        fontSize: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2px',
        }}
      >
        <span style={{ color: '#00ff88', fontWeight: 700 }}>
          DEBUG | {fps} fps | Score: {score} | Spd: {speed.toFixed(1)}
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'rgba(255,85,85,0.2)',
            border: '1px solid rgba(255,85,85,0.4)',
            borderRadius: '3px',
            color: '#ff5555',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            padding: '2px 8px',
            lineHeight: '1',
          }}
        >
          ✕
        </button>
      </div>

      <div style={row}>
        <span style={label}>Gravity</span>
        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={overrides.gravity ?? GAME_CONFIG.gravity}
          onChange={(e) => set('gravity', parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ width: '30px', textAlign: 'right' }}>
          {(overrides.gravity ?? GAME_CONFIG.gravity).toFixed(2)}
        </span>
      </div>

      <div style={row}>
        <span style={label}>Jump</span>
        <input
          type="range"
          min="-10"
          max="-2"
          step="0.1"
          value={overrides.jumpForce ?? GAME_CONFIG.jumpForce}
          onChange={(e) => set('jumpForce', parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ width: '30px', textAlign: 'right' }}>
          {(overrides.jumpForce ?? GAME_CONFIG.jumpForce).toFixed(1)}
        </span>
      </div>

      <div style={row}>
        <span style={label}>Speed ×</span>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={overrides.speedMultiplier}
          onChange={(e) => set('speedMultiplier', parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ width: '30px', textAlign: 'right' }}>
          {overrides.speedMultiplier.toFixed(1)}
        </span>
      </div>

      <div style={row}>
        <span style={label}>Gap</span>
        <input
          type="range"
          min="80"
          max="250"
          step="5"
          value={overrides.pipeGap ?? GAME_CONFIG.basePipeGap}
          onChange={(e) => set('pipeGap', parseInt(e.target.value, 10))}
          style={{ flex: 1 }}
        />
        <span style={{ width: '30px', textAlign: 'right' }}>
          {overrides.pipeGap ?? GAME_CONFIG.basePipeGap}
        </span>
      </div>

      <div style={row}>
        <span style={label}>God mode</span>
        <input
          type="checkbox"
          checked={overrides.godMode}
          onChange={(e) => set('godMode', e.target.checked)}
        />
      </div>

      <div style={{ ...row, marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
        <button 
          onClick={onCompleteWord}
          style={{
            background: 'rgba(0,255,255,0.1)',
            border: '1px solid rgba(0,255,255,0.3)',
            color: '#00ffff',
            fontSize: '9px',
            padding: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          COMPLETE WORD
        </button>
      </div>
      <div style={row}>
        <button 
          onClick={onUnlockAll}
          style={{
            background: 'rgba(255,0,255,0.1)',
            border: '1px solid rgba(255,0,255,0.3)',
            color: '#ff00ff',
            fontSize: '9px',
            padding: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          UNLOCK ALL
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;
