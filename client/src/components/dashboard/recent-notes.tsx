import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NoteItem from "@/components/notes/note-item";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentNotes() {
  const { user } = useAuth();
  
  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "notes"],
    enabled: !!families && families.length > 0,
  });

  if (loadingFamilies || loadingNotes) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Sort notes by update date, most recent first
  const sortedNotes = familyNotes 
    ? [...familyNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-neutral-800 font-heading">Recent Notes</h2>
        <Link href="/notes">
          <Button
            variant="link"
            className="text-primary text-sm font-medium p-0"
          >
            See all
          </Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        {sortedNotes.slice(0, 2).map((note) => (
          <NoteItem key={note.id} note={note} />
        ))}
        
        <Link href="/notes">
          <Button 
            variant="outline"
            className="w-full py-2 border border-dashed border-neutral-300 rounded-lg text-neutral-500 text-sm hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add new note
          </Button>
        </Link>
      </div>
    </div>
  );
}
