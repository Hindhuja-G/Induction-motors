import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './src/server/database/db.ts';
import apiRouter from './src/server/routes/api.ts';
import motorStateService from './src/server/services/motorStateService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Initialize SQLite Database
  await initDatabase();
  console.log('✔ SQLite Database initialized successfully.');

  // 2. Setup Express
  const app = express();
  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  // Serve ESP32 Arduino sketches statically
  app.use('/esp32', express.static(path.resolve(__dirname, 'esp32')));

  // 3. Create HTTP Server
  const server = http.createServer(app);

  // 4. Create WebSocket Server on /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket) => {
    // Send initial snapshot on connect
    try {
      const state = await motorStateService.getSystemState();
      ws.send(JSON.stringify({ type: 'INIT_STATE', data: state }));
    } catch (err) {
      console.error('WS init error:', err);
    }

    ws.on('message', async (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'START_MOTOR') {
          await motorStateService.startMotor();
        } else if (parsed.type === 'STOP_MOTOR') {
          await motorStateService.stopMotor();
        } else if (parsed.type === 'APPLY_SCENARIO') {
          await motorStateService.applyDemoScenario(parsed.scenario);
        }
      } catch (e) {
        // ignore malformed
      }
    });
  });

  // Wire WebSocket broadcasting from motorStateService
  motorStateService.registerBroadcaster((payload: any) => {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  });

  // 5. Mount Vite in Development, or Static Files in Production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('✔ Vite dev middleware attached.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('✔ Serving production build from /dist.');
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Motor Health Monitoring Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
