import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import axios from "axios";
import DeltaPkg from "quill-delta";
import { createClient } from "redis";

const Delta = DeltaPkg;
dotenv.config();

// Setup Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));
await redisClient.connect();

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

// Populate Redis with documents from DB
const fetchDocuments = async () => {
  try {
    const response = await axios.get(`${process.env.API_URL}/documents`);
    for (const doc of response.data) {
      await redisClient.hSet(`document:${doc.id}`, {
        title: doc.title,
        content: doc.content,
      });
    }
  } catch (error) {
    console.error("Error fetching documents:", error.message);
  }
};
fetchDocuments();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.documents = new Set();

  // Join document
  socket.on("join-document", async ({ documentID }) => {
    socket.join(documentID);
    socket.documents.add(documentID);
    console.log(`Socket ${socket.id} joined document ${documentID}`);

    const docKey = `document:${documentID}`;
    let title = await redisClient.hGet(docKey, "title");
    let latestContent = await redisClient.hGet(docKey, "content");

    socket.emit("document-joined", { title, delta: [{ insert: latestContent }] });
  });

  // Leave document
  socket.on("leave-document", ({ documentID }) => {
    socket.leave(documentID);
    socket.documents.delete(documentID);
    console.log(`Socket ${socket.id} left document ${documentID}`);
  });

  // Handle document edits
  socket.on("edit", async ({ documentID, title, delta }) => {
    // Fetch existing state from Redis
    let doc = await redisClient.hGetAll(`document:${documentID}`);
    if (!doc || Object.keys(doc).length === 0) {
      doc = { title: "", content: "" };
    }

    if (title !== undefined && title !== null) {
      doc.title = title;
    }

    if (delta) {
      doc.content = applyDelta(doc.content || "", delta);

      // Save updated state to Redis
      await redisClient.hSet(`document:${documentID}`, {
        title: doc.title,
        content: doc.content,
      });

      // Push delta into buffer list
      await redisClient.rPush(
        `editBuffer:${documentID}`,
        JSON.stringify(delta)
      );

      // Broadcast delta to other clients
      socket.to(documentID).emit("update-document", delta);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const docID of socket.documents) {
      socket.leave(docID);
      console.log(`Socket ${socket.id} left document ${docID}`);
    }
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// Apply delta to document content
function applyDelta(contentString, delta) {
  const currentDelta = new Delta([{ insert: contentString }]);
  const newDelta = currentDelta.compose(new Delta(delta));
  return newDelta.ops.map((op) => op.insert).join("");
}

// Save to database every 10s
setInterval(async () => {
  try {
    const keys = await redisClient.keys("editBuffer:*");
    for (const key of keys) {
      const documentID = key.split(":")[1];
      const deltas = await redisClient.lRange(key, 0, -1);

      if (deltas.length === 0) continue;

      const doc = await redisClient.hGetAll(`document:${documentID}`);
      if (!doc) continue;

      await axios.post(`${process.env.API_URL}/document/${documentID}`, {
        title: doc.title,
        content: doc.content,
      });

      // Clear buffer after saving
      await redisClient.del(key);
    }
  } catch (error) {
    console.error("Failed to save edits:", error.message);
  }
}, 10000);

const PORT = process.env.PORT || 4000;
const URL = process.env.URL || `http://localhost:${PORT}`;
httpServer.listen(PORT, () => console.log(`WebSocket running on ${URL}`));
