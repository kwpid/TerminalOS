import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Download, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomApp {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  category: string;
  icon: string;
}

const CUSTOM_APPS: CustomApp[] = [
  {
    id: "velocity",
    name: "Velocity",
    description: "Advanced backend code viewer and analyzer. Decode window structures and discover hidden implementation details.",
    author: "System",
    version: "1.0.0",
    rating: 4.9,
    downloads: 1247,
    category: "Developer Tools",
    icon: "⚡",
  },
  {
    id: "code-analyzer",
    name: "Code Analyzer",
    description: "Analyze code complexity, detect patterns, and identify potential improvements in your projects.",
    author: "DevTools Inc",
    version: "2.1.0",
    rating: 4.7,
    downloads: 3521,
    category: "Developer Tools",
    icon: "🔍",
  },
  {
    id: "system-monitor",
    name: "System Monitor",
    description: "Real-time system performance monitoring with advanced metrics and visualizations.",
    author: "SysAdmin",
    version: "1.5.2",
    rating: 4.8,
    downloads: 2134,
    category: "Utilities",
    icon: "📊",
  },
];

interface WebStoreAppProps {
  onInstallApp: (appId: string) => void;
}

export function WebStoreApp({ onInstallApp }: WebStoreAppProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const categories = ["all", "Developer Tools", "Utilities", "Productivity"];
  
  const filteredApps = selectedCategory === "all" 
    ? CUSTOM_APPS 
    : CUSTOM_APPS.filter(app => app.category === selectedCategory);

  const handleInstall = (app: CustomApp) => {
    setInstalledApps(prev => new Set(Array.from(prev).concat(app.id)));
    onInstallApp(app.id);
    toast({
      title: "App Installed",
      description: `${app.name} has been installed successfully!`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 bg-card border-b border-card-border flex items-center px-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Web Store</h2>
            <p className="text-xs text-muted-foreground">Discover and install custom apps</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="h-12 bg-card border-b border-card-border flex items-center px-4 gap-2">
        {categories.map(category => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? "default" : "ghost"}
            onClick={() => setSelectedCategory(category)}
            data-testid={`category-${category}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* App List */}
      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map(app => (
            <Card key={app.id} data-testid={`app-card-${app.id}`}>
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{app.icon}</div>
                    <div>
                      <CardTitle className="text-base">{app.name}</CardTitle>
                      <CardDescription className="text-xs">
                        v{app.version} by {app.author}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{app.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{app.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{app.downloads.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleInstall(app)}
                  disabled={installedApps.has(app.id)}
                  data-testid={`button-install-${app.id}`}
                >
                  <Download className="w-3 h-3 mr-2" />
                  {installedApps.has(app.id) ? "Installed" : "Install"}
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-info-${app.id}`}>
                  <Info className="w-3 h-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
