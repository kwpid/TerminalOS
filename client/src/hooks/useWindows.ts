import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WindowState, InsertWindowState } from "@shared/schema";

export function useWindows() {
  const { toast } = useToast();

  const query = useQuery<WindowState[]>({
    queryKey: ["/api/windows"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWindowState) => {
      const res = await apiRequest("POST", "/api/windows", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create window",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WindowState> }) => {
      const res = await apiRequest("PATCH", `/api/windows/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update window",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/windows/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/windows"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close window",
        variant: "destructive",
      });
    },
  });

  return {
    windows: query.data || [],
    isLoading: query.isLoading,
    createWindow: createMutation.mutateAsync,
    updateWindow: updateMutation.mutateAsync,
    deleteWindow: deleteMutation.mutateAsync,
  };
}
