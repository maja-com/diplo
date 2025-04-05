import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import WishlistItem from "@/components/wishlists/wishlist-item";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FamilyWishlists() {
  const { user } = useAuth();
  
  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyWishlists, isLoading: loadingWishlists } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "wishlists"],
    enabled: !!families && families.length > 0,
  });
  
  const { data: familyMembers } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "members"],
    enabled: !!families && families.length > 0,
  });
  
  // Get member user details for each wishlist
  const getWishlistUser = (userId: number) => {
    if (!familyMembers) return null;
    const member = familyMembers.find(m => m.userId === userId);
    return member?.user || null;
  };

  if (loadingFamilies || loadingWishlists) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-800 font-heading">Family Wishlists</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-sm font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span>Add Item</span>
        </Button>
      </div>
      
      <div className="space-y-4">
        {familyWishlists?.slice(0, 3).map((wishlist) => (
          <WishlistItem 
            key={wishlist.id} 
            wishlist={wishlist} 
            user={getWishlistUser(wishlist.userId)} 
          />
        ))}
        
        <Link href="/wishlists">
          <a className="block text-center text-primary text-sm py-2 hover:underline">
            View all wishlists
          </a>
        </Link>
      </div>
    </div>
  );
}
