import { useState, useEffect, useRef } from 'react';
import { getOrderTracking, getRouteHistory } from '../api/tracking';

/**
 * Encapsulates all polling logic for live tracking.
 *
 * Why a custom hook?
 * TrackOrder page just calls useTracking(orderId) and gets
 * back clean data. The polling interval, cleanup, and
 * error handling all live here — not cluttering the UI component.
 *
 * Polling interval: 5 seconds
 * Stops automatically when order is delivered or cancelled.
 */
export function useTracking(orderId) {
  const [tracking, setTracking]   = useState(null);
  const [history,  setHistory]    = useState([]);
  const [error,    setError]      = useState(null);
  const intervalRef = useRef(null);

  const POLL_INTERVAL = 5000;   // 5 seconds
  const STOP_STATUSES = ['delivered', 'cancelled'];

  const fetchTracking = async () => {
    try {
      const res = await getOrderTracking(orderId);
      setTracking(res.data);
      setError(null);

      // Stop polling when order is complete
      if (STOP_STATUSES.includes(res.data.order_status)) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError('Could not fetch tracking data.');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await getRouteHistory(orderId);
      setHistory(res.data);
    } catch {
      // Non-critical — map still works without history
    }
  };

  useEffect(() => {
    if (!orderId) return;

    // Fetch immediately on mount
    fetchTracking();
    fetchHistory();

    // Then poll every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchTracking();
      fetchHistory();
    }, POLL_INTERVAL);

    // Cleanup on unmount — prevents memory leaks
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  return { tracking, history, error };
}