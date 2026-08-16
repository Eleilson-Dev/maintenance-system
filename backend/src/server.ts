import http from "http";
import { Server } from "socket.io";

import { app } from "./app.js";

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  const userId = socket.handshake.auth?.userId;

  if (typeof userId === "string" && userId.trim()) {
    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    console.log(`Usuário ${userId} entrou na sala individual ${userRoom}`);
  } else {
    console.log(`Socket ${socket.id} conectou sem userId válido.`);
  }

  socket.on("join_support", () => {
    socket.join("support_agents");

    console.log(`Socket ${socket.id} entrou na sala support_agents`);
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3333;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
