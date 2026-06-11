'use strict';
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.WEBSOCKET_PORT || 4005;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4000', // API Gateway
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track connected users
const userSockets = new Map();
const roomMembers = new Map();

app.get('/health', (req, res) => {
  res.json({
    service: 'websocket-service',
    status: 'ok',
    connectedClients: io.engine.clientsCount,
    rooms: Array.from(roomMembers.keys()),
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'websocket-service',
    description: 'Real-time updates for FEMS',
    events: {
      inspection: ['inspection-scheduled', 'inspection-completed', 'inspection-reminder'],
      extinguisher: ['maintenance-needed', 'expiry-warning', 'status-changed'],
      user: ['user-created', 'user-updated', 'user-deleted'],
      notification: ['alert', 'info', 'warning'],
    },
  });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`[websocket] Client connected: ${socket.id}`);

  // User joins their personal room
  socket.on('user:join', (userId) => {
    socket.join(`user:${userId}`);
    userSockets.set(userId, socket.id);

    console.log(`[websocket] User ${userId} joined personal room`);

    socket.emit('connected', {
      message: 'Connected to FEMS real-time service',
      socketId: socket.id,
    });
  });

  // Join an inspection room for live updates
  socket.on('inspection:watch', (inspectionId) => {
    socket.join(`inspection:${inspectionId}`);

    const roomKey = `inspection:${inspectionId}`;
    if (!roomMembers.has(roomKey)) {
      roomMembers.set(roomKey, new Set());
    }
    roomMembers.get(roomKey).add(socket.id);

    console.log(`[websocket] Client joined inspection room: ${inspectionId}`);

    io.to(roomKey).emit('inspection:viewer-joined', {
      viewers: roomMembers.get(roomKey).size,
    });
  });

  // Leave an inspection room
  socket.on('inspection:unwatch', (inspectionId) => {
    socket.leave(`inspection:${inspectionId}`);

    const roomKey = `inspection:${inspectionId}`;
    const members = roomMembers.get(roomKey);
    if (members) {
      members.delete(socket.id);
      if (members.size === 0) {
        roomMembers.delete(roomKey);
      }
    }

    console.log(`[websocket] Client left inspection room: ${inspectionId}`);
  });

  // Broadcasting methods for services
  socket.on('broadcast:inspection-completed', (data) => {
    io.to(`inspection:${data.inspectionId}`).emit('inspection:completed', {
      inspectionId: data.inspectionId,
      result: data.result,
      completedAt: new Date(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('notification:inspection-completed', {
        message: `Inspection ${data.inspectionId} completed`,
        data,
      });
    }
  });

  socket.on('broadcast:maintenance-alert', (data) => {
    io.emit('alert:maintenance-needed', {
      extinguisherId: data.extinguisherId,
      location: data.location,
      severity: data.severity || 'medium',
      message: `Maintenance needed for extinguisher at ${data.location}`,
    });
  });

  socket.on('broadcast:extinguisher-updated', (data) => {
    io.emit('extinguisher:updated', {
      extinguisherId: data.extinguisherId,
      status: data.status,
      changes: data.changes,
    });
  });

  socket.on('broadcast:user-notification', (data) => {
    const userKey = `user:${data.userId}`;
    io.to(userKey).emit('notification', {
      type: data.type || 'info',
      message: data.message,
      data: data.data,
      timestamp: new Date(),
    });
  });

  // Health check
  socket.on('ping', (callback) => {
    callback('pong');
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    // Remove user from userSockets map
    for (const [userId, socketId] of userSockets) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }

    // Clean up room memberships
    for (const [room, members] of roomMembers) {
      members.delete(socket.id);
      if (members.size === 0) {
        roomMembers.delete(room);
      }
    }

    console.log(`[websocket] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[websocket] Socket error:`, error);
  });
});

// Handle HTTP errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

async function bootstrap() {
  console.log('[websocket-service] WebSocket service starting...');
  return httpServer;
}

if (require.main === module) {
  bootstrap().then(() => {
    httpServer.listen(PORT, () => {
      console.log(`[websocket-service] listening on http://localhost:${PORT}`);
      console.log(`[websocket-service] CORS enabled for ${FRONTEND_URL}`);
    });
  }).catch(err => {
    console.error('Failed to start websocket service:', err);
    process.exit(1);
  });
}

module.exports = { httpServer, io };
module.exports.bootstrap = bootstrap;
