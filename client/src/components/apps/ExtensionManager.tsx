import { useState } from "react";
import { Download, Trash2, RefreshCw, Check, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LanguageExtension } from "@shared/schema";

export function ExtensionManager() {
  const { toast } = useToast();
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);

  const { data: extensions = [], isLoading } = useQuery<LanguageExtension[]>({
    queryKey: ["/api/extensions"],
  });

  const installMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const res = await apiRequest("POST", `/api/extensions/${extensionId}/install`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extensions"] });
      toast({
        title: "Extension installed",
        description: "The extension has been installed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to install extension",
        variant: "destructive",
      });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const res = await apiRequest("POST", `/api/extensions/${extensionId}/uninstall`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extensions"] });
      toast({
        title: "Extension uninstalled",
        description: "The extension has been uninstalled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to uninstall extension",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const res = await apiRequest("POST", `/api/extensions/${extensionId}/update`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extensions"] });
      toast({
        title: "Extension updated",
        description: "The extension has been updated to the latest version.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update extension",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-foreground" />
          <p className="text-sm text-muted-foreground">Loading extensions...</p>
        </div>
      </div>
    );
  }

  const installedExtensions = extensions.filter(e => e.isInstalled);
  const availableExtensions = extensions.filter(e => !e.isInstalled);
  const extensionsWithUpdates = installedExtensions.filter(e => e.hasUpdate);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-card-border">
        <h2 className="text-lg font-semibold text-foreground">Extensions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage language support and editor extensions
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {extensionsWithUpdates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Updates Available</h3>
                <Badge variant="secondary" className="text-xs">
                  {extensionsWithUpdates.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {extensionsWithUpdates.map(extension => (
                  <Card
                    key={extension.id}
                    className="p-3 cursor-pointer"
                    onClick={() => setSelectedExtension(extension.id)}
                    data-testid={`extension-card-${extension.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{extension.icon || "📦"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {extension.displayName}
                          </h4>
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            Update Available
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {extension.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{extension.installedVersion} → {extension.availableVersion}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate(extension.id);
                        }}
                        disabled={updateMutation.isPending}
                        data-testid={`button-update-${extension.id}`}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {installedExtensions.filter(e => !e.hasUpdate).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-medium text-foreground">Installed</h3>
              </div>
              <div className="space-y-2">
                {installedExtensions.filter(e => !e.hasUpdate).map(extension => (
                  <Card
                    key={extension.id}
                    className="p-3 cursor-pointer"
                    onClick={() => setSelectedExtension(extension.id)}
                    data-testid={`extension-card-${extension.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{extension.icon || "📦"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {extension.displayName}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            v{extension.installedVersion}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {extension.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Extensions: {extension.fileExtensions.join(", ")}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          uninstallMutation.mutate(extension.id);
                        }}
                        disabled={uninstallMutation.isPending}
                        data-testid={`button-uninstall-${extension.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Uninstall
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {availableExtensions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-medium text-foreground">Available</h3>
              </div>
              <div className="space-y-2">
                {availableExtensions.map(extension => (
                  <Card
                    key={extension.id}
                    className="p-3 cursor-pointer"
                    onClick={() => setSelectedExtension(extension.id)}
                    data-testid={`extension-card-${extension.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{extension.icon || "📦"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {extension.displayName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            v{extension.availableVersion}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {extension.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Extensions: {extension.fileExtensions.join(", ")}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          installMutation.mutate(extension.id);
                        }}
                        disabled={installMutation.isPending}
                        data-testid={`button-install-${extension.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {extensions.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No extensions available</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
