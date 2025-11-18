import { randomUUID } from "crypto";
import type { FileSystemItem, InsertFileSystemItem, WindowState, InsertWindowState, AppBackendCode } from "@shared/schema";

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
    
    // Initialize with default windows
    this.initializeDefaultWindows();
  }

  private initializeDefaultFileSystem() {
    const defaultItems: FileSystemItem[] = [
      {
        id: "root-desktop",
        name: "Desktop",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-docs",
        name: "Documents",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-downloads",
        name: "Downloads",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-pictures",
        name: "Pictures",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-music",
        name: "Music",
        type: "folder",
        parentId: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "root-videos",
        name: "Videos",
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
        id: "sample-readme",
        name: "README.md",
        type: "file",
        parentId: "root-desktop",
        content: "# Welcome to Terminal Simulator!\n\nThis is a desktop environment simulator with:\n- File management\n- Terminal commands\n- Code editor (VS.Mock)\n- Web browser\n- Task manager\n\nExplore and enjoy!",
        language: "markdown",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-notes",
        name: "notes.txt",
        type: "file",
        parentId: "root-docs",
        content: "My Notes\n========\n\n- Task 1: Complete project\n- Task 2: Review code\n- Task 3: Deploy application",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-todo",
        name: "todo.txt",
        type: "file",
        parentId: "root-docs",
        content: "TODO List:\n\n[ ] Morning meeting\n[ ] Review pull requests\n[ ] Update documentation\n[ ] Team standup at 3pm",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "web-folder",
        name: "Website",
        type: "folder",
        parentId: "root-projects",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-index",
        name: "index.html",
        type: "file",
        parentId: "web-folder",
        content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Website</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>",
        language: "html",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-style",
        name: "style.css",
        type: "file",
        parentId: "web-folder",
        content: "body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}",
        language: "css",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "fluxo-folder",
        name: "Fluxo Scripts",
        type: "folder",
        parentId: "root-projects",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-fluxo-intro",
        name: "intro.fluxo",
        type: "file",
        parentId: "fluxo-folder",
        content: `// Fluxo Language Introduction
// This is a sample Fluxo script

local app = window_Id(window-11)

export function simulate() {
  local info = app.info:(null)
  
  sys.log("Welcome to Fluxo!")
  sys.log("Window ID:", info.id)
  sys.log("Window Title:", info.title)
}`,
        language: "fluxo",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-fluxo-library",
        name: "library-demo.fluxo",
        type: "file",
        parentId: "fluxo-folder",
        content: `// Fluxo Library Demo
// Demonstrates working with window libraries

local app = window_Id(window-11)

export function getInfo(path, data, returnJson) {
  local data = app.info:(data)
  local path = data.libary{
    app.libary:find(crossSection)
  }

  sys.log("Library Path:", path)
  returnJson(path)
}

export function updateData(key, value) {
  local result = app.database:write(key, value)
  sys.log("Updated", key)
  return result
}`,
        language: "fluxo",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-fluxo-advanced",
        name: "advanced.fluxo",
        type: "file",
        parentId: "fluxo-folder",
        content: `// Advanced Fluxo Example
// Working with multiple windows and complex data

local mainWindow = window_Id(window-11)

export function processWindowData() {
  local windowInfo = mainWindow.info:(null)
  
  sys.log("=== Window Analysis ===")
  sys.log("ID:", windowInfo.id)
  sys.log("Type:", windowInfo.appType)
  sys.log("Title:", windowInfo.title)
  
  local sectionData = windowInfo.libary{
    mainWindow.libary:find(mainSection)
  }
  
  sys.log("=== Library Data ===")
  sys.log("Section:", sectionData)
  
  local crossData = windowInfo.libary{
    mainWindow.libary:find(crossSection)
  }
  
  sys.log("Cross-section:", crossData)
}`,
        language: "fluxo",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-script",
        name: "app.js",
        type: "file",
        parentId: "root-projects",
        content: "// Main application\nconst app = {\n  init() {\n    console.log('App initialized');\n  },\n  \n  run() {\n    this.init();\n    console.log('App is running!');\n  }\n};\n\napp.run();",
        language: "javascript",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
      {
        id: "sample-config",
        name: "config.json",
        type: "file",
        parentId: "root-projects",
        content: "{\n  \"appName\": \"Terminal Simulator\",\n  \"version\": \"1.0.0\",\n  \"theme\": \"dark\",\n  \"settings\": {\n    \"autoSave\": true,\n    \"fontSize\": 14\n  }\n}",
        language: "json",
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
    ];

    defaultItems.forEach(item => {
      this.fileSystemItems.set(item.id, item);
    });
  }

  private initializeDefaultWindows() {
    const defaultWindow: WindowState = {
      id: "default-vsstudio",
      appType: "vsstudio",
      title: "VS.Studio",
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 80 },
      size: { width: 900, height: 650 },
      zIndex: 1,
      data: {},
      createdAt: Date.now(),
      backendCode: this.generateBackendCode("vsstudio"),
    };
    this.windows.set(defaultWindow.id, defaultWindow);
  }

  private generateBackendCode(appType: string): AppBackendCode {
    const backendCodes = {
      vsstudio: {
        files: [
          {
            name: "editor.ts",
            path: "/src/editor.ts",
            content: `import { EditorState } from "./state";
import { FileManager } from "./fileManager";

export class CodeEditor {
  private state: EditorState;
  private fileManager: FileManager;
  
  constructor() {
    this.state = new EditorState();
    this.fileManager = new FileManager();
  }
  
  openFile(filePath: string) {
    const file = this.fileManager.loadFile(filePath);
    this.state.setActiveFile(file);
  }
  
  saveFile() {
    const content = this.state.getContent();
    this.fileManager.save(this.state.activeFile, content);
  }
}`,
            language: "typescript",
          },
          {
            name: "fileManager.ts",
            path: "/src/fileManager.ts",
            content: `export class FileManager {
  private cache: Map<string, string> = new Map();
  
  loadFile(path: string): string {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }
    // Load from file system
    const content = this.readFromDisk(path);
    this.cache.set(path, content);
    return content;
  }
  
  private readFromDisk(path: string): string {
    // Implementation hidden
    return "";
  }
}`,
            language: "typescript",
            isHidden: true,
          },
        ],
        logs: [
          "[INFO] Editor initialized",
          "[INFO] File manager ready",
          "[DEBUG] Syntax highlighting enabled",
        ],
        structure: "MVC Pattern with State Management",
      },
      terminal: {
        files: [
          {
            name: "shell.ts",
            path: "/src/shell.ts",
            content: `export class Shell {
  private currentDir: string = "/";
  private history: string[] = [];
  
  execute(command: string): string {
    this.history.push(command);
    const [cmd, ...args] = command.split(" ");
    return this.processCommand(cmd, args);
  }
  
  private processCommand(cmd: string, args: string[]): string {
    switch(cmd) {
      case "ls": return this.list();
      case "cd": return this.changeDir(args[0]);
      default: return "Command not found";
    }
  }
}`,
            language: "typescript",
          },
        ],
        logs: [
          "[INFO] Shell session started",
          "[DEBUG] Command parser loaded",
        ],
        structure: "Command Pattern",
      },
      files: {
        files: [
          {
            name: "fileExplorer.ts",
            path: "/src/fileExplorer.ts",
            content: `export class FileExplorer {
  private currentPath: string = "/";
  
  navigate(path: string) {
    this.currentPath = path;
    return this.listFiles(path);
  }
  
  listFiles(path: string) {
    // Returns file list
    return [];
  }
}`,
            language: "typescript",
          },
        ],
        logs: [
          "[INFO] File explorer initialized",
        ],
        structure: "Tree View Pattern",
      },
    };

    return backendCodes[appType as keyof typeof backendCodes] || {
      files: [],
      logs: [],
      structure: "Unknown",
    };
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
      createdAt: Date.now(),
      backendCode: this.generateBackendCode(insertWindow.appType),
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
