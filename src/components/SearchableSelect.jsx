import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = '-- Pilih --',
  searchPlaceholder = 'Cari opsi...',
  required = false,
  disabled = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Normalize options to { value, label, sublabel }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const label = opt.label !== undefined ? opt.label : (opt.nama_santri || opt.nama_asatidz || opt.nama_halaqah || opt.nama_asrama || opt.nama_kamar || opt.nama || opt.name || opt.text || '');
      let sublabel = opt.sublabel;
      if (sublabel === undefined) {
        if (opt.nis) {
          sublabel = `NIS: ${opt.nis}`;
        } else if (opt.gender) {
          sublabel = opt.gender === 'L' ? 'Ikhwan' : 'Akhwat';
        } else {
          sublabel = null;
        }
      }
      if (typeof sublabel === 'string' && sublabel.includes('undefined')) {
        sublabel = sublabel.replace(/ • NIS: undefined|NIS: undefined • |NIS: undefined/g, '').trim() || null;
      }
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label,
        sublabel
      };
    }
    return { value: opt, label: String(opt), sublabel: null };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const filteredOptions = normalizedOptions.filter((opt) => {
    const q = search.toLowerCase();
    return (
      opt.label?.toLowerCase().includes(q) ||
      opt.sublabel?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%', boxSizing: 'border-box', userSelect: 'none', ...style }}
    >
      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required={required}
          onChange={() => {}}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '1px',
            height: '1px',
            bottom: 0,
            left: '50%',
            pointerEvents: 'none'
          }}
          tabIndex={-1}
        />
      )}

      {/* Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 10px',
          border: isOpen ? '1px solid #0284c7' : '1px solid #cbd5e1',
          borderRadius: '6px',
          background: disabled ? '#f1f5f9' : '#ffffff',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '6px' }}>
          {selectedOption ? (
            <span style={{ color: '#0f172a', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedOption.label} {selectedOption.sublabel ? `(${selectedOption.sublabel})` : ''}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{placeholder}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '1px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Hapus Pilihan"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={14} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            boxSizing: 'border-box',
            zIndex: 99999,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '260px'
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} color="#64748b" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.76rem',
                color: '#0f172a'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '1px' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.74rem' }}>
                Tidak ada data ditemukan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? '#e0f2fe' : 'transparent',
                      color: isSelected ? '#0284c7' : '#1e293b',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 700 : 500,
                      marginBottom: '2px',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div>{opt.label}</div>
                      {opt.sublabel && (
                        <div style={{ fontSize: '0.67rem', color: isSelected ? '#0369a1' : '#64748b' }}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={13} color="#0284c7" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
