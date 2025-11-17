import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Process } from "@shared/schema";

interface TaskManagerAppProps {
  processes: Process[];
  onEndTask: (processId: string) => void;
}

export function TaskManagerApp({ processes, onEndTask }: TaskManagerAppProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-10 bg-card border-b border-card-border flex items-center px-3">
        <h3 className="text-sm font-medium text-foreground">Running Processes</h3>
      </div>

      {/* Process List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead className="bg-card sticky top-0 z-10">
              <tr className="border-b border-card-border">
                <th className="text-left p-3 font-medium text-foreground">Name</th>
                <th className="text-left p-3 font-medium text-foreground">Type</th>
                <th className="text-left p-3 font-medium text-foreground">CPU</th>
                <th className="text-left p-3 font-medium text-foreground">Memory</th>
                <th className="text-left p-3 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No processes running
                  </td>
                </tr>
              ) : (
                processes.map((process) => (
                  <tr
                    key={process.id}
                    className="border-b border-border hover-elevate"
                    data-testid={`process-${process.id}`}
                  >
                    <td className="p-3 text-foreground">{process.name}</td>
                    <td className="p-3 text-muted-foreground capitalize">{process.type}</td>
                    <td className="p-3 text-muted-foreground">{process.cpu.toFixed(1)}%</td>
                    <td className="p-3 text-muted-foreground">{process.memory.toFixed(1)} MB</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7"
                        onClick={() => onEndTask(process.id)}
                        data-testid={`button-end-task-${process.id}`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        End Task
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
}
