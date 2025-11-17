import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileSystemItem } from "@shared/schema";

interface VSMockAppProps {
  fileSystem: FileSystemItem[];
  onOpenFile: (fileId: string) => void;
  onSaveFile: (fileId: string, content: string) => void;
}

interface OpenTab {
  id: string;
  name: string;
  content: string;
  language: string;
}

export function VSMockApp({ fileSystem, onOpenFile, onSaveFile }: VSMockAppProps) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      setActiveTab(openTabs[0]?.id || null);
    }
  };

  const updateTabContent = (tabId: string, content: string) => {
    setOpenTabs(prev =>
      prev.map(tab => (tab.id === tabId ? { ...tab, content } : tab))
    );
    onSaveFile(tabId, content);
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
          </div>
          {isFolder && isExpanded && renderFileTree(item.id, level + 1)}
        </div>
      );
    });
  };

  const activeTabData = openTabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-60 bg-card border-r border-card-border flex flex-col" data-testid="vsmock-sidebar">
          <div className="h-8 border-b border-card-border flex items-center justify-between px-3">
            <span className="text-xs font-medium text-foreground">EXPLORER</span>
          </div>
          <ScrollArea className="flex-1">
            {renderFileTree(null)}
          </ScrollArea>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div className="h-8 bg-card border-b border-card-border flex items-center overflow-x-auto" data-testid="vsmock-tabs">
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
                <span className="text-xs text-foreground">{tab.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
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
            <Textarea
              value={activeTabData.content}
              onChange={(e) => updateTabContent(activeTabData.id, e.target.value)}
              className="w-full h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0"
              placeholder="Start typing..."
              data-testid="vsmock-editor"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No file open</p>
                <p className="text-xs mt-2">Open a file from the explorer to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Code({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
