import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';

validateEnv();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true,
  },
});

initSockets(io);
app.set('io', io);

const startServer = async () => {
  await connectDB();

  if (env.nodeEnv === 'production') {
    // autoIndex is intentionally off in production (avoids slow index
    // builds blocking every connection), so we sync indexes explicitly
    // once at boot instead — idempotent, so safe on every deploy.
    const { default: Requirement } = await import('./models/Requirement.js');
    const { default: PresenterProfile } = await import('./models/PresenterProfile.js');
    const { default: CollegeProfile } = await import('./models/CollegeProfile.js');
    try {
      await Promise.all([
        Requirement.syncIndexes(),
        PresenterProfile.syncIndexes(),
        CollegeProfile.syncIndexes(),
      ]);
      console.log('[db] Search text indexes synced');
    } catch (error) {
      console.error(`[db] Index sync failed: ${error.message}`);
    }
  }

  server.listen(env.port, () => {
    console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer();
