import { useState } from 'react';

export default function AuthField({
  label, type = 'text', placeholder,
  value, onChange, icon, required = true,
  hint,
}) {
  const [focused,   setFocused]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  const isPassword = type === 'password';
  const inputType  = isPassword && showPass ? 'text' : type;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 6,
      }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#6B5E52' }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 12, color: '#E8521A', fontWeight: 600 }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {icon && (
          <div style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? '#E8521A' : '#B0A396',
            transition: 'color 0.15s',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `13px 14px 13px ${icon ? '42px' : '14px'}`,
            paddingRight: isPassword ? 44 : 14,
            border: `1.5px solid ${focused ? '#E8521A' : '#F0EBE3'}`,
            borderRadius: 12,
            fontSize: 15,
            color: '#1A1207',
            background: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            style={{
              position: 'absolute', right: 14, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              color: '#B0A396', fontSize: 16,
            }}
          >
            {showPass ? '🙈' : '👁'}
          </button>
        )}
      </div>
    </div>
  );
}