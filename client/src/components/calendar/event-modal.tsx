import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Family } from "@shared/schema";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventModalProps {
  onClose: () => void;
}

interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
  visibility: "family" | "personal";
  familyId?: number;
  notifyUserIds: number[];
}

export default function EventModal({ onClose }: EventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  const { data: families = [] } = useQuery<Family[]>({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/families", selectedFamily, "members"],
    enabled: !!selectedFamily,
  });
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "12:00",
      visibility: "personal",
      notifyUserIds: [],
    }
  });
  
  const visibility = watch("visibility");
  
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Format date and time for API
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      let endDateTime = undefined;
      
      if (data.endDate && data.endTime) {
        endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
      }
      
      const eventData = {
        title: data.title,
        startDate: startDateTime,
        endDate: endDateTime,
        location: data.location,
        description: data.description,
        familyId: data.visibility === "family" ? data.familyId : undefined,
        isPublic: data.visibility === "family",
        notifyUserIds: data.notifyUserIds,
      };
      
      const res = await apiRequest("POST", "/api/events", eventData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/range"] });
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: EventFormData) => {
    data.notifyUserIds = selectedUsers;
    if (data.visibility === "family") {
      data.familyId = selectedFamily || undefined;
    }
    createEventMutation.mutate(data);
  };
  
  const toggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-800 font-heading">
            Add New Event
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
              Event Title
            </Label>
            <Input
              id="title"
              className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add title"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...register("startDate", { required: "Start date is required" })}
              />
            </div>
            <div>
              <Label htmlFor="startTime" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...register("startTime", { required: "Start time is required" })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...register("endDate")}
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="block text-sm font-medium text-neutral-700 mb-1">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...register("endTime")}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
              Location (optional)
            </Label>
            <Input
              id="location"
              className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add location"
              {...register("location")}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              Visibility
            </Label>
            <RadioGroup defaultValue="personal" {...register("visibility")}>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="family" id="family" />
                  <Label htmlFor="family">Family</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal">Personal</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {visibility === "family" && (
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-1">
                Select Family
              </Label>
              <select 
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => setSelectedFamily(Number(e.target.value))}
                value={selectedFamily || ""}
              >
                <option value="">Select a family</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              Notify
            </Label>
            <div className="flex flex-wrap -mx-1">
              {selectedUsers.map((userId) => {
                const member = familyMembers.find(m => m.userId === userId);
                return (
                  <div key={userId} className="px-1 mb-2">
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      <span>{member?.user?.name || "User"}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-0 h-4 w-4"
                        onClick={() => toggleUser(userId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="px-1 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 px-2 py-1 border border-dashed border-neutral-300 rounded-full text-neutral-500 text-sm h-6"
                >
                  <i className="bx bx-plus"></i>
                  <span>Add person</span>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Creating..." : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
