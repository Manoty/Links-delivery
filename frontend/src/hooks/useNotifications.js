import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markNotificationsRead } from '../api/auth';

/**
 * Polls /api/users/notifications/ every 10 seconds.
 * Fires browser Notification API for new unread items.
 * Returns: notifications list, unread count, markRead fn.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const seenIds = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      const { notifications: notifs, unread_count } = res.data;

      setNotifications(notifs);
      setUnreadCount(unread_count);

      // Fire browser notification for truly new items
      const newOnes = notifs.filter(
        n => !n.is_read && !seenIds.current.has(n.id)
      );

      newOnes.forEach(n => {
        seenIds.current.add(n.id);
        fireBrowserNotification(n);
        playNotificationSound();
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 10000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markRead = async (ids = []) => {
    await markNotificationsRead(ids);
    setNotifications(prev =>
      prev.map(n =>
        ids.length === 0 || ids.includes(n.id)
          ? { ...n, is_read: true }
          : n
      )
    );
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, refresh: fetchNotifications };
}

function fireBrowserNotification(n) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(n.title, { body: n.body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification(n.title, { body: n.body, icon: '/favicon.ico' });
      }
    });
  }
}

function playNotificationSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}