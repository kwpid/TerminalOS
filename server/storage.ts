import { randomUUID } from "crypto";
import type { FileSystemItem, InsertFileSystemItem, WindowState, InsertWindowState } from "@shared/schema";

export interface IStorage {
  // File System Operations
  getFileSystemItems(): Promise<FileSystemItem[]>;
  getFileSystemItem(id: string): Promise<FileSystemItem | undefined>;
  createFileSystemItem(item: InsertFileSystemItem): Promise<FileSystemItem>;
  updateFileSystemItem(id: string, updates: Partial<FileSystemItem>): Promise<FileSystemItem>;
  deleteFileSystemItem(id: string): Promise<void>;
  
  // Window State Operations
  getWindows(): Promise<WindowState[]>;
  getWindow(id: string): Promise<WindowState | undefined>;
  createWindow(window: InsertWindowState): Promise<WindowState>;
  updateWindow(id: string, updates: Partial<WindowState>): Promise<WindowState>;
  deleteWindow(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private fileSystemItems: Map<string, FileSystemItem>;
  private windows: Map<string, WindowState>;
  private nextFileId: number = 1;
  private nextWindowId: number = 1;

  constructor() {
    this.fileSystemItems = new Map();
    this.windows = new Map();
    
    // Initialize with default file system
    this.initializeDefaultFileSystem();
  }

  private initializeDefaultFileSystem() {
    const defaultItems: FileSystemItem[] = [
      {
        id: "root-docs",
        name: "Documents",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-projects",
        name: "Projects",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-1",
        name: "readme.txt",
        type: "file",
        parentId: "root-docs",
        content: "Welcome to Terminal Simulator!\n\nThis is a sample text file.\nYou can edit this in Notepad or VS.Mock.",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-2",
        name: "example.js",
        type: "file",
        parentId: "root-projects",
        content: "// Sample JavaScript file\nconst greeting = 'Hello, World!';\nconsole.log(greeting);",
        language: "javascript",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
    ];

    defaultItems.forEach(item => {
      this.fileSystemItems.set(item.id, item);
    });
  }

  // File System Operations
  async getFileSystemItems(): Promise<FileSystemItem[]> {
    return Array.from(this.fileSystemItems.values());
  }

  async getFileSystemItem(id: string): Promise<FileSystemItem | undefined> {
    return this.fileSystemItems.get(id);
  }

  async createFileSystemItem(insertItem: InsertFileSystemItem): Promise<FileSystemItem> {
    const id = `fs-${this.nextFileId++}`;
    const item: FileSystemItem = {
      ...insertItem,
      id,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    this.fileSystemItems.set(id, item);
    return item;
  }

  async updateFileSystemItem(id: string, updates: Partial<FileSystemItem>): Promise<FileSystemItem> {
    const existing = this.fileSystemItems.get(id);
    if (!existing) {
      throw new Error(`File system item ${id} not found`);
    }
    const updated: FileSystemItem = {
      ...existing,
      ...updates,
      modifiedAt: Date.now(),
    };
    this.fileSystemItems.set(id, updated);
    return updated;
  }

  async deleteFileSystemItem(id: string): Promise<void> {
    // Recursively delete children first
    const children = Array.from(this.fileSystemItems.values()).filter(
      item => item.parentId === id
    );
    
    for (const child of children) {
      await this.deleteFileSystemItem(child.id);
    }
    
    // Then delete the item itself
    this.fileSystemItems.delete(id);
  }

  // Window State Operations
  async getWindows(): Promise<WindowState[]> {
    return Array.from(this.windows.values());
  }

  async getWindow(id: string): Promise<WindowState | undefined> {
    return this.windows.get(id);
  }

  async createWindow(insertWindow: InsertWindowState): Promise<WindowState> {
    const id = `win-${this.nextWindowId++}`;
    const window: WindowState = {
      ...insertWindow,
      id,
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      zIndex: this.windows.size + 1,
    };
    this.windows.set(id, window);
    return window;
  }

  async updateWindow(id: string, updates: Partial<WindowState>): Promise<WindowState> {
    const existing = this.windows.get(id);
    if (!existing) {
      throw new Error(`Window ${id} not found`);
    }
    
    // If updating zIndex (focusing), ensure it's the highest
    if (updates.zIndex !== undefined) {
      const maxZ = Math.max(...Array.from(this.windows.values()).map(w => w.zIndex), 0);
      updates.zIndex = maxZ + 1;
    }
    
    // Clamp position and size to valid ranges
    if (updates.position) {
      updates.position = {
        x: Math.max(0, updates.position.x),
        y: Math.max(0, updates.position.y),
      };
    }
    
    if (updates.size) {
      updates.size = {
        width: Math.max(400, updates.size.width),
        height: Math.max(300, updates.size.height),
      };
    }
    
    const updated: WindowState = {
      ...existing,
      ...updates,
    };
    this.windows.set(id, updated);
    return updated;
  }

  async deleteWindow(id: string): Promise<void> {
    this.windows.delete(id);
  }
}

export const storage = new MemStorage();
