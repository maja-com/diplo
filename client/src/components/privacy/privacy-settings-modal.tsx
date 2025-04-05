import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import UserAvatar from "@/components/ui/user-avatar";
import { Gift, FileText, List } from "lucide-react";

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrivacySettings {
  defaultWishlistsPublic: boolean;
  defaultNotesPublic: boolean;
  defaultListsPublic: boolean;
  visibleToUsers: Record<number, boolean>;
}

export default function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // These would typically be fetched from the server
  const [settings, setSettings] = useState<PrivacySettings>({
    defaultWishlistsPublic: true,
    defaultNotesPublic: false,
    defaultListsPublic: true,
    visibleToUsers: {}
  });
  
  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyMembers } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "members"],
    enabled: !!families && families.length > 0,
  });
  
  // Filter out the current user
  const otherFamilyMembers = familyMembers?.filter(member => member.userId !== user?.id) || [];
  
  // Initialize visibility settings for all family members
  useState(() => {
    if (otherFamilyMembers.length > 0 && Object.keys(settings.visibleToUsers).length === 0) {
      const newVisibilitySettings: Record<number, boolean> = {};
      otherFamilyMembers.forEach(member => {
        newVisibilitySettings[member.userId] = true;
      });
      setSettings(prev => ({
        ...prev,
        visibleToUsers: newVisibilitySettings
      }));
    }
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: PrivacySettings) => {
      // This would be an API call to save settings
      // For now, we'll just simulate success
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleToggleDefault = (setting: keyof PrivacySettings, value: boolean) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };
  
  const handleToggleUserVisibility = (userId: number, value: boolean) => {
    setSettings({
      ...settings,
      visibleToUsers: {
        ...settings.visibleToUsers,
        [userId]: value
      }
    });
  };
  
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-800 font-heading">
            Privacy Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="pb-4 border-b border-neutral-200">
            <h4 className="font-medium mb-2">Default Visibility for New Items</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-accent mr-3" />
                  <span className="text-neutral-700">Wishlists</span>
                </div>
                <Switch 
                  checked={settings.defaultWishlistsPublic}
                  onCheckedChange={(value) => handleToggleDefault('defaultWishlistsPublic', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-3" />
                  <span className="text-neutral-700">Notes</span>
                </div>
                <Switch 
                  checked={settings.defaultNotesPublic}
                  onCheckedChange={(value) => handleToggleDefault('defaultNotesPublic', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <List className="h-5 w-5 text-secondary mr-3" />
                  <span className="text-neutral-700">Lists</span>
                </div>
                <Switch 
                  checked={settings.defaultListsPublic}
                  onCheckedChange={(value) => handleToggleDefault('defaultListsPublic', value)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Who Can See My Items</h4>
            <div className="space-y-2">
              {otherFamilyMembers.map(member => (
                <div key={member.userId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserAvatar
                      user={member.user}
                      className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3"
                    />
                    <span className="text-neutral-700">{member.user.name}</span>
                  </div>
                  <Switch 
                    checked={settings.visibleToUsers[member.userId] || false}
                    onCheckedChange={(value) => handleToggleUserVisibility(member.userId, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
