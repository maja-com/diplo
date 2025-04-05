import { useState } from "react";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import PrivacySettingsModal from "@/components/privacy/privacy-settings-modal";
import { Calendar, Settings2, Shield, Users } from "lucide-react";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Get Google auth URL
  const { data: googleAuthData } = useQuery({
    queryKey: ["/api/auth/google"],
    enabled: !!user && !user.googleRefreshToken,
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
  
  const handleConnectToGoogle = () => {
    if (googleAuthData?.authUrl) {
      window.location.href = googleAuthData.authUrl;
    } else {
      connectToGoogleMutation.mutate();
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="profile" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="integration" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your account details
                    </p>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={user?.name} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={user?.username} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={user?.email} readOnly />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" disabled>
                      Update Profile
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="privacy">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Control your privacy and visibility preferences
                    </p>
                  </div>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Visibility Preferences</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Control default visibility settings for new items and who can see your content.
                      </p>
                      <Button variant="outline" onClick={() => setShowPrivacyModal(true)}>
                        Manage Privacy Settings
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Data & Privacy</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage your personal data and account security options.
                      </p>
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" className="justify-start">Change Password</Button>
                        <Button variant="outline" className="justify-start">Export Your Data</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="integration">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Integrations</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect external services to enhance your experience
                    </p>
                  </div>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium mb-2">Google Calendar</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Connect your Google Calendar to sync events between FamilySync and Google.
                          </p>
                        </div>
                        <div className="flex items-center">
                          {user?.googleRefreshToken ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                              Connected
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={handleConnectToGoogle}
                              disabled={connectToGoogleMutation.isPending}
                            >
                              {connectToGoogleMutation.isPending ? "Connecting..." : "Connect"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage account and session settings
                    </p>
                  </div>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md border-red-200">
                      <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Actions here cannot be undone. Please be careful.
                      </p>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="destructive"
                          onClick={handleLogout}
                          disabled={logoutMutation.isPending}
                        >
                          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                        </Button>
                        <Button variant="outline" className="border-red-300 text-red-600">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <PrivacySettingsModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
    </Layout>
  );
}
