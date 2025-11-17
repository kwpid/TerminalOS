import { useState, useRef, useEffect } from "react";
import { TERMINAL_COMMANDS } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TerminalLine {
  type: "command" | "output" | "error";
  text: string;
}

interface TerminalAppProps {
  onCommand: (command: string, args: string[]) => Promise<string>;
}

export function TerminalApp({ onCommand }: TerminalAppProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", text: "Terminal Simulator v1.0.0" },
    { type: "output", text: "Type 'help' for available commands" },
    { type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<typeof TERMINAL_COMMANDS>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Update suggestions based on input
    if (input.startsWith("/")) {
      const searchTerm = input.slice(1).toLowerCase();
      const matches = TERMINAL_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().startsWith(searchTerm)
      );
      setSuggestions(matches);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    const commandLine = trimmedInput.startsWith("/") ? trimmedInput.slice(1) : trimmedInput;
    const [cmd, ...args] = commandLine.split(" ");

    // Add command to lines
    setLines(prev => [...prev, { type: "command", text: `> ${trimmedInput}` }]);

    // Add to history
    setCommandHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    // Execute command
    try {
      const result = await onCommand(cmd, args);
      if (result === "__CLEAR__") {
        setLines([]);
      } else {
        setLines(prev => [...prev, { type: "output", text: result }]);
      }
    } catch (error) {
      setLines(prev => [...prev, { type: "error", text: `Error: ${error instanceof Error ? error.message : String(error)}` }]);
    }

    setInput("");
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Tab" || e.key === "Enter") {
        if (suggestions[selectedSuggestion]) {
          e.preventDefault();
          setInput(`/${suggestions[selectedSuggestion].command} `);
          setSuggestions([]);
        }
      }
    } else if (e.key === "ArrowUp" && commandHistory.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown" && historyIndex !== -1) {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono p-4 relative">
      {/* Output Area */}
      <div ref={scrollRef} className="flex-1 overflow-auto mb-2 space-y-1" data-testid="terminal-output">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "command"
                ? "text-cyan-400"
                : line.type === "error"
                ? "text-red-400"
                : "text-green-400"
            }
            data-testid={`terminal-line-${i}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-12 left-4 right-4 bg-card border border-card-border rounded-md shadow-lg max-h-48 overflow-auto z-10" data-testid="terminal-suggestions">
          {suggestions.map((suggestion, i) => (
            <div
              key={suggestion.command}
              className={`px-3 py-2 cursor-pointer ${
                i === selectedSuggestion ? "bg-accent" : "hover-elevate"
              }`}
              onClick={() => {
                setInput(`/${suggestion.command} `);
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              data-testid={`suggestion-${suggestion.command}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{suggestion.command}</span>
                <span className="text-xs text-muted-foreground">{suggestion.params.join(" ")}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{suggestion.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input Line */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span className="text-cyan-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-green-400"
          placeholder="Type / to see commands..."
          autoFocus
          data-testid="terminal-input"
        />
      </form>
    </div>
  );
}
