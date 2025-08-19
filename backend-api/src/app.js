import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    console.log("Test endpoint hit");
    res.send("REST API is running 🚀")
});

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || `http://localhost:${PORT}`;
app.listen(PORT, () => console.log(`API running on ${URL}`));
