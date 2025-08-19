import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("edit", (data) => {
        socket.broadcast.emit("edit", data); // broadcast edits
    });
});

const PORT = process.env.PORT || 4000;
const URL = process.env.URL || `http://localhost:${PORT}`;
httpServer.listen(PORT, () => console.log(`WebSocket running on ${URL}`));
