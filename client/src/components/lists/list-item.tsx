import { List, ListItem as TListItem } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/use-auth";

interface ListItemProps {
  list: List;
}

export default function ListItem({ list }: ListItemProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: items = [] } = useQuery<TListItem[]>({
    queryKey: ["/api/lists", list.id, "items"],
    enabled: !!list,
  });
  
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/list-items/${id}`, { completed });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists", list.id, "items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const { data: collaborators = [] } = useQuery<any[]>({
    queryKey: ["/api/families", list.familyId, "members"],
    enabled: !!list.familyId,
  });
  
  // Get up to 3 collaborators (excluding current user)
  const listCollaborators = collaborators
    .filter(member => member.userId !== user?.id)
    .slice(0, 3);
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? "yesterday" : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
    } else {
      return "just now";
    }
  };
  
  // Get list icon from list data or default
  const listIcon = `bx-${list.icon || "list-ul"}`;
  const listColor = list.color || "primary";
  
  // Map color string to Tailwind color class
  const getColorClass = (color: string) => {
    switch (color) {
      case "primary": return "text-primary";
      case "secondary": return "text-secondary";
      case "accent": return "text-accent";
      case "danger": return "text-red-500";
      default: return "text-neutral-500";
    }
  };
  
  const colorClass = getColorClass(listColor);

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100">
      <div className="flex items-center">
        <i className={`bx ${listIcon} ${colorClass} text-xl mr-3`}></i>
        <div>
          <div className="font-medium">{list.title}</div>
          <div className="text-xs text-neutral-500">
            Updated {formatTimeAgo(new Date(list.updatedAt))}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        {listCollaborators.length > 0 && (
          <div className="flex -space-x-2 mr-2">
            {listCollaborators.map((member) => (
              <div key={member.userId} className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white">
                <UserAvatar 
                  user={member.user}
                  className="h-6 w-6"
                />
              </div>
            ))}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-neutral-400 hover:text-neutral-600"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
