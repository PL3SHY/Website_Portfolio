import { useState } from 'react';
import { enterAs, resetDemo } from './enter';

// A small floating control for the demo: sign in as a sample client or admin in one click, or
// reset all sample data. Everything here only touches this browser tab's private copy.
const box: React.CSSProperties = {
  position: 'fixed', right: 12, bottom: 12, zIndex: 99999, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12,
};
const pill: React.CSSProperties = {
  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,.25)',
};
const panel: React.CSSProperties = {
  background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 12, padding: 12, width: 250,
  boxShadow: '0 8px 28px rgba(0,0,0,.35)', marginBottom: 8, lineHeight: 1.5,
};
const btn: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 8, padding: '7px 10px', marginTop: 6, cursor: 'pointer', font: 'inherit',
};

export default function DemoBar() {
  const [open, setOpen] = useState(false);

  return (
    <div style={box}>
      {open && (
        <div style={panel}>
          <div style={{ color: '#67e8f9', marginBottom: 4 }}>DEMO · sample data only</div>
          <div style={{ color: '#94a3b8' }}>Nothing here is real. Your changes stay in this tab.</div>
          <button style={btn} onClick={() => enterAs('client')}>Explore as a client</button>
          <button style={btn} onClick={() => enterAs('admin')}>Explore as the admin</button>
          <button style={btn} onClick={resetDemo}>Reset demo data</button>
        </div>
      )}
      <button style={pill} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'close' : 'demo tools'}
      </button>
    </div>
  );
}
