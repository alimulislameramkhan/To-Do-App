import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Database connection
const dbPromise = open({
  filename: path.join(__dirname, "database.sqlite"),
  driver: sqlite3.Database
});

(async () => {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      category TEXT,
      dueDate TEXT,
      priority TEXT,
      completed INTEGER
    )
  `);
})();

// API: Get all tasks
app.get("/api/tasks", async (req, res) => {
  const db = await dbPromise;
  const tasks = await db.all("SELECT * FROM tasks");
  res.json(tasks);
});

// API: Add task
app.post("/api/tasks", async (req, res) => {
  const { text, category, dueDate, priority } = req.body;
  const db = await dbPromise;
  await db.run(
    "INSERT INTO tasks (text, category, dueDate, priority, completed) VALUES (?, ?, ?, ?, 0)",
    [text, category, dueDate, priority]
  );
  res.json({ success: true });
});

// API: Toggle task completion
app.put("/api/tasks/:id/toggle", async (req, res) => {
  const db = await dbPromise;
  await db.run("UPDATE tasks SET completed = NOT completed WHERE id = ?", [
    req.params.id
  ]);
  res.json({ success: true });
});

// API: Update task text
app.put("/api/tasks/:id", async (req, res) => {
  const { text } = req.body;
  const db = await dbPromise;
  await db.run("UPDATE tasks SET text = ? WHERE id = ?", [text, req.params.id]);
  res.json({ success: true });
});

// API: Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  const db = await dbPromise;
  await db.run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// API: Clear completed
app.delete("/api/tasks", async (req, res) => {
  const db = await dbPromise;
  await db.run("DELETE FROM tasks WHERE completed = 1");
  res.json({ success: true });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
