import { useState } from "react";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { List, ListPlus, User, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import ListItem from "@/components/lists/list-item";

interface CreateListFormData {
  title: string;
  icon: string;
  color: string;
  visibility: "private" | "family";
  familyId?: number;
}

export default function ListsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<CreateListFormData>({
    defaultValues: {
      title: "",
      icon: "list-ul",
      color: "primary",
      visibility: "private"
    }
  });
  
  const { data: personalLists } = useQuery({
    queryKey: ["/api/lists"],
    enabled: !!user,
  });
  
  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyLists } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "lists"],
    enabled: !!families && families.length > 0,
  });
  
  // Combine personal and family lists for 'all' tab
  const allLists = [
    ...(personalLists || []),
    ...(familyLists || []).filter(fl => !personalLists?.some(pl => pl.id === fl.id))
  ];
  
  // Sort lists by update date, most recent first
  const sortedLists = (listsToSort: any[]) => {
    return [...listsToSort].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };
  
  const createListMutation = useMutation({
    mutationFn: async (data: CreateListFormData) => {
      const listData = {
        title: data.title,
        icon: data.icon,
        color: data.color,
        familyId: data.visibility === "family" ? (families?.[0]?.id || undefined) : undefined,
        isPublic: data.visibility === "family"
      };
      
      const res = await apiRequest("POST", "/api/lists", listData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/families", families?.[0]?.id, "lists"] });
      toast({
        title: "Success",
        description: "List created successfully!",
      });
      setShowCreateModal(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create list: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateListFormData) => {
    createListMutation.mutate(data);
  };
  
  const iconOptions = [
    { value: "list-ul", label: "General List" },
    { value: "shopping-bag", label: "Shopping" },
    { value: "task", label: "Tasks" },
    { value: "calendar-event", label: "Events" },
    { value: "book", label: "Reading" },
    { value: "food-menu", label: "Recipes" },
  ];
  
  const colorOptions = [
    { value: "primary", label: "Blue" },
    { value: "secondary", label: "Green" },
    { value: "accent", label: "Yellow" },
    { value: "danger", label: "Red" },
  ];

  return (
    <Layout title="Lists">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Lists</CardTitle>
                <CardDescription>
                  Create and manage lists for yourself and your family
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <ListPlus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all" className="flex items-center">
                  <List className="h-4 w-4 mr-2" />
                  All Lists
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="family" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Family
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-2">
                {sortedLists(allLists).map(list => (
                  <ListItem key={list.id} list={list} />
                ))}
              </TabsContent>
              
              <TabsContent value="personal" className="space-y-2">
                {personalLists && sortedLists(personalLists.filter(list => !list.familyId)).map(list => (
                  <ListItem key={list.id} list={list} />
                ))}
              </TabsContent>
              
              <TabsContent value="family" className="space-y-2">
                {familyLists && sortedLists(familyLists).map(list => (
                  <ListItem key={list.id} list={list} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Create List Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-800 font-heading">
              Create New List
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
                List Title
              </Label>
              <Input
                id="title"
                className="w-full"
                placeholder="Enter list title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-1">
                List Icon
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {iconOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:border-primary">
                    <input
                      type="radio"
                      value={option.value}
                      className="sr-only"
                      {...register("icon")}
                    />
                    <i className={`bx bx-${option.value} text-xl ${watch("icon") === option.value ? "text-primary" : "text-neutral-500"}`}></i>
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-1">
                List Color
              </Label>
              <div className="flex space-x-2">
                {colorOptions.map(option => (
                  <label key={option.value} className={`flex-1 border rounded-md p-2 cursor-pointer text-center ${watch("color") === option.value ? "border-primary" : "border-neutral-200"}`}>
                    <input
                      type="radio"
                      value={option.value}
                      className="sr-only"
                      {...register("color")}
                    />
                    <div className={`h-4 w-full rounded-sm bg-${option.value} mb-1`}></div>
                    <span className="text-xs">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-neutral-700 mb-1">
                Visibility
              </Label>
              <RadioGroup defaultValue="private" {...register("visibility")}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="family" id="family" />
                    <Label htmlFor="family">Family</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Private</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createListMutation.isPending}
              >
                {createListMutation.isPending ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
