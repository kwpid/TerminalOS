import { useState, useCallback } from "react";
import { WindowManager } from "@/components/WindowManager";
import { Taskbar } from "@/components/Taskbar";
import { TerminalApp } from "@/components/apps/TerminalApp";
import { VSStudioApp } from "@/components/apps/VSStudioApp";
import { FilesApp } from "@/components/apps/FilesApp";
import { NotepadApp } from "@/components/apps/NotepadApp";
import { TaskManagerApp } from "@/components/apps/TaskManagerApp";
import { WebBrowserApp } from "@/components/apps/WebBrowserApp";
import { WebStoreApp } from "@/components/apps/WebStoreApp";
import { VelocityApp } from "@/components/apps/VelocityApp";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useWindows } from "@/hooks/useWindows";
import type { WindowState, Process } from "@shared/schema";

let nextProcessId = 1;

export default function Desktop() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [currentDir, setCurrentDir] = useState<string | null>(null);
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
    const currentPath = currentDir ? fileSystem.find(i => i.id === currentDir) : null;
    const currentItems = fileSystem.filter(i => i.parentId === currentDir);
    
    switch (command.toLowerCase()) {
      case "help":
        return `Terminal Simulator v1.0.0

NAVIGATION:
  cd [path]          Change directory
  pwd                Print working directory
  ls [path]          List files/folders

FILE MANAGEMENT:
  mkdir [name]       Create folder
  touch [name]       Create file
  rm [name]          Remove file/folder
  cat [name]         Display file contents
  echo [text]        Print or write to file

WINDOW MANAGEMENT:
  open [name]        Open file or folder
  windows            List all open windows
  close [id]         Close window by ID
  getinfo [id]       Get window information
  taskmanager        Open task manager

SYSTEM:
  clear              Clear terminal screen`;

      case "pwd":
        return currentPath ? `/${currentPath.name}` : "/";

      case "cd":
        if (args.length === 0 || args[0] === "/") {
          setCurrentDir(null);
          return "Changed to root directory";
        }
        if (args[0] === "..") {
          if (currentPath && currentPath.parentId) {
            setCurrentDir(currentPath.parentId);
            const parent = fileSystem.find(i => i.id === currentPath.parentId);
            return `Changed to /${parent?.name || ""}`;
          } else {
            setCurrentDir(null);
            return "Changed to root directory";
          }
        }
        const targetFolder = currentItems.find(
          i => i.type === "folder" && i.name.toLowerCase() === args[0].toLowerCase()
        );
        if (!targetFolder) {
          return `Error: Directory "${args[0]}" not found`;
        }
        setCurrentDir(targetFolder.id);
        return `Changed to /${targetFolder.name}`;

      case "ls":
        const items = currentItems;
        if (items.length === 0) {
          return "Empty directory";
        }
        const output = items.map(i => {
          const icon = i.type === "folder" ? "📁" : i.type === "image" ? "🖼️" : "📄";
          const size = i.type === "file" ? ` (${i.content?.length || 0}B)` : "";
          return `${icon} ${i.name}${size}`;
        }).join("\n");
        return `Total ${items.length} items\n\n${output}`;

      case "mkdir":
        if (args.length === 0) {
          return "Error: Please specify folder name";
        }
        const folderName = args.join(" ");
        await createFileSystemItem(folderName, "folder", currentDir);
        return `Created folder: ${folderName}`;

      case "touch":
        if (args.length === 0) {
          return "Error: Please specify file name";
        }
        const fileName = args.join(" ");
        await createFileSystemItem(fileName, "file", currentDir, "");
        return `Created file: ${fileName}`;

      case "rm":
        if (args.length === 0) {
          return "Error: Please specify file or folder name";
        }
        const itemToDelete = currentItems.find(
          i => i.name.toLowerCase() === args[0].toLowerCase()
        );
        if (!itemToDelete) {
          return `Error: "${args[0]}" not found`;
        }
        await deleteFileSystemItem(itemToDelete.id);
        return `Removed: ${itemToDelete.name}`;

      case "cat":
        if (args.length === 0) {
          return "Error: Please specify file name";
        }
        const fileToRead = currentItems.find(
          i => i.type === "file" && i.name.toLowerCase() === args[0].toLowerCase()
        );
        if (!fileToRead) {
          return `Error: File "${args[0]}" not found`;
        }
        return fileToRead.content || "(empty file)";

      case "echo":
        if (args.length === 0) {
          return "";
        }
        const redirectIndex = args.indexOf(">");
        if (redirectIndex !== -1 && redirectIndex < args.length - 1) {
          const text = args.slice(0, redirectIndex).join(" ");
          const targetFile = args[redirectIndex + 1];
          const existingFile = currentItems.find(
            i => i.type === "file" && i.name.toLowerCase() === targetFile.toLowerCase()
          );
          if (existingFile) {
            await updateFileContent(existingFile.id, text);
            return `Wrote to ${targetFile}`;
          } else {
            await createFileSystemItem(targetFile, "file", currentDir, text);
            return `Created and wrote to ${targetFile}`;
          }
        }
        return args.join(" ");

      case "taskmanager":
        createWindow("taskmanager");
        return "Task Manager opened";

      case "open":
        if (args.length === 0) {
          return "Error: Please specify a file or folder to open";
        }
        const itemName = args.join(" ");
        const item = currentItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) {
          return `Error: "${itemName}" not found in current directory`;
        }
        if (item.type === "folder") {
          createWindow("files", `Files - ${item.name}`, { folderId: item.id });
        } else if (item.type === "image") {
          createWindow("notepad", `Image - ${item.name}`, { fileId: item.id });
        } else {
          createWindow("notepad", `Notepad - ${item.name}`, { fileId: item.id });
        }
        return `Opened ${item.name}`;

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
        return `Open Windows (${windows.length}):\n\n` + 
          windows.map(w => `• ${w.id.padEnd(15)} ${w.title}${w.isMinimized ? " (minimized)" : ""}`).join("\n");

      case "getinfo":
        if (args.length === 0) {
          return "Error: Please specify a window ID. Use 'windows' to see all window IDs.";
        }
        const targetWindow = windows.find(w => w.id === args[0]);
        if (!targetWindow) {
          return `Error: Window ID "${args[0]}" not found. Use 'windows' to see all window IDs.`;
        }
        const uptime = Date.now() - targetWindow.createdAt;
        const uptimeStr = `${Math.floor(uptime / 1000)}s`;
        const pathInfo = targetWindow.workspacePath ? `\nWorkspace Path: ${targetWindow.workspacePath}` : "";
        const dataInfo = targetWindow.data ? `\nData: ${JSON.stringify(targetWindow.data, null, 2)}` : "";
        return `Window Information:
  ID: ${targetWindow.id}
  Title: ${targetWindow.title}
  Type: ${targetWindow.appType}
  Status: ${targetWindow.isMinimized ? "Minimized" : targetWindow.isMaximized ? "Maximized" : "Normal"}
  Position: x=${targetWindow.position.x}, y=${targetWindow.position.y}
  Size: ${targetWindow.size.width}x${targetWindow.size.height}
  Z-Index: ${targetWindow.zIndex}
  Uptime: ${uptimeStr}${pathInfo}${dataInfo}`;

      case "clear":
        return "__CLEAR__";

      default:
        return `Command not found: ${command}\nType 'help' for available commands.`;
    }
  }, [fileSystem, windows, currentDir, createWindow, closeWindow, createFileSystemItem, deleteFileSystemItem, updateFileContent]);

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
              case "vsstudio":
                return (
                  <VSStudioApp
                    fileSystem={fileSystem}
                    onOpenFile={(fileId: string) => {}}
                    onSaveFile={updateFileContent}
                    onCreate={createFileSystemItem}
                    workspacePath={window.workspacePath}
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
              case "webstore":
                return <WebStoreApp onInstallApp={(appId) => {
                  if (appId === "velocity") {
                    createWindow("velocity");
                  }
                }} />;
              case "velocity":
                return <VelocityApp windows={windows} />;
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
        onCloseWindow={closeWindow}
      />
    </div>
  );
}

function getDefaultTitle(appType: WindowState["appType"]): string {
  switch (appType) {
    case "terminal": return "Terminal";
    case "vsstudio": return "VS.Studio";
    case "files": return "Files";
    case "notepad": return "Notepad";
    case "taskmanager": return "Task Manager";
    case "webbrowser": return "Web Browser";
    case "webstore": return "Web Store";
    case "velocity": return "Velocity";
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
    case "lua": return "lua";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "md": return "markdown";
    case "txt": return "plaintext";
    case "xml": return "xml";
    case "yml":
    case "yaml": return "yaml";
    default: return "plaintext";
  }
}
