import { z } from "zod";

// File System Types
export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  content?: string; // For files
  language?: string; // For code files in VS.Mock
  createdAt: number;
  modifiedAt: number;
}

export const insertFileSystemItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["file", "folder"]),
  parentId: z.string().nullable(),
  content: z.string().optional(),
  language: z.string().optional(),
});

export type InsertFileSystemItem = z.infer<typeof insertFileSystemItemSchema>;

// Window Management Types
export interface WindowState {
  id: string;
  appType: "terminal" | "vsmock" | "files" | "notepad" | "taskmanager" | "webbrowser";
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  data?: any; // App-specific data (e.g., file path for notepad, url for browser)
}

export const insertWindowStateSchema = z.object({
  appType: z.enum(["terminal", "vsmock", "files", "notepad", "taskmanager", "webbrowser"]),
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
    command: "open",
    params: ["ref/value"],
    description: "Opens specified folder or file",
    syntax: "open [ref/value]"
  },
  {
    command: "taskmanager",
    params: [],
    description: "Opens task manager",
    syntax: "taskmanager"
  },
  {
    command: "help",
    params: [],
    description: "Shows a list of commands",
    syntax: "help"
  },
  {
    command: "getinfo",
    params: ["trg"],
    description: "Gets data from specified target",
    syntax: "getinfo [trg]"
  },
  {
    command: "close",
    params: ["ref/trg"],
    description: "Closes an opened target",
    syntax: "close [ref/trg]"
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
