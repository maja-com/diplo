import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/user-avatar";
import { Calendar, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FamilyOverview() {
  const { user } = useAuth();
  
  const { data: families, isLoading: loadingFamilies } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "members"],
    enabled: !!families && families.length > 0,
  });
  
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user,
  });
  
  // Get today's events for a member
  const getMemberTodayEvents = (userId: number) => {
    if (!events) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate < tomorrow && 
        (event.userId === userId || 
        (event.isPublic && event.familyId === families?.[0]?.id) ||
        (event.notifyUserIds && (event.notifyUserIds as number[]).includes(userId)));
    });
  };

  if (loadingFamilies || loadingMembers) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-800 font-heading">Family Overview</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-primary flex items-center text-sm"
        >
          <span>This Week</span>
          <i className="bx bx-chevron-down ml-1"></i>
        </Button>
      </div>
      
      <div className="flex flex-wrap -mx-2">
        {familyMembers?.map((member) => (
          <div key={member.userId} className="px-2 w-full sm:w-1/2 lg:w-1/3 mb-4">
            <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary cursor-pointer transition-all">
              <div className="flex items-center mb-3">
                <UserAvatar
                  user={member.user}
                  className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center"
                />
                <div className="ml-3">
                  <div className="font-semibold text-neutral-800">{member.user?.name?.split(' ')[0]}</div>
                  <div className="text-xs text-neutral-500">{member.role}</div>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex items-center text-neutral-600 mb-1">
                  <Calendar className="text-primary mr-2 h-4 w-4" />
                  <span>
                    {getMemberTodayEvents(member.userId).length} events today
                  </span>
                </div>
                <div className="flex items-center text-neutral-600">
                  <ListChecks className="text-secondary mr-2 h-4 w-4" />
                  <span>Active in {member.user?.lists?.length || 0} lists</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
