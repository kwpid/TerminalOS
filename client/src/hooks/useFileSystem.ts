import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FileSystemItem, InsertFileSystemItem } from "@shared/schema";

export function useFileSystem() {
  const { toast } = useToast();

  const query = useQuery<FileSystemItem[]>({
    queryKey: ["/api/filesystem"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFileSystemItem) => {
      const res = await apiRequest("POST", "/api/filesystem", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filesystem"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FileSystemItem> }) => {
      const res = await apiRequest("PATCH", `/api/filesystem/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filesystem"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/filesystem/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filesystem"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  return {
    fileSystem: query.data || [],
    isLoading: query.isLoading,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
}
