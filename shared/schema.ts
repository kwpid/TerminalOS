import { z } from "zod";

// File System Types
export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder" | "image";
  parentId: string | null;
  content?: string; // For files and base64 for images
  language?: string; // For code files in VS.Mock
  mimeType?: string; // For image files
  createdAt: number;
  modifiedAt: number;
}

export const insertFileSystemItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["file", "folder", "image"]),
  parentId: z.string().nullable(),
  content: z.string().optional(),
  language: z.string().optional(),
  mimeType: z.string().optional(),
});

export type InsertFileSystemItem = z.infer<typeof insertFileSystemItemSchema>;

// Window Management Types
export interface WindowState {
  id: string;
  appType: "terminal" | "vsmock" | "files" | "notepad" | "taskmanager" | "webbrowser" | "webstore" | "velocity";
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  data?: any; // App-specific data (e.g., file path for notepad, url for browser)
  backendCode?: AppBackendCode; // Backend code for the app
}

export interface AppBackendCode {
  files: BackendFile[];
  logs: string[];
  structure: string;
}

export interface BackendFile {
  name: string;
  path: string;
  content: string;
  language: string;
  isHidden?: boolean; // For Velocity challenge feature
}

export const insertWindowStateSchema = z.object({
  appType: z.enum(["terminal", "vsmock", "files", "notepad", "taskmanager", "webbrowser", "webstore", "velocity"]),
  title: z.string(),
  data: z.any().optional(),
});

export type InsertWindowState = z.infer<typeof insertWindowStateSchema>;

// Terminal Command Types
export interface TerminalCommand {
  command: string;
  params: string[];
  description: string;
  syntax: string;
}

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    command: "help",
    params: [],
    description: "Shows available commands",
    syntax: "help"
  },
  {
    command: "cd",
    params: ["path"],
    description: "Change current directory",
    syntax: "cd [path]"
  },
  {
    command: "pwd",
    params: [],
    description: "Print working directory",
    syntax: "pwd"
  },
  {
    command: "ls",
    params: ["path?"],
    description: "List files in directory",
    syntax: "ls [path]"
  },
  {
    command: "mkdir",
    params: ["name"],
    description: "Create a new folder",
    syntax: "mkdir [name]"
  },
  {
    command: "touch",
    params: ["name"],
    description: "Create a new file",
    syntax: "touch [name]"
  },
  {
    command: "rm",
    params: ["name"],
    description: "Remove a file or folder",
    syntax: "rm [name]"
  },
  {
    command: "cat",
    params: ["name"],
    description: "Display file contents",
    syntax: "cat [name]"
  },
  {
    command: "echo",
    params: ["text", ">", "file?"],
    description: "Print text or write to file",
    syntax: "echo [text] [> file]"
  },
  {
    command: "open",
    params: ["name"],
    description: "Open file or folder",
    syntax: "open [name]"
  },
  {
    command: "taskmanager",
    params: [],
    description: "Open task manager",
    syntax: "taskmanager"
  },
  {
    command: "windows",
    params: [],
    description: "List all open windows",
    syntax: "windows"
  },
  {
    command: "close",
    params: ["window-id"],
    description: "Close window by ID",
    syntax: "close [window-id]"
  },
  {
    command: "clear",
    params: [],
    description: "Clear the terminal",
    syntax: "clear"
  }
];

// Process/Task Manager Types
export interface Process {
  id: string;
  name: string;
  type: "app" | "window";
  cpu: number;
  memory: number;
  windowId?: string;
}
