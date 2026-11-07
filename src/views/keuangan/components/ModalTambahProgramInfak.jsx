import React, { useState } from 'react';
import axios from 'axios';
import { X, Sparkles } from 'lucide-react';
import { toastSuccess, toastError } from '../../../utils/alert.util';

export default function ModalTambahProgramInfak({ isOpen, onClose, onSuccess }) {
  const [programForm, setProgramForm] = useState({
    kode_program: '',
    nama_program: '',
    kategori: 'Wakaf & Pembangunan',
    deskripsi: '',
    target_dana: '50000000'
  });
  const [submittingProgram, setSubmittingProgram] = useState(false);

  if (!isOpen) return null;

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!programForm.nama_program.trim()) {
      toastError('Nama program infak wajib diisi!');
      return;
    }

    try {
      setSubmittingProgram(true);
      const res = await axios.post('/api/infak/program', {
        ...programForm,
        target_dana: parseFloat(programForm.target_dana) || 0
      });
      if (res.data?.success) {
        toastSuccess('Program infak baru berhasil disimpan ke database.');
        setProgramForm({
          kode_program: '',
          nama_program: '',
          kategori: 'Wakaf & Pembangunan',
          deskripsi: '',
          target_dana: '50000000'
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toastError(res.data?.message || 'Gagal menyimpan program.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmittingProgram(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '430px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d766e 0%, #064e3b 100%)',
            color: '#ffffff',
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Tambah Program Infak</span>
            </h3>
            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', marginTop: '2px' }}>
              Kelola pos donasi, wakaf &amp; sedekah pesantren
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateProgram} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Nama Program Infak *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembangunan &amp; Perluasan Masjid"
              value={programForm.nama_program}
              onChange={(e) => setProgramForm({ ...programForm, nama_program: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Kategori Program
            </label>
            <select
              value={programForm.kategori}
              onChange={(e) => setProgramForm({ ...programForm, kategori: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontWeight: 700,
                color: '#1e293b'
              }}
            >
              <option value="Wakaf &amp; Pembangunan">Wakaf &amp; Pembangunan</option>
              <option value="Beasiswa Pendidikan">Beasiswa Santri &amp; Yatim</option>
              <option value="Wakaf Qur'an &amp; Kitab">Wakaf Qur'an &amp; Kitab</option>
              <option value="Sedekah Konsumsi">Sedekah Konsumsi &amp; Berkah</option>
              <option value="Infak Umum Pesantren">Infak Umum Pesantren</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Target Dana (Rp)
            </label>
            <input
              type="number"
              placeholder="50000000"
              value={programForm.target_dana}
              onChange={(e) => setProgramForm({ ...programForm, target_dana: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontWeight: 800,
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan tujuan dan pemanfaatan infak ini..."
              value={programForm.deskripsi}
              onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit / Cancel Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingProgram}
              style={{
                flex: 2,
                padding: '11px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              }}
            >
              {submittingProgram ? 'Menyimpan...' : 'Simpan Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

