import { useState, useRef, useEffect } from "react";
import { X, Minus, Square, Terminal as TerminalIcon, Code, FolderOpen, FileText, Activity, Globe, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WindowState } from "@shared/schema";

interface WindowManagerProps {
  windows: WindowState[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateSize: (id: string, size: { width: number; height: number }) => void;
  children: (window: WindowState) => React.ReactNode;
}

const APP_ICONS = {
  terminal: TerminalIcon,
  vsmock: Code,
  files: FolderOpen,
  notepad: FileText,
  taskmanager: Activity,
  webbrowser: Globe,
  webstore: Store,
  velocity: Zap,
};

export function WindowManager({
  windows,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdatePosition,
  onUpdateSize,
  children,
}: WindowManagerProps) {
  const [draggingWindow, setDraggingWindow] = useState<string | null>(null);
  const [resizingWindow, setResizingWindow] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [localSizes, setLocalSizes] = useState<Record<string, { width: number; height: number }>>({});
  const dragStartRef = useRef({ x: 0, y: 0, windowX: 0, windowY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const pendingUpdateRef = useRef<{ position?: { id: string; pos: { x: number; y: number } }; size?: { id: string; size: { width: number; height: number } } }>({});

  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingWindow || resizingWindow) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          if (draggingWindow) {
            const windowState = windows.find(w => w.id === draggingWindow);
            if (windowState && !windowState.isMaximized) {
              const deltaX = e.clientX - dragStartRef.current.x;
              const deltaY = e.clientY - dragStartRef.current.y;
              const newX = Math.max(0, Math.min(globalThis.innerWidth - 100, dragStartRef.current.windowX + deltaX));
              const newY = Math.max(0, Math.min(globalThis.innerHeight - 100, dragStartRef.current.windowY + deltaY));
              
              // Update local state immediately for smooth dragging
              setLocalPositions(prev => ({ ...prev, [draggingWindow]: { x: newX, y: newY } }));
              pendingUpdateRef.current.position = { id: draggingWindow, pos: { x: newX, y: newY } };
            }
          }
          
          if (resizingWindow) {
            const deltaX = e.clientX - resizeStartRef.current.x;
            const deltaY = e.clientY - resizeStartRef.current.y;
            const newWidth = Math.max(400, resizeStartRef.current.width + deltaX);
            const newHeight = Math.max(300, resizeStartRef.current.height + deltaY);
            
            // Update local state immediately for smooth resizing
            setLocalSizes(prev => ({ ...prev, [resizingWindow]: { width: newWidth, height: newHeight } }));
            pendingUpdateRef.current.size = { id: resizingWindow, size: { width: newWidth, height: newHeight } };
          }
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      // Save to API when dragging/resizing stops
      if (pendingUpdateRef.current.position) {
        const { id, pos } = pendingUpdateRef.current.position;
        onUpdatePosition(id, pos);
        pendingUpdateRef.current.position = undefined;
      }
      if (pendingUpdateRef.current.size) {
        const { id, size } = pendingUpdateRef.current.size;
        onUpdateSize(id, size);
        pendingUpdateRef.current.size = undefined;
      }
      
      setDraggingWindow(null);
      setResizingWindow(null);
    };

    if (draggingWindow || resizingWindow) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingWindow, resizingWindow, windows, onUpdatePosition, onUpdateSize]);

  return (
    <>
      {windows
        .filter(w => !w.isMinimized)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((window) => {
          const Icon = APP_ICONS[window.appType];
          // Use local position/size during drag/resize for smooth updates
          const position = localPositions[window.id] || window.position;
          const size = localSizes[window.id] || window.size;
          
          const style = window.isMaximized
            ? { top: 0, left: 0, width: "100%", height: "calc(100vh - 48px)" }
            : {
                top: position.y,
                left: position.x,
                width: size.width,
                height: size.height,
              };

          return (
            <div
              key={window.id}
              className="absolute bg-card border border-card-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
              style={{ ...style, zIndex: window.zIndex }}
              onMouseDown={() => onFocus(window.id)}
              data-testid={`window-${window.appType}-${window.id}`}
            >
              {/* Title Bar */}
              <div
                className="h-8 bg-card border-b border-card-border flex items-center justify-between px-3 cursor-move select-none"
                onMouseDown={(e) => {
                  if (!window.isMaximized) {
                    dragStartRef.current = {
                      x: e.clientX,
                      y: e.clientY,
                      windowX: window.position.x,
                      windowY: window.position.y,
                    };
                    setDraggingWindow(window.id);
                  }
                }}
                onDoubleClick={() => onMaximize(window.id)}
                data-testid={`titlebar-${window.id}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-foreground" />
                  <span className="text-xs font-medium text-foreground">{window.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMinimize(window.id);
                    }}
                    data-testid={`button-minimize-${window.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMaximize(window.id);
                    }}
                    data-testid={`button-maximize-${window.id}`}
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(window.id);
                    }}
                    data-testid={`button-close-${window.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden bg-background">
                {children(window)}
              </div>

              {/* Resize Handle */}
              {!window.isMaximized && (
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    resizeStartRef.current = {
                      x: e.clientX,
                      y: e.clientY,
                      width: window.size.width,
                      height: window.size.height,
                    };
                    setResizingWindow(window.id);
                  }}
                  data-testid={`resize-handle-${window.id}`}
                />
              )}
            </div>
          );
        })}
    </>
  );
}
