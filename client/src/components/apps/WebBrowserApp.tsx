import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WebBrowserAppProps {
  initialUrl?: string;
}

export function WebBrowserApp({ initialUrl = "https://example.com" }: WebBrowserAppProps) {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigate = (newUrl: string) => {
    setLoading(true);
    setCurrentUrl(newUrl);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Add https:// if not present
    const formattedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    navigate(formattedUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const reload = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Navigation Bar */}
      <div className="h-12 bg-card border-b border-card-border flex items-center px-3 gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={goBack}
          disabled={historyIndex === 0}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={goForward}
          disabled={historyIndex === history.length - 1}
          data-testid="button-forward"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={reload}
          data-testid="button-reload"
        >
          <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => navigate("https://example.com")}
          data-testid="button-home"
        >
          <Home className="w-4 h-4" />
        </Button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL..."
              className="h-8 pl-10"
              data-testid="input-url"
            />
          </div>
        </form>
      </div>

      {/* Content Frame */}
      <div className="flex-1 bg-white dark:bg-gray-900 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
        <div className="h-full p-8 overflow-auto" data-testid="browser-content">
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentUrl}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This is a simulated web browser. In a full implementation, this would render actual web content.
            </p>
            <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Example Content
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The web browser can navigate to different URLs, maintain history, and simulate page loading.
                Use the navigation controls above to browse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
