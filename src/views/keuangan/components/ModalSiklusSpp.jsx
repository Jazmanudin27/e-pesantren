import React from 'react';
import { Calendar } from 'lucide-react';

export default function ModalSiklusSpp({
  isOpen,
  onClose,
  siklusForm,
  setSiklusForm,
  savingSiklus,
  onSaveSiklus
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '480px',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '24px 20px',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.25s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Atur Siklus Tagihan SPP
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Tanggal terbit bulanan &amp; batas maksimal bayar
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSaveSiklus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Tanggal Terbit Tagihan (Setiap Bulan)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Setiap Tanggal</span>
              <input
                type="number"
                min="1"
                max="28"
                value={siklusForm.tgl_terbit_spp}
                onChange={(e) => setSiklusForm({ ...siklusForm, tgl_terbit_spp: parseInt(e.target.value) || 5 })}
                style={{
                  width: '70px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>tiap bulan</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
              Mulai tanggal ini, tagihan bulan berjalan mulai ditagihkan ke wali santri.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Tanggal Maksimal Pembayaran (Batas Jatuh Tempo)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Maksimal Tanggal</span>
              <input
                type="number"
                min="1"
                max="28"
                value={siklusForm.tgl_jatuh_tempo_spp}
                onChange={(e) => setSiklusForm({ ...siklusForm, tgl_jatuh_tempo_spp: parseInt(e.target.value) || 10 })}
                style={{
                  width: '70px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#dc2626',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>tiap bulan</span>
            </div>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              padding: '8px 12px',
              marginTop: '6px',
              fontSize: '0.72rem',
              color: '#991b1b',
              lineHeight: 1.4
            }}>
              ⚠️ <strong>Ketentuan Tunggakan:</strong> Pembayaran yang dilakukan setelah tanggal <strong>{siklusForm.tgl_jatuh_tempo_spp}</strong> otomatis tercatat resmi sebagai <strong>Tunggakan</strong>.
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={siklusForm.apply_to_existing}
              onChange={(e) => setSiklusForm({ ...siklusForm, apply_to_existing: e.target.checked })}
              style={{ accentColor: '#059669', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
              Terapkan juga ke seluruh tagihan berjalan yang belum lunas
            </span>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingSiklus}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {savingSiklus ? 'Menyimpan...' : 'Simpan Pengaturan Siklus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

