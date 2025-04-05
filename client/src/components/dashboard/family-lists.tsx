import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ListItem from "@/components/lists/list-item";
import { Skeleton } from "@/components/ui/skeleton";

export default function FamilyLists() {
  const { user } = useAuth();
  
  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyLists, isLoading: loadingLists } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "lists"],
    enabled: !!families && families.length > 0,
  });

  if (loadingFamilies || loadingLists) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Sort lists by update date, most recent first
  const sortedLists = familyLists 
    ? [...familyLists].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-800 font-heading">Shared Lists</h2>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-500 hover:text-primary flex items-center text-sm"
          >
            <span>Recent</span>
            <i className="bx bx-chevron-down ml-1"></i>
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {sortedLists.slice(0, 3).map((list) => (
          <ListItem key={list.id} list={list} />
        ))}
        
        <Link href="/lists">
          <a className="block text-center text-primary text-sm py-2 mt-2 hover:underline">
            Create new list
          </a>
        </Link>
      </div>
    </div>
  );
}
