import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTracking } from '../../hooks/useTracking';
import StarRating from './StarRating';
import { submitRating } from '../../api/auth';
import { useToast } from './Toast';

const QUICK_COMMENTS = [
  'Very fast delivery!',
  'Friendly rider',
  'Handled with care',
  'Great communication',
  'On time',
];

export default function RatingModal({ order, onClose, onSubmitted }) {
  const [stars,   setStars]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!order) return null;

  const handleSubmit = async () => {
    if (stars === 0) return toast.error('Please select a star rating.');
    setLoading(true);
    try {
      await submitRating({
        order_id: order.id,
        stars,
        comment,
      });
      toast.success('Rating submitted. Thank you!');
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Could not submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' };

  return (
    /* Faux modal — uses in-flow wrapper so fixed doesn't collapse height */
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 200,
      padding: '0 0 20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px 20px 16px 16px',
        width: '100%',
        maxWidth: 480,
        padding: '24px 20px 20px',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--gray-200)', margin: '0 auto 20px' }} />

        {/* Rider info */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-50)', color: 'var(--green-600)',
            fontSize: 20, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            {order.rider?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Rate your delivery
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            Delivered by {order.rider?.username} · Order #{order.id}
          </div>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20, gap: 8 }}>
          <StarRating value={stars} onChange={setStars} size={40} />
          {stars > 0 && (
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--green-700)' }}>
              {LABELS[stars]}
            </div>
          )}
        </div>

        {/* Quick comments */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, justifyContent: 'center' }}>
          {QUICK_COMMENTS.map(q => (
            <button
              key={q}
              onClick={() => setComment(c => c === q ? '' : q)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: comment === q ? 'var(--green-700)' : 'var(--gray-100)',
                color: comment === q ? '#fff' : 'var(--gray-600)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Text comment */}
        <textarea
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '0.5px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            resize: 'none',
            height: 72,
            outline: 'none',
            fontFamily: 'inherit',
            marginBottom: 14,
          }}
          placeholder="Add a comment (optional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--gray-200)', background: '#fff',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || stars === 0}
            style={{
              flex: 2, padding: '12px', borderRadius: 'var(--radius-lg)',
              background: stars === 0 ? 'var(--gray-200)' : 'var(--green-700)',
              color: stars === 0 ? 'var(--gray-400)' : '#fff',
              border: 'none', fontSize: 14, fontWeight: 600,
              cursor: stars === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit rating'}
          </button>
        </div>
      </div>
    </div>
  );
}