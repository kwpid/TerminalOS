import { useState } from "react";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NotepadAppProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

export function NotepadApp({ initialContent = "", onSave }: NotepadAppProps) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    onSave?.(content);
    setSaved(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaved(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Menu Bar */}
      <div className="h-8 bg-card border-b border-card-border flex items-center px-3 gap-4">
        <Button
          size="sm"
          variant="ghost"
          className="h-6"
          onClick={handleSave}
          data-testid="button-save"
        >
          <Save className="w-3 h-3 mr-2" />
          Save
        </Button>
        {!saved && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>

      {/* Text Area */}
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 font-mono"
        placeholder="Start typing..."
        data-testid="notepad-textarea"
      />

      {/* Status Bar */}
      <div className="h-6 bg-card border-t border-card-border flex items-center justify-between px-3 text-xs text-muted-foreground">
        <span>Lines: {content.split('\n').length}</span>
        <span>Characters: {content.length}</span>
      </div>
    </div>
  );
}
