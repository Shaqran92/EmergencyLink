import { io, Socket } from 'socket.io-client';

/**
 * Returns the target WebSocket / Socket.IO server URL.
 * When running in Vite development mode (:5173), connects directly to
 * the Express server on port 5000 to eliminate Vite proxy WebSocket aborts (ECONNABORTED).
 */
export function getSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return '/';
}

/**
 * Factory helper to create a resilient Socket.IO client instance
 */
export function createEmergencySocket(
  options: {
    auth?: { token?: string | null };
    transports?: string[];
    reconnectionAttempts?: number;
    timeout?: number;
  } = {}
): Socket {
  const url = getSocketUrl();
  return io(url, {
    transports: options.transports || ['websocket', 'polling'],
    auth: options.auth,
    reconnection: true,
    reconnectionAttempts: options.reconnectionAttempts ?? 10,
    reconnectionDelay: 1000,
    timeout: options.timeout ?? 8000,
  });
}
