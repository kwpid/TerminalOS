import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, Plus, X, Save, FolderPlus, FilePlus, FolderOpen as FolderOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CodeEditor } from "@/components/CodeEditor";
import type { FileSystemItem } from "@shared/schema";

interface VSStudioAppProps {
  fileSystem: FileSystemItem[];
  onOpenFile: (fileId: string) => void;
  onSaveFile: (fileId: string, content: string) => void;
  onCreate: (name: string, type: "file" | "folder", parentId: string | null, content?: string) => Promise<FileSystemItem>;
  workspacePath?: string;
}

interface OpenTab {
  id: string;
  name: string;
  content: string;
  language: string;
}

export function VSStudioApp({ fileSystem, onOpenFile, onSaveFile, onCreate, workspacePath }: VSStudioAppProps) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<string>>(new Set());
  const [showDashboard, setShowDashboard] = useState(!workspacePath);
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<"folder" | "file" | "import">("folder");
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(workspacePath || null);
  const { toast } = useToast();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const openFileInEditor = (file: FileSystemItem) => {
    if (file.type !== "file") return;

    const existingTab = openTabs.find(tab => tab.id === file.id);
    if (existingTab) {
      setActiveTab(file.id);
      return;
    }

    const newTab: OpenTab = {
      id: file.id,
      name: file.name,
      content: file.content || "",
      language: file.language || "plaintext",
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTab(file.id);
    onOpenFile(file.id);
  };

  const closeTab = (tabId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      const remainingTabs = openTabs.filter(t => t.id !== tabId);
      setActiveTab(remainingTabs[0]?.id || null);
    }
  };

  const updateTabContent = (tabId: string, content: string) => {
    setOpenTabs(prev =>
      prev.map(tab => (tab.id === tabId ? { ...tab, content } : tab))
    );
    setHasUnsavedChanges(prev => new Set(Array.from(prev).concat(tabId)));
  };

  const saveFile = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab) {
      onSaveFile(tabId, tab.content);
      setHasUnsavedChanges(prev => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
      toast({
        title: "File saved",
        description: `${tab.name} has been saved.`,
      });
    }
  };

  const saveAllFiles = () => {
    hasUnsavedChanges.forEach(tabId => saveFile(tabId));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTab) {
          saveFile(activeTab);
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, openTabs]);

  const openDirectoryPicker = (action: "folder" | "file" | "import") => {
    setPickerAction(action);
    setSelectedDirectory(currentWorkspace);
    setNewItemName("");
    setShowDirectoryPicker(true);
  };

  const handleConfirmPicker = async () => {
    if (pickerAction === "import") {
      if (selectedDirectory) {
        setCurrentWorkspace(selectedDirectory);
        setShowDashboard(false);
        toast({
          title: "Workspace imported",
          description: `Opened workspace at ${fileSystem.find(f => f.id === selectedDirectory)?.name}`,
        });
      }
    } else {
      if (!newItemName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name",
          variant: "destructive",
        });
        return;
      }

      try {
        const newItem = await onCreate(
          newItemName,
          pickerAction,
          selectedDirectory,
          pickerAction === "file" ? "" : undefined
        );
        
        if (pickerAction === "folder") {
          setCurrentWorkspace(newItem.id);
          setShowDashboard(false);
        } else if (pickerAction === "file") {
          openFileInEditor(newItem);
        }

        toast({
          title: "Success",
          description: `Created ${pickerAction}: ${newItemName}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to create ${pickerAction}`,
          variant: "destructive",
        });
      }
    }
    
    setShowDirectoryPicker(false);
  };

  const renderFileTree = (parentId: string | null, level = 0) => {
    const items = fileSystem.filter(item => item.parentId === parentId);
    
    return items.map(item => {
      const isExpanded = expandedFolders.has(item.id);
      const isFolder = item.type === "folder";

      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-2 px-2 py-1 hover-elevate cursor-pointer text-sm`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.id);
              } else {
                openFileInEditor(item);
              }
            }}
            data-testid={`file-tree-item-${item.id}`}
          >
            {isFolder ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4" />
            )}
            {isFolder ? (
              <Folder className="w-4 h-4 text-yellow-400" />
            ) : (
              <File className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-foreground truncate">{item.name}</span>
            {!isFolder && item.language && (
              <span className="text-xs text-muted-foreground ml-auto">.{getExtensionForLanguage(item.language)}</span>
            )}
          </div>
          {isFolder && isExpanded && renderFileTree(item.id, level + 1)}
        </div>
      );
    });
  };

  const renderDirectoryPicker = (parentId: string | null, level = 0) => {
    const items = fileSystem.filter(item => item.parentId === parentId && item.type === "folder");
    
    return items.map(item => {
      const isExpanded = expandedFolders.has(item.id);

      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-2 px-2 py-1 hover-elevate cursor-pointer text-sm ${
              selectedDirectory === item.id ? "bg-accent" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              setSelectedDirectory(item.id);
              toggleFolder(item.id);
            }}
            data-testid={`directory-picker-item-${item.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Folder className="w-4 h-4 text-yellow-400" />
            <span className="text-foreground truncate">{item.name}</span>
          </div>
          {isExpanded && renderDirectoryPicker(item.id, level + 1)}
        </div>
      );
    });
  };

  const activeTabData = openTabs.find(tab => tab.id === activeTab);
  const workspaceItems = currentWorkspace ? fileSystem.filter(item => item.parentId === currentWorkspace || item.id === currentWorkspace) : fileSystem;

  if (showDashboard) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-8" data-testid="vsstudio-dashboard">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">VS.Studio</h1>
          <p className="text-muted-foreground mb-8">
            A modern code editor with file system integration
          </p>
          <div className="space-y-3">
            <Button
              variant="default"
              className="w-full justify-start gap-3"
              onClick={() => openDirectoryPicker("folder")}
              data-testid="button-create-folder"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Create New Folder</span>
            </Button>
            <Button
              variant="default"
              className="w-full justify-start gap-3"
              onClick={() => openDirectoryPicker("file")}
              data-testid="button-create-file"
            >
              <FilePlus className="w-5 h-5" />
              <span>Create New File</span>
            </Button>
            <Button
              variant="default"
              className="w-full justify-start gap-3"
              onClick={() => openDirectoryPicker("import")}
              data-testid="button-import-folder"
            >
              <FolderOpenIcon className="w-5 h-5" />
              <span>Import Folder</span>
            </Button>
          </div>
        </div>

        {/* Directory Picker Dialog */}
        <Dialog open={showDirectoryPicker} onOpenChange={setShowDirectoryPicker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {pickerAction === "import" ? "Select Folder to Open" : `Select Location for New ${pickerAction === "folder" ? "Folder" : "File"}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {pickerAction !== "import" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {pickerAction === "folder" ? "Folder" : "File"} Name:
                  </label>
                  <Input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${pickerAction} name...`}
                    data-testid="input-item-name"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {pickerAction === "import" ? "Select Folder:" : "Select Parent Directory:"}
                </label>
                <ScrollArea className="h-64 border border-card-border rounded-md">
                  <div
                    className={`flex items-center gap-2 px-2 py-2 hover-elevate cursor-pointer ${
                      selectedDirectory === null ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedDirectory(null)}
                    data-testid="directory-picker-root"
                  >
                    <FolderOpenIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-foreground">/ (Root)</span>
                  </div>
                  {renderDirectoryPicker(null)}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDirectoryPicker(false)} data-testid="button-cancel-picker">
                Cancel
              </Button>
              <Button onClick={handleConfirmPicker} data-testid="button-confirm-picker">
                {pickerAction === "import" ? "Open" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-60 bg-card border-r border-card-border flex flex-col" data-testid="vsstudio-sidebar">
          <div className="h-8 border-b border-card-border flex items-center justify-between px-3">
            <span className="text-xs font-medium text-foreground">EXPLORER</span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => openDirectoryPicker("file")}
                title="New File"
                data-testid="button-new-file"
              >
                <FilePlus className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => openDirectoryPicker("folder")}
                title="New Folder"
                data-testid="button-new-folder"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              {hasUnsavedChanges.size > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={saveAllFiles}
                  title="Save All"
                  data-testid="button-save-all"
                >
                  <Save className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1">
            {currentWorkspace ? renderFileTree(currentWorkspace) : renderFileTree(null)}
          </ScrollArea>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div className="h-8 bg-card border-b border-card-border flex items-center overflow-x-auto" data-testid="vsstudio-tabs">
            {openTabs.map(tab => (
              <div
                key={tab.id}
                className={`h-full px-3 flex items-center gap-2 border-r border-card-border cursor-pointer ${
                  activeTab === tab.id ? "bg-background" : "hover-elevate"
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <File className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-foreground">
                  {tab.name}
                  {hasUnsavedChanges.has(tab.id) && " •"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasUnsavedChanges.has(tab.id)) {
                      if (confirm(`${tab.name} has unsaved changes. Close anyway?`)) {
                        closeTab(tab.id);
                      }
                    } else {
                      closeTab(tab.id);
                    }
                  }}
                  data-testid={`button-close-tab-${tab.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          {activeTabData ? (
            <CodeEditor
              value={activeTabData.content}
              onChange={(content) => updateTabContent(activeTabData.id, content)}
              language={activeTabData.language}
              placeholder="Start typing..."
              data-testid="vsstudio-editor"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <p className="text-sm">No file open</p>
                <p className="text-xs mt-2">Open a file from the explorer to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Directory Picker Dialog */}
      <Dialog open={showDirectoryPicker} onOpenChange={setShowDirectoryPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {pickerAction === "import" ? "Select Folder to Open" : `Select Location for New ${pickerAction === "folder" ? "Folder" : "File"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pickerAction !== "import" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {pickerAction === "folder" ? "Folder" : "File"} Name:
                </label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${pickerAction} name...`}
                  data-testid="input-item-name"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {pickerAction === "import" ? "Select Folder:" : "Select Parent Directory:"}
              </label>
              <ScrollArea className="h-64 border border-card-border rounded-md">
                <div
                  className={`flex items-center gap-2 px-2 py-2 hover-elevate cursor-pointer ${
                    selectedDirectory === null ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedDirectory(null)}
                  data-testid="directory-picker-root"
                >
                  <FolderOpenIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-foreground">/ (Root)</span>
                </div>
                {renderDirectoryPicker(null)}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDirectoryPicker(false)} data-testid="button-cancel-picker">
              Cancel
            </Button>
            <Button onClick={handleConfirmPicker} data-testid="button-confirm-picker">
              {pickerAction === "import" ? "Open" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getExtensionForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript": return "js";
    case "typescript": return "ts";
    case "python": return "py";
    case "lua": return "lua";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "markdown": return "md";
    case "xml": return "xml";
    case "yaml": return "yml";
    default: return "txt";
  }
}
