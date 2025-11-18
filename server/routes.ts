import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSystemItemSchema, insertWindowStateSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // File System API Routes
  app.get("/api/filesystem", async (req, res) => {
    try {
      const items = await storage.getFileSystemItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file system items" });
    }
  });

  app.get("/api/filesystem/:id", async (req, res) => {
    try {
      const item = await storage.getFileSystemItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file system item" });
    }
  });

  app.post("/api/filesystem", async (req, res) => {
    try {
      const validated = insertFileSystemItemSchema.parse(req.body);
      const item = await storage.createFileSystemItem(validated);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid file system item data" });
    }
  });

  app.patch("/api/filesystem/:id", async (req, res) => {
    try {
      const item = await storage.updateFileSystemItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update file system item" });
    }
  });

  app.delete("/api/filesystem/:id", async (req, res) => {
    try {
      await storage.deleteFileSystemItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file system item" });
    }
  });

  // Window State API Routes
  app.get("/api/windows", async (req, res) => {
    try {
      const windows = await storage.getWindows();
      res.json(windows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch windows" });
    }
  });

  app.get("/api/windows/:id", async (req, res) => {
    try {
      const window = await storage.getWindow(req.params.id);
      if (!window) {
        return res.status(404).json({ error: "Window not found" });
      }
      res.json(window);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch window" });
    }
  });

  app.post("/api/windows", async (req, res) => {
    try {
      const validated = insertWindowStateSchema.parse(req.body);
      const window = await storage.createWindow(validated);
      res.json(window);
    } catch (error) {
      res.status(400).json({ error: "Invalid window data" });
    }
  });

  app.patch("/api/windows/:id", async (req, res) => {
    try {
      const window = await storage.updateWindow(req.params.id, req.body);
      res.json(window);
    } catch (error) {
      res.status(500).json({ error: "Failed to update window" });
    }
  });

  app.delete("/api/windows/:id", async (req, res) => {
    try {
      await storage.deleteWindow(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete window" });
    }
  });

  // Extension API Routes
  app.get("/api/extensions", async (req, res) => {
    try {
      const extensions = await storage.getExtensions();
      res.json(extensions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch extensions" });
    }
  });

  app.get("/api/extensions/:id", async (req, res) => {
    try {
      const extension = await storage.getExtension(req.params.id);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }
      res.json(extension);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch extension" });
    }
  });

  app.post("/api/extensions/:id/install", async (req, res) => {
    try {
      const extension = await storage.installExtension(req.params.id);
      res.json(extension);
    } catch (error) {
      res.status(500).json({ error: "Failed to install extension" });
    }
  });

  app.post("/api/extensions/:id/uninstall", async (req, res) => {
    try {
      const extension = await storage.uninstallExtension(req.params.id);
      res.json(extension);
    } catch (error) {
      res.status(500).json({ error: "Failed to uninstall extension" });
    }
  });

  app.post("/api/extensions/:id/update", async (req, res) => {
    try {
      const updated = await storage.updateExtension(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update extension" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
