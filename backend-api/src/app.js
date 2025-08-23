import { Pool } from "pg";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected! Current time:", res.rows[0]);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
})();
const app = express();
app.use(express.json());

/*
 * Create a new document
 * req.body: { title: string, content: string }
 */
app.post("/create_document", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
    }
    try {
        const result = await pool.query(
            `INSERT INTO documents (title, content, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             RETURNING id, title, content, created_at, updated_at`,
            [title, content]
        );
        res.status(201).json("Insert Successful");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * Get all documents
 */
app.get("/documents", async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM documents`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * Get a specific document
 * req.params: { id: string }
 */
app.get("/document/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM documents WHERE id=$1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * Update a specific document
 * req.params: { id: string }
 * req.body: { title: string, content: string }
 */
app.post("/document/:id", async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
    }
    try {
        const result = await pool.query(
            `UPDATE documents SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
            [title, content, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*
 * Delete a specific document
 * req.params: { id: string }
 */
app.delete("/document/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM documents WHERE id=$1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found." });
        }

        res.status(200).json({ message: "document deleted successfully.", deleted: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error." });
    }
});


app.listen(process.env.PORT || 5000, () => {
    console.log("Server running...");
});