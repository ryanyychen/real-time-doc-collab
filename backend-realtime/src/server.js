import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import axios from "axios";
import DeltaPkg from "quill-delta";
const Delta = DeltaPkg;

dotenv.config();
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });
const editBuffer = {};
const documentState = {};

// Populate documentState by fetching documents from database
const fetchDocuments = async () => {
    try {
        const response = await axios.get(`${process.env.API_URL}/documents`);
        response.data.forEach(doc => {
            documentState[doc.id] = { title: doc.title, content: doc.content };
        });
    } catch (error) {
        console.error("Error fetching documents:", error.message);
    }
};

fetchDocuments();

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.documents = new Set();

    // Join document
    socket.on("join-document", (data) => {
        const documentID = data.documentID;
        socket.join(documentID);
        socket.documents.add(documentID);
        console.log(`Socket ${socket.id} joined document ${documentID}`);
    });

    // Leave document
    socket.on("leave-document", (data) => {
        const documentID = data.documentID;
        socket.leave(documentID);
        socket.documents.delete(documentID);
        console.log(`Socket ${socket.id} left document ${documentID}`);
    })

    // Handle document edits
    socket.on("edit", ({ documentID, title, delta }) => {
        if (!documentState[documentID]) documentState[documentID] = { title: "", content: "" };
        if (title !== undefined && title !== null) {
            documentState[documentID].title = title;
        }

        if (delta) {
            documentState[documentID].content = applyDelta(
                documentState[documentID].content,
                delta
            );

            if (!editBuffer[documentID]) editBuffer[documentID] = [];
            editBuffer[documentID].push(delta);

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
    })
});

// Apply delta to document content
function applyDelta(contentString, delta) {
    const currentDelta = new Delta([{ insert: contentString }]);
    const newDelta = currentDelta.compose(new Delta(delta));
    return newDelta.ops.map(op => op.insert).join('');
}

// Save to database
setInterval(async () => {
    for (const [documentID, deltas] of Object.entries(editBuffer)) {
        if (deltas.length === 0) continue;
        try {
            const { title, content } = documentState[documentID];
            await axios.post(`${process.env.API_URL}/document/${documentID}`, { title, content });
            editBuffer[documentID] = [];
        } catch (error) {
            console.error("Failed to save edits:", error.message);
        }
    }
}, 10000);

const PORT = process.env.PORT || 4000;
const URL = process.env.URL || `http://localhost:${PORT}`;
httpServer.listen(PORT, () => console.log(`WebSocket running on ${URL}`));