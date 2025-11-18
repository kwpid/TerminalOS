import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Adjust position to keep menu on screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const adjustedX = Math.min(x, window.innerWidth - rect.width - 10);
      const adjustedY = Math.min(y, window.innerHeight - rect.height - 10);
      
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-card-border rounded-md shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover-elevate ${
            item.variant === "destructive"
              ? "text-destructive"
              : "text-foreground"
          }`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          data-testid={`context-menu-item-${index}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
