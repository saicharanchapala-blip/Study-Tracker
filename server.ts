import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Cloud Sync Mock Store (simulates server-authoritative multi-device cloud storage)
interface ServerStore {
  sessions: any[];
  subjects: any[];
  deadlines: any[];
  streak: any;
  updatedAt: string;
}

let cloudDataStore: Record<string, ServerStore> = {};

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// OAuth Client info endpoint: provides OAuth client ID for Google Workspace/Classroom
app.get("/api/auth/google/config", (req, res) => {
  // In Google AI Studio, Google Classroom OAuth client is managed through Google Identity Services
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    scopes: [
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me.readonly"
    ]
  });
});

// --- CLOUD SYNC ENDPOINTS (For cross-device synchronization) ---
app.get("/api/sync/:userId", (req, res) => {
  const userId = req.params.userId || "default_user";
  const data = cloudDataStore[userId] || null;
  res.json({ success: true, data });
});

app.post("/api/sync/:userId", (req, res) => {
  const userId = req.params.userId || "default_user";
  const { sessions, subjects, deadlines, streak } = req.body;
  
  cloudDataStore[userId] = {
    sessions: sessions || [],
    subjects: subjects || [],
    deadlines: deadlines || [],
    streak: streak || null,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: "Data synced to cloud successfully",
    updatedAt: cloudDataStore[userId].updatedAt
  });
});

// --- PUSH NOTIFICATION SIMULATION / TEST DISPATCH ---
app.post("/api/notifications/test-deadline", (req, res) => {
  const { title, courseName, dueDate } = req.body;
  res.json({
    success: true,
    notification: {
      title: `Upcoming Deadline: ${title || 'Assignment'}`,
      body: `Course: ${courseName || 'Study Class'} is due soon (${dueDate || 'Tomorrow'})!`,
      timestamp: new Date().toISOString()
    }
  });
});

// Endpoint to download the entire project packaged as "Study Sync.zip"
app.get("/api/download-project", (req, res) => {
  const zipPath = path.join(__dirname, "public", "Study_Sync.zip");
  res.download(zipPath, "Study Sync.zip", (err) => {
    if (err) {
      console.error("Error sending Study Sync zip:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download Study Sync package" });
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Study Session Tracker Server running on port ${PORT}`);
  });
}

startServer();
