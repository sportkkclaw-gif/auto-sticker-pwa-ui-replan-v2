'use client';
import { useState } from 'react';

export default function CropPage() {
  const [cropped, setCropped] = useState(false);
  return (
    <main>
      <div className="page-header">裁切 / 去背</div>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✂️</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
          拖動調整裁切範圍
        </p>
        <div style={{
          width: '100%', aspectRatio: '1', maxWidth: 280, margin: 'auto',
          background: 'var(--bg-cream)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--muted)',
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>照片預覽區</span>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>去背選項</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['自動去背', '保留背景'].map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="radio" name="bg" value={opt} />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={() => setCropped(true)}
        style={{ marginTop: 8 }}
      >
        儲存裁切
      </button>
    </main>
  );
}
