import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCode, FolderTree, Terminal as TerminalIcon, AlertCircle, CheckCircle, Zap, Loader2, ArrowLeft } from "lucide-react";
import type { WindowState, BackendFile } from "@shared/schema";

interface VelocityAppProps {
  windows: WindowState[];
}

type LoadingStep = "fetching" | "analyzing" | "importing" | "complete";

export function VelocityApp({ windows }: VelocityAppProps) {
  const [view, setView] = useState<"dashboard" | "loading" | "viewer">("dashboard");
  const [windowInput, setWindowInput] = useState("");
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("fetching");
  const [discoveredFiles, setDiscoveredFiles] = useState<Set<string>>(new Set());

  const currentWindow = windows.find(w => w.id === selectedWindow);
  const backendCode = currentWindow?.backendCode;

  const hiddenFiles = backendCode?.files.filter(f => f.isHidden) || [];
  const visibleFiles = backendCode?.files.filter(f => !f.isHidden) || [];

  const handleDiscoverFile = (fileName: string) => {
    setDiscoveredFiles(prev => new Set(Array.from(prev).concat(fileName)));
  };

  const handleLoadWindow = () => {
    const window = windows.find(w => w.id === windowInput || w.path === windowInput);
    if (window) {
      setSelectedWindow(window.id);
      setView("loading");
      setLoadingStep("fetching");
    }
  };

  useEffect(() => {
    if (view !== "loading") return;
    
    const steps: LoadingStep[] = ["fetching", "analyzing", "importing", "complete"];
    const currentIndex = steps.indexOf(loadingStep);
    
    if (currentIndex < steps.length - 1) {
      const timeout = setTimeout(() => {
        setLoadingStep(steps[currentIndex + 1]);
      }, 800);
      return () => clearTimeout(timeout);
    } else if (loadingStep === "complete") {
      const timeout = setTimeout(() => {
        setView("viewer");
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [view, loadingStep]);

  const handleBackToDashboard = () => {
    setView("dashboard");
    setWindowInput("");
    setSelectedWindow(null);
    setLoadingStep("fetching");
  };

  // Dashboard View
  if (view === "dashboard") {
    return (
      <div className="h-full flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Velocity</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Analyze application code and architecture in real-time
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Window ID or Path
              </label>
              <Input
                placeholder="Enter window ID or path..."
                value={windowInput}
                onChange={(e) => setWindowInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoadWindow()}
                data-testid="input-window-id"
                className="w-full"
              />
            </div>

            <Button
              onClick={handleLoadWindow}
              disabled={!windowInput}
              className="w-full"
              data-testid="button-load-window"
            >
              <FileCode className="w-4 h-4 mr-2" />
              Load Window
            </Button>

            {windows.filter(w => w.backendCode).length > 0 && (
              <div className="pt-4">
                <div className="text-xs text-muted-foreground mb-2">Available Windows</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {windows.filter(w => w.backendCode).map(window => (
                    <Button
                      key={window.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        setWindowInput(window.id);
                      }}
                      data-testid={`quick-select-${window.id}`}
                    >
                      <span className="truncate">{window.title}</span>
                      <span className="ml-auto text-muted-foreground">({window.id})</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading View
  if (view === "loading") {
    const loadingSteps = [
      { key: "fetching", label: "Fetching window data", icon: FileCode },
      { key: "analyzing", label: "Analyzing code structure", icon: FolderTree },
      { key: "importing", label: "Importing dependencies", icon: TerminalIcon },
      { key: "complete", label: "Complete", icon: CheckCircle }
    ];

    return (
      <div className="h-full flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto text-orange-500 animate-spin" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Loading Window</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentWindow?.title}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              const currentStepIndex = loadingSteps.findIndex(s => s.key === loadingStep);
              const isComplete = index <= currentStepIndex;
              const isCurrent = step.key === loadingStep;

              return (
                <div
                  key={step.key}
                  className="flex items-center gap-3 text-sm"
                  data-testid={`loading-step-${step.key}`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-muted rounded-full flex-shrink-0" />
                  )}
                  <span className={isCurrent ? "text-foreground font-medium" : isComplete ? "text-muted-foreground" : "text-muted-foreground/50"}>
                    {step.label}
                  </span>
                  {isCurrent && <Loader2 className="w-4 h-4 text-orange-500 animate-spin ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Viewer View
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 bg-card border-b border-card-border flex items-center px-4 justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToDashboard}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{currentWindow?.title}</h2>
            {backendCode && (
              <p className="text-xs text-muted-foreground">
                Architecture: {backendCode.structure}
              </p>
            )}
          </div>
        </div>
        {backendCode && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {visibleFiles.length + discoveredFiles.size}/{backendCode.files.length} Files
            </Badge>
          </div>
        )}
      </div>

      {!currentWindow || !backendCode ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto opacity-50" />
            <p className="text-sm">Window data not available</p>
            <Button size="sm" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="files" className="flex-1 flex flex-col">
              <div className="h-10 bg-card border-b border-card-border px-4">
                <TabsList className="h-full">
                  <TabsTrigger value="files" className="text-xs">
                    <FileCode className="w-3 h-3 mr-2" />
                    Source Files
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="text-xs">
                    <FolderTree className="w-3 h-3 mr-2" />
                    Structure
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="text-xs">
                    <TerminalIcon className="w-3 h-3 mr-2" />
                    Logs
                  </TabsTrigger>
                  <TabsTrigger value="hidden" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    Hidden ({hiddenFiles.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="files" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {visibleFiles.map((file: BackendFile) => (
                      <div key={file.path} className="bg-card border border-card-border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{file.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{file.language}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{file.path}</div>
                        <ScrollArea className="h-48 bg-black rounded-md p-3">
                          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                            {file.content}
                          </pre>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="structure" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="bg-card border border-card-border rounded-md p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Architecture Pattern</h3>
                      <p className="text-sm text-muted-foreground mb-4">{backendCode.structure}</p>
                      
                      <h3 className="text-sm font-semibold text-foreground mb-2">File Structure</h3>
                      <div className="space-y-1 font-mono text-xs">
                        {backendCode.files.map((file: BackendFile) => (
                          <div key={file.path} className="flex items-center gap-2">
                            <span className={file.isHidden ? "text-muted-foreground" : "text-foreground"}>
                              {file.path}
                            </span>
                            {file.isHidden && !discoveredFiles.has(file.name) && (
                              <Badge variant="outline" className="text-xs">Hidden</Badge>
                            )}
                            {discoveredFiles.has(file.name) && (
                              <Badge className="text-xs bg-green-600">Discovered</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="bg-black rounded-md p-4 space-y-1">
                      {backendCode.logs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-green-400">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="hidden" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {hiddenFiles.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hidden files in this application</p>
                      </div>
                    ) : (
                      hiddenFiles.map((file: BackendFile) => (
                        <div key={file.path} className="bg-card border border-card-border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-foreground">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!discoveredFiles.has(file.name) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDiscoverFile(file.name)}
                                  data-testid={`discover-${file.name}`}
                                >
                                  Discover
                                </Button>
                              )}
                              {discoveredFiles.has(file.name) && (
                                <Badge className="bg-green-600">Discovered</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">{file.path}</div>
                          {discoveredFiles.has(file.name) ? (
                            <ScrollArea className="h-48 bg-black rounded-md p-3">
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {file.content}
                              </pre>
                            </ScrollArea>
                          ) : (
                            <div className="h-48 bg-black rounded-md p-3 flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <AlertCircle className="w-8 h-8 mx-auto text-yellow-500" />
                                <p className="text-xs text-muted-foreground">
                                  This file is hidden. Analyze logs to discover it.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
        )}
    </div>
  );
}
