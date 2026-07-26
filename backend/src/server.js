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
  server.listen(env.port, () => {
    console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer();
