import { useState, useEffect } from "react";
import { Terminal, Code, FolderOpen, FileText, Activity, Globe, Menu, Clock, Store, Zap, X, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WindowState } from "@shared/schema";

interface TaskbarProps {
  windows: WindowState[];
  onOpenApp: (appType: WindowState["appType"]) => void;
  onFocusWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
}

const APP_MENU = [
  { type: "terminal" as const, icon: Terminal, label: "Terminal", color: "text-green-400" },
  { type: "vsstudio" as const, icon: Code, label: "VS.Studio", color: "text-blue-400" },
  { type: "files" as const, icon: FolderOpen, label: "Files", color: "text-yellow-400" },
  { type: "notepad" as const, icon: FileText, label: "Notepad", color: "text-gray-400" },
  { type: "webbrowser" as const, icon: Globe, label: "Web Browser", color: "text-purple-400" },
  { type: "webstore" as const, icon: Store, label: "Web Store", color: "text-cyan-400" },
  { type: "velocity" as const, icon: Zap, label: "Velocity", color: "text-orange-400" },
  { type: "taskmanager" as const, icon: Activity, label: "Task Manager", color: "text-red-400" },
];

export function Taskbar({ windows, onOpenApp, onFocusWindow, onMinimizeWindow, onCloseWindow }: TaskbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [propertiesWindow, setPropertiesWindow] = useState<WindowState | null>(null);
  const [recentApps, setRecentApps] = useState<WindowState["appType"][]>([]);

  /**
   * Formats uptime from a timestamp (number in milliseconds, ISO date string, or Date object)
   * According to shared/schema.ts, WindowState.createdAt is a number (milliseconds since epoch)
   */
  const formatUptime = (createdAt: string | Date | number | null | undefined) => {
    if (!createdAt) return "Unknown";
    
    // Convert to Date object - handles number (ms timestamp), string (ISO date), or Date
    const createdDate = new Date(createdAt);
    
    // Validate the resulting date is valid
    if (isNaN(createdDate.getTime())) return "Unknown";
    
    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();
    
    // Additional validation: ensure the timestamp is reasonable (not in the future, not too old)
    if (diff < 0 || diff > 1000 * 60 * 60 * 24 * 365) {
      // Negative time (future) or more than 1 year is suspicious
      return "Unknown";
    }
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Track recent apps
  useEffect(() => {
    const appTypes = windows.map(w => w.appType);
    const uniqueApps = Array.from(new Set([...appTypes, ...recentApps])).slice(0, 6);
    if (JSON.stringify(uniqueApps) !== JSON.stringify(recentApps)) {
      setRecentApps(uniqueApps);
    }
  }, [windows]);

  const filteredApps = searchQuery.trim()
    ? APP_MENU.filter(app => app.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : APP_MENU.filter(app => recentApps.includes(app.type));

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-card border-t border-card-border flex items-center px-2 gap-2 z-50" data-testid="taskbar">
      {/* Start Menu */}
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            data-testid="button-start-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-64 p-2 bg-popover border-popover-border"
          data-testid="start-menu"
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
                data-testid="input-search-apps"
              />
            </div>
            
            {!searchQuery.trim() && filteredApps.length > 0 && (
              <div className="text-xs text-muted-foreground px-2">Recent</div>
            )}
            
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredApps.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {searchQuery.trim() ? "No apps found" : "No recent apps"}
                </div>
              ) : (
                filteredApps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Button
                      key={app.type}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10"
                      onClick={() => {
                        onOpenApp(app.type);
                        setMenuOpen(false);
                        setSearchQuery("");
                      }}
                      data-testid={`menu-item-${app.type}`}
                    >
                      <Icon className={`w-5 h-5 ${app.color}`} />
                      <span className="text-sm">{app.label}</span>
                    </Button>
                  );
                })
              )}
            </div>
            
            {searchQuery.trim() && (
              <div className="text-xs text-muted-foreground px-2 pt-1 border-t">
                {filteredApps.length} {filteredApps.length === 1 ? "app" : "apps"} found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Running Windows */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {windows.map((window) => {
          const app = APP_MENU.find(a => a.type === window.appType);
          if (!app) return null;
          const Icon = app.icon;

          return (
            <ContextMenu key={window.id}>
              <ContextMenuTrigger asChild>
                <Button
                  variant={window.isMinimized ? "ghost" : "secondary"}
                  className="h-9 px-3 gap-2 max-w-[200px]"
                  onClick={() => {
                    if (window.isMinimized) {
                      onFocusWindow(window.id);
                    } else {
                      onMinimizeWindow(window.id);
                    }
                  }}
                  data-testid={`taskbar-window-${window.id}`}
                >
                  <Icon className={`w-4 h-4 ${app.color} flex-shrink-0`} />
                  <span className="text-xs truncate">{window.title}</span>
                </Button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48" data-testid={`context-menu-${window.id}`}>
                <ContextMenuItem
                  onClick={() => setPropertiesWindow(window)}
                  data-testid={`menu-item-properties-${window.id}`}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Properties
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onCloseWindow(window.id)}
                  className="text-destructive"
                  data-testid={`menu-item-close-${window.id}`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground" data-testid="system-clock">
          <Clock className="w-4 h-4" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Window Properties Dialog */}
      <Dialog open={!!propertiesWindow} onOpenChange={() => setPropertiesWindow(null)}>
        <DialogContent className="sm:max-w-md" data-testid="window-properties-dialog">
          <DialogHeader>
            <DialogTitle>Window Properties</DialogTitle>
          </DialogHeader>
          {propertiesWindow && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Window ID</div>
                <div className="font-mono text-xs bg-muted p-2 rounded-md mt-1" data-testid="property-window-id">
                  {propertiesWindow.id}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Title</div>
                <div className="mt-1" data-testid="property-title">{propertiesWindow.title}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Application Type</div>
                <div className="mt-1" data-testid="property-app-type">{propertiesWindow.appType}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Path</div>
                <div className="font-mono text-xs bg-muted p-2 rounded-md mt-1" data-testid="property-path">
                  {propertiesWindow.path || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Uptime</div>
                <div className="mt-1" data-testid="property-uptime">
                  {formatUptime(propertiesWindow.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">State</div>
                <div className="mt-1 flex gap-2 flex-wrap" data-testid="property-state">
                  {propertiesWindow.isMinimized && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md">Minimized</span>}
                  {propertiesWindow.isMaximized && <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-md">Maximized</span>}
                  {!propertiesWindow.isMinimized && !propertiesWindow.isMaximized && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-md">Normal</span>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
