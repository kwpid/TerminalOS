import { useState, useCallback } from "react";
import { WindowManager } from "@/components/WindowManager";
import { Taskbar } from "@/components/Taskbar";
import { TerminalApp } from "@/components/apps/TerminalApp";
import { VSMockApp } from "@/components/apps/VSMockApp";
import { FilesApp } from "@/components/apps/FilesApp";
import { NotepadApp } from "@/components/apps/NotepadApp";
import { TaskManagerApp } from "@/components/apps/TaskManagerApp";
import { WebBrowserApp } from "@/components/apps/WebBrowserApp";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useWindows } from "@/hooks/useWindows";
import type { WindowState, Process } from "@shared/schema";

let nextProcessId = 1;

export default function Desktop() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const { fileSystem, isLoading: fsLoading, createItem, updateItem, deleteItem } = useFileSystem();
  const { windows, isLoading: windowsLoading, createWindow: createWindowAPI, updateWindow: updateWindowAPI, deleteWindow: deleteWindowAPI } = useWindows();

  const getNextZIndex = () => {
    return windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) + 1 : 1;
  };

  const createWindow = useCallback(async (appType: WindowState["appType"], title?: string, data?: any) => {
    const newWindow = await createWindowAPI({
      appType,
      title: title || getDefaultTitle(appType),
      data,
    });

    // Create process
    const process: Process = {
      id: `proc-${nextProcessId++}`,
      name: newWindow.title,
      type: "window",
      cpu: Math.random() * 10,
      memory: Math.random() * 100 + 50,
      windowId: newWindow.id,
    };
    setProcesses(prev => [...prev, process]);

    return newWindow.id;
  }, [createWindowAPI]);

  const closeWindow = useCallback(async (id: string) => {
    await deleteWindowAPI(id);
    setProcesses(prev => prev.filter(p => p.windowId !== id));
  }, [deleteWindowAPI]);

  const minimizeWindow = useCallback(async (id: string) => {
    const window = windows.find(w => w.id === id);
    if (window) {
      await updateWindowAPI({ id, updates: { isMinimized: !window.isMinimized } });
    }
  }, [windows, updateWindowAPI]);

  const maximizeWindow = useCallback(async (id: string) => {
    const window = windows.find(w => w.id === id);
    if (window) {
      await updateWindowAPI({ id, updates: { isMaximized: !window.isMaximized } });
    }
  }, [windows, updateWindowAPI]);

  const focusWindow = useCallback(async (id: string) => {
    const maxZ = getNextZIndex();
    await updateWindowAPI({ id, updates: { zIndex: maxZ, isMinimized: false } });
  }, [updateWindowAPI, windows]);

  const updateWindowPosition = useCallback(async (id: string, position: { x: number; y: number }) => {
    await updateWindowAPI({ id, updates: { position } });
  }, [updateWindowAPI]);

  const updateWindowSize = useCallback(async (id: string, size: { width: number; height: number }) => {
    await updateWindowAPI({ id, updates: { size } });
  }, [updateWindowAPI]);

  // File System Operations
  const createFileSystemItem = useCallback(async (name: string, type: "file" | "folder", parentId: string | null, content?: string) => {
    const newItem = await createItem({
      name,
      type,
      parentId,
      content: content || "",
      language: type === "file" ? detectLanguage(name) : undefined,
    });
    return newItem;
  }, [createItem]);

  const deleteFileSystemItem = useCallback(async (id: string) => {
    // Backend handles recursive deletion
    await deleteItem(id);
  }, [deleteItem]);

  const updateFileContent = useCallback(async (id: string, content: string) => {
    await updateItem({ id, updates: { content } });
  }, [updateItem]);

  // Terminal Command Handler
  const handleTerminalCommand = useCallback(async (command: string, args: string[]): Promise<string> => {
    switch (command.toLowerCase()) {
      case "help":
        return `Available commands:
  open [name] - Opens specified folder or file
  taskmanager - Opens task manager
  help - Shows this list of commands
  getinfo [name] - Gets data from specified target
  close [window-id] - Closes window by ID
  windows - Lists all open windows with IDs
  ls - Lists files in current directory
  clear - Clears the terminal`;

      case "taskmanager":
        createWindow("taskmanager");
        return "Task Manager opened";

      case "open":
        if (args.length === 0) {
          return "Error: Please specify a file or folder to open";
        }
        const itemName = args.join(" ");
        const item = fileSystem.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) {
          return `Error: "${itemName}" not found`;
        }
        if (item.type === "folder") {
          createWindow("files", `Files - ${item.name}`, { folderId: item.id });
        } else {
          createWindow("notepad", `Notepad - ${item.name}`, { fileId: item.id });
        }
        return `Opened ${item.name}`;

      case "getinfo":
        if (args.length === 0) {
          return "Error: Please specify a target";
        }
        const target = args.join(" ");
        const targetItem = fileSystem.find(i => i.name.toLowerCase() === target.toLowerCase());
        if (!targetItem) {
          return `Error: "${target}" not found`;
        }
        return `Name: ${targetItem.name}
Type: ${targetItem.type}
Created: ${new Date(targetItem.createdAt).toLocaleString()}
Modified: ${new Date(targetItem.modifiedAt).toLocaleString()}
${targetItem.type === "file" ? `Size: ${targetItem.content?.length || 0} bytes` : ""}`;

      case "close":
        if (args.length === 0) {
          return "Error: Please specify a window ID";
        }
        const windowId = args[0];
        const windowToClose = windows.find(w => w.id === windowId);
        if (!windowToClose) {
          return `Error: Window ID "${windowId}" not found. Use 'windows' to see all window IDs.`;
        }
        closeWindow(windowToClose.id);
        return `Closed ${windowToClose.title}`;

      case "windows":
        if (windows.length === 0) {
          return "No windows open";
        }
        return windows.map(w => `ID: ${w.id} | ${w.title}${w.isMinimized ? " (minimized)" : ""}`).join("\n");

      case "ls":
        const items = fileSystem.filter(i => i.parentId === null);
        if (items.length === 0) {
          return "No files or folders";
        }
        return items.map(i => `${i.type === "folder" ? "📁" : "📄"} ${i.name}`).join("\n");

      case "clear":
        return "__CLEAR__";

      default:
        return `Command not found: ${command}. Type 'help' for available commands.`;
    }
  }, [fileSystem, windows, createWindow, closeWindow]);

  const endProcess = useCallback((processId: string) => {
    const process = processes.find(p => p.id === processId);
    if (process?.windowId) {
      closeWindow(process.windowId);
    }
    setProcesses(prev => prev.filter(p => p.id !== processId));
  }, [processes, closeWindow]);

  if (fsLoading || windowsLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-purple-950 to-black">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-foreground text-sm">Loading Terminal Simulator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background" data-testid="desktop">
      {/* Desktop Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-black" />

      {/* Windows */}
      <div className="absolute inset-0" style={{ paddingBottom: "48px" }}>
        <WindowManager
          windows={windows}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onFocus={focusWindow}
          onUpdatePosition={updateWindowPosition}
          onUpdateSize={updateWindowSize}
        >
          {(window) => {
            switch (window.appType) {
              case "terminal":
                return <TerminalApp onCommand={handleTerminalCommand} />;
              case "vsmock":
                return (
                  <VSMockApp
                    fileSystem={fileSystem}
                    onOpenFile={(fileId) => {}}
                    onSaveFile={updateFileContent}
                  />
                );
              case "files":
                return (
                  <FilesApp
                    fileSystem={fileSystem}
                    onNavigate={() => {}}
                    onCreateFolder={(name, parentId) => createFileSystemItem(name, "folder", parentId)}
                    onCreateFile={(name, parentId) => createFileSystemItem(name, "file", parentId)}
                    onDeleteItem={deleteFileSystemItem}
                    onOpenFile={(file) => {
                      createWindow("notepad", `Notepad - ${file.name}`, { fileId: file.id });
                    }}
                  />
                );
              case "notepad":
                const file = window.data?.fileId
                  ? fileSystem.find(f => f.id === window.data.fileId)
                  : undefined;
                return (
                  <NotepadApp
                    initialContent={file?.content || ""}
                    onSave={(content) => {
                      if (file) {
                        updateFileContent(file.id, content);
                      }
                    }}
                  />
                );
              case "taskmanager":
                return <TaskManagerApp processes={processes} onEndTask={endProcess} />;
              case "webbrowser":
                return <WebBrowserApp initialUrl={window.data?.url} />;
              default:
                return <div>Unknown app type</div>;
            }
          }}
        </WindowManager>
      </div>

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onOpenApp={(appType) => createWindow(appType)}
        onFocusWindow={focusWindow}
        onMinimizeWindow={minimizeWindow}
      />
    </div>
  );
}

function getDefaultTitle(appType: WindowState["appType"]): string {
  switch (appType) {
    case "terminal": return "Terminal";
    case "vsmock": return "VS.Mock";
    case "files": return "Files";
    case "notepad": return "Notepad";
    case "taskmanager": return "Task Manager";
    case "webbrowser": return "Web Browser";
    default: return "Window";
  }
}

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js": return "javascript";
    case "ts": return "typescript";
    case "jsx": return "javascript";
    case "tsx": return "typescript";
    case "py": return "python";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "md": return "markdown";
    default: return "plaintext";
  }
}
