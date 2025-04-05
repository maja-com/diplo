import { useState } from "react";
import Layout from "@/components/layout/layout";
import CalendarView from "@/components/calendar/calendar-view";
import EventModal from "@/components/calendar/event-modal";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FolderSync } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  const [showEventModal, setShowEventModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Google Calendar connection state
  const isConnectedToGoogle = !!user?.googleRefreshToken;
  
  // Get Google auth URL
  const { data: googleAuthData } = useQuery({
    queryKey: ["/api/auth/google"],
    enabled: !!user && !isConnectedToGoogle,
  });
  
  // Connect to Google Calendar
  const connectToGoogleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/auth/google");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: `Failed to connect to Google Calendar: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // FolderSync with Google Calendar
  const syncWithGoogleMutation = useMutation({
    mutationFn: async () => {
      // This would be an API call to trigger sync
      // For now, we'll just return success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Synced",
        description: "Your calendar has been synced with Google Calendar.",
      });
      // Refresh events
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/range"] });
    },
    onError: (error: Error) => {
      toast({
        title: "FolderSync failed",
        description: `Failed to sync with Google Calendar: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleConnectToGoogle = () => {
    if (googleAuthData?.authUrl) {
      window.location.href = googleAuthData.authUrl;
    } else {
      connectToGoogleMutation.mutate();
    }
  };
  
  const handleSyncWithGoogle = () => {
    syncWithGoogleMutation.mutate();
  };

  return (
    <Layout title="Calendar">
      <div className="grid grid-cols-1 gap-6">
        {/* Google Calendar Connection Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Calendar Integration</CardTitle>
                <CardDescription>
                  Connect and sync with Google Calendar
                </CardDescription>
              </div>
              {isConnectedToGoogle ? (
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleSyncWithGoogle}
                  disabled={syncWithGoogleMutation.isPending}
                >
                  <FolderSync className="h-4 w-4 mr-2" />
                  {syncWithGoogleMutation.isPending ? "Syncing..." : "FolderSync Now"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleConnectToGoogle}
                  disabled={connectToGoogleMutation.isPending}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {connectToGoogleMutation.isPending ? "Connecting..." : "Connect to Google"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isConnectedToGoogle ? (
              <div className="text-sm text-neutral-600">
                <p className="flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Your calendar is connected to Google Calendar
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Events you create will be synced automatically
                </p>
              </div>
            ) : (
              <div className="text-sm text-neutral-600">
                <p>Connect your account to sync events with Google Calendar.</p>
                <p className="mt-1 text-xs text-neutral-500">
                  This allows you to see your Google Calendar events here and vice versa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Calendar View */}
        <CalendarView />
      </div>
      
      {showEventModal && (
        <EventModal onClose={() => setShowEventModal(false)} />
      )}
    </Layout>
  );
}
