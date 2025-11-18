import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCode, FolderTree, Terminal as TerminalIcon, AlertCircle, CheckCircle } from "lucide-react";
import type { WindowState, BackendFile } from "@shared/schema";

interface VelocityAppProps {
  windows: WindowState[];
}

export function VelocityApp({ windows }: VelocityAppProps) {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(
    windows.find(w => w.backendCode)?.id || null
  );
  const [discoveredFiles, setDiscoveredFiles] = useState<Set<string>>(new Set());

  const currentWindow = windows.find(w => w.id === selectedWindow);
  const backendCode = currentWindow?.backendCode;

  const hiddenFiles = backendCode?.files.filter(f => f.isHidden) || [];
  const visibleFiles = backendCode?.files.filter(f => !f.isHidden) || [];

  const handleDiscoverFile = (fileName: string) => {
    setDiscoveredFiles(prev => new Set(Array.from(prev).concat(fileName)));
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar - Window Selector */}
      <div className="w-64 bg-card border-r border-card-border flex flex-col">
        <div className="h-12 border-b border-card-border flex items-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-semibold text-foreground">Velocity</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {windows.filter(w => w.backendCode).map(window => (
              <Button
                key={window.id}
                variant={selectedWindow === window.id ? "default" : "ghost"}
                className="w-full justify-start text-xs"
                onClick={() => setSelectedWindow(window.id)}
                data-testid={`window-${window.id}`}
              >
                <span className="truncate">{window.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!currentWindow || !backendCode ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <AlertCircle className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm">Select a window to analyze its backend</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-14 bg-card border-b border-card-border flex items-center px-4 justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{currentWindow.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Architecture: {backendCode.structure}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {visibleFiles.length + discoveredFiles.size}/{backendCode.files.length} Files
                </Badge>
              </div>
            </div>

            {/* Tabs */}
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
          </>
        )}
      </div>
    </div>
  );
}
