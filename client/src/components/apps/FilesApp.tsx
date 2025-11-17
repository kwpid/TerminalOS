import { useState } from "react";
import { ArrowLeft, Folder, File, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileSystemItem } from "@shared/schema";

interface FilesAppProps {
  fileSystem: FileSystemItem[];
  onNavigate: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreateFile: (name: string, parentId: string | null) => void;
  onDeleteItem: (id: string) => void;
  onOpenFile: (file: FileSystemItem) => void;
}

export function FilesApp({
  fileSystem,
  onNavigate,
  onCreateFolder,
  onCreateFile,
  onDeleteItem,
  onOpenFile,
}: FilesAppProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentFolder = currentFolderId ? fileSystem.find(item => item.id === currentFolderId) : null;
  const items = fileSystem.filter(item => item.parentId === currentFolderId);
  
  const filteredItems = searchQuery
    ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    onNavigate(folderId);
  };

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === "folder") {
      handleNavigate(item.id);
    } else {
      onOpenFile(item);
    }
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: FileSystemItem[] = [];
    let current = currentFolder;
    
    while (current) {
      breadcrumbs.unshift(current);
      current = current.parentId ? fileSystem.find(item => item.id === current!.parentId) : undefined;
    }
    
    return breadcrumbs;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-10 bg-card border-b border-card-border flex items-center px-3 gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => currentFolder && handleNavigate(currentFolder.parentId)}
          disabled={!currentFolder}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1 text-sm overflow-x-auto" data-testid="breadcrumb">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => handleNavigate(null)}
          >
            Root
          </Button>
          {getBreadcrumbs().map((folder, i) => (
            <div key={folder.id} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => handleNavigate(folder.id)}
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 text-sm"
            data-testid="input-search"
          />
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={() => {
            const name = prompt("Folder name:");
            if (name) onCreateFolder(name, currentFolderId);
          }}
          data-testid="button-new-folder"
        >
          <Plus className="w-4 h-4 mr-1" />
          Folder
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={() => {
            const name = prompt("File name:");
            if (name) onCreateFile(name, currentFolderId);
          }}
          data-testid="button-new-file"
        >
          <Plus className="w-4 h-4 mr-1" />
          File
        </Button>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">This folder is empty</p>
              <p className="text-xs mt-2">Create a new file or folder to get started</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-4 gap-4 p-4" data-testid="files-grid">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 p-3 rounded-md hover-elevate cursor-pointer"
                onClick={() => handleItemClick(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (confirm(`Delete ${item.name}?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                data-testid={`file-item-${item.id}`}
              >
                {item.type === "folder" ? (
                  <Folder className="w-12 h-12 text-yellow-400" />
                ) : (
                  <File className="w-12 h-12 text-blue-400" />
                )}
                <span className="text-xs text-center text-foreground truncate w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1" data-testid="files-list">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                onClick={() => handleItemClick(item)}
                data-testid={`file-item-${item.id}`}
              >
                {item.type === "folder" ? (
                  <Folder className="w-5 h-5 text-yellow-400" />
                ) : (
                  <File className="w-5 h-5 text-blue-400" />
                )}
                <span className="flex-1 text-sm text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.modifiedAt).toLocaleDateString()}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${item.name}?`)) {
                      onDeleteItem(item.id);
                    }
                  }}
                  data-testid={`button-delete-${item.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
