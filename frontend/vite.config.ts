import { createLogger, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const logger = createLogger();
const originalLoggerError = logger.error.bind(logger);
logger.error = (msg, options) => {
  if (
    typeof msg === 'string' &&
    (msg.includes('ECONNABORTED') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ws proxy socket error') ||
      msg.includes('ws proxy error'))
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err?.code === 'ECONNABORTED' || err?.code === 'ECONNRESET') {
              return;
            }
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket: any) => {
            socket.on('error', (err: any) => {
              if (err?.code === 'ECONNABORTED' || err?.code === 'ECONNRESET') {
                return;
              }
            });
          });
        },
      },
    },
  },
});
