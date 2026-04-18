import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.API_BASE_URL?.replace('/api', '') ||
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
  'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [latestQR, setLatestQR] = useState({});        // { deviceId: qrDataUrl }
  const [bulkProgress, setBulkProgress] = useState({}); // { deviceId: progressData }

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // All statuses on initial connect
    socket.on('device:all_statuses', (statuses) => {
      setDeviceStatuses(statuses);
      // Extract QRs
      const qrs = {};
      for (const [id, s] of Object.entries(statuses)) {
        if (s.qr) qrs[id] = s.qr;
      }
      setLatestQR(prev => ({ ...prev, ...qrs }));
    });

    // Individual device status updates
    socket.on('device:status', (data) => {
      const { deviceId, ...rest } = data;
      setDeviceStatuses(prev => ({
        ...prev,
        [deviceId]: { ...(prev[deviceId] || {}), ...rest },
      }));

      // Update QR if present
      if (rest.qr) {
        setLatestQR(prev => ({ ...prev, [deviceId]: rest.qr }));
      } else if (rest.status !== 'qr_pending') {
        setLatestQR(prev => {
          const next = { ...prev };
          delete next[deviceId];
          return next;
        });
      }
    });

    // Bulk progress
    socket.on('device:bulk_progress', (data) => {
      const { deviceId, ...rest } = data;
      setBulkProgress(prev => ({ ...prev, [deviceId]: rest }));
    });

    socket.on('device:bulk_complete', (data) => {
      const { deviceId, ...rest } = data;
      setBulkProgress(prev => ({ ...prev, [deviceId]: { ...rest, completed: true } }));
      window.dispatchEvent(new Event('usage:refresh'));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getDeviceStatus = useCallback((deviceId) => {
    return deviceStatuses[String(deviceId)] || { status: 'offline' };
  }, [deviceStatuses]);

  const getDeviceQR = useCallback((deviceId) => {
    return latestQR[String(deviceId)] || null;
  }, [latestQR]);

  const getBulkProgress = useCallback((deviceId) => {
    return bulkProgress[String(deviceId)] || null;
  }, [bulkProgress]);

  return {
    isConnected,
    deviceStatuses,
    getDeviceStatus,
    getDeviceQR,
    getBulkProgress,
  };
}
