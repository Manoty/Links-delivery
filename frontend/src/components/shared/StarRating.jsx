import { useState } from 'react';

export default function StarRating({ value, onChange, readonly = false, size = 28 }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hover || value);
        return (
          <span
            key={star}
            style={{
              fontSize: size,
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? '#BA7517' : 'var(--gray-200)',
              transition: 'color 0.1s',
              lineHeight: 1,
              userSelect: 'none',
            }}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange && onChange(star)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}