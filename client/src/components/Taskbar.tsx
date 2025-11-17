import { useState, useEffect } from "react";
import { Terminal, Code, FolderOpen, FileText, Activity, Globe, Menu, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { WindowState } from "@shared/schema";

interface TaskbarProps {
  windows: WindowState[];
  onOpenApp: (appType: WindowState["appType"]) => void;
  onFocusWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
}

const APP_MENU = [
  { type: "terminal" as const, icon: Terminal, label: "Terminal", color: "text-green-400" },
  { type: "vsmock" as const, icon: Code, label: "VS.Mock", color: "text-blue-400" },
  { type: "files" as const, icon: FolderOpen, label: "Files", color: "text-yellow-400" },
  { type: "notepad" as const, icon: FileText, label: "Notepad", color: "text-gray-400" },
  { type: "taskmanager" as const, icon: Activity, label: "Task Manager", color: "text-red-400" },
  { type: "webbrowser" as const, icon: Globe, label: "Web Browser", color: "text-purple-400" },
];

export function Taskbar({ windows, onOpenApp, onFocusWindow, onMinimizeWindow }: TaskbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="space-y-1">
            {APP_MENU.map((app) => {
              const Icon = app.icon;
              return (
                <Button
                  key={app.type}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => {
                    onOpenApp(app.type);
                    setMenuOpen(false);
                  }}
                  data-testid={`menu-item-${app.type}`}
                >
                  <Icon className={`w-5 h-5 ${app.color}`} />
                  <span className="text-sm">{app.label}</span>
                </Button>
              );
            })}
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
            <Button
              key={window.id}
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
    </div>
  );
}
