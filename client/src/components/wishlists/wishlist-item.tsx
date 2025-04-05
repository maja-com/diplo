import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wishlist } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MoreHorizontal, Globe, Lock } from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WishlistItemProps {
  wishlist: Wishlist;
  user: any;
}

export default function WishlistItem({ wishlist, user }: WishlistItemProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isPublic, setIsPublic] = useState(wishlist.isPublic);
  
  const toggleVisibilityMutation = useMutation({
    mutationFn: async () => {
      const newVisibility = !isPublic;
      const res = await apiRequest("PATCH", `/api/wishlists/${wishlist.id}/visibility`, { 
        isPublic: newVisibility 
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsPublic(!isPublic);
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      toast({
        title: "Visibility updated",
        description: `Wishlist is now ${!isPublic ? "shared" : "private"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update visibility: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const isOwnWishlist = currentUser?.id === wishlist.userId;
  const timeAgo = formatDistanceToNow(new Date(wishlist.createdAt), { addSuffix: true });

  return (
    <div className="p-4 border border-neutral-200 rounded-lg hover:border-primary transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <UserAvatar 
            user={user}
            className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center mr-3"
          />
          <div>
            <div className="font-medium">{wishlist.title}</div>
            <div className="text-sm text-neutral-500">
              Added by {isOwnWishlist ? "you" : user?.name} • {timeAgo}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 ${isPublic ? "bg-secondary/10 text-secondary" : "bg-red-50 text-red-500"} text-xs rounded-full mr-2`}>
            {isPublic ? (
              <>
                <Globe className="inline-block w-3 h-3 mr-1" />
                Shared
              </>
            ) : (
              <>
                <Lock className="inline-block w-3 h-3 mr-1" />
                Private
              </>
            )}
          </span>
          
          {isOwnWishlist && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleVisibilityMutation.mutate()}>
                  {isPublic ? "Make Private" : "Make Shared"}
                </DropdownMenuItem>
                <DropdownMenuItem>Edit Wishlist</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Delete Wishlist</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
