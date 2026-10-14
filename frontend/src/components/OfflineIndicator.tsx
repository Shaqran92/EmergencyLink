import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react';

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

export default function OfflineIndicator() {
  const [status, setStatus] = useState<NetworkStatus>(() => (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'));
  const [visible, setVisible] = useState<boolean>(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let dismissTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleOffline = () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (dismissTimeout) clearTimeout(dismissTimeout);
      setStatus('offline');
      setVisible(true);
    };

    const handleOnline = () => {
      setStatus('reconnecting');
      setVisible(true);
      reconnectTimeout = setTimeout(() => {
        setStatus('online');
        dismissTimeout = setTimeout(() => {
          setVisible(false);
        }, 3000);
      }, 1500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (dismissTimeout) clearTimeout(dismissTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`offline-banner banner-${status}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-banner-content">
        {status === 'offline' && (
          <>
            <WifiOff size={16} />
            <span>
              <strong>Working offline.</strong> Your internet connection was lost. Operational actions will not sync until connection is restored.
            </span>
          </>
        )}
        {status === 'reconnecting' && (
          <>
            <RefreshCw size={16} className="spin" />
            <span>
              <strong>Reconnecting…</strong> Restoring connection to EmergencyLink operations network.
            </span>
          </>
        )}
        {status === 'online' && (
          <>
            <Wifi size={16} />
            <span>
              <strong>Connection restored.</strong> You are back online. Live synchronization is active.
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        className="icon-button button-quiet"
        onClick={() => setVisible(false)}
        aria-label="Dismiss offline banner"
        style={{ width: 22, height: 22, border: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
