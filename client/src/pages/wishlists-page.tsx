import { useState } from "react";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Gift, GiftIcon, User, Users, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import WishlistItem from "@/components/wishlists/wishlist-item";

interface CreateWishlistFormData {
  title: string;
  description: string;
  visibility: "private" | "family";
  familyId?: number;
}

export default function WishlistsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateWishlistFormData>({
    defaultValues: {
      title: "",
      description: "",
      visibility: "private"
    }
  });
  
  const { data: personalWishlists } = useQuery({
    queryKey: ["/api/wishlists"],
    enabled: !!user,
  });
  
  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyWishlists } = useQuery({
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
  
  // Combine personal and family wishlists for 'all' tab
  const allWishlists = [
    ...(personalWishlists || []),
    ...(familyWishlists || []).filter(fw => !personalWishlists?.some(pw => pw.id === fw.id))
  ];
  
  // Sort wishlists by creation date, most recent first
  const sortedWishlists = (wishlistsToSort: any[]) => {
    return [...wishlistsToSort].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };
  
  const createWishlistMutation = useMutation({
    mutationFn: async (data: CreateWishlistFormData) => {
      const wishlistData = {
        title: data.title,
        description: data.description,
        familyId: data.visibility === "family" ? (families?.[0]?.id || undefined) : undefined,
        isPublic: data.visibility === "family"
      };
      
      const res = await apiRequest("POST", "/api/wishlists", wishlistData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/families", families?.[0]?.id, "wishlists"] });
      toast({
        title: "Success",
        description: "Wishlist created successfully!",
      });
      setShowCreateModal(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create wishlist: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateWishlistFormData) => {
    createWishlistMutation.mutate(data);
  };

  return (
    <Layout title="Wishlists">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Wishlists</CardTitle>
                <CardDescription>
                  Create and manage wishlists to share gift ideas
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <GiftIcon className="h-4 w-4 mr-2" />
                New Wishlist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all" className="flex items-center">
                  <Gift className="h-4 w-4 mr-2" />
                  All Wishlists
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
              
              <TabsContent value="all" className="space-y-4">
                {sortedWishlists(allWishlists).map(wishlist => (
                  <WishlistItem 
                    key={wishlist.id} 
                    wishlist={wishlist} 
                    user={getWishlistUser(wishlist.userId) || user} 
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="personal" className="space-y-4">
                {personalWishlists && sortedWishlists(personalWishlists.filter(wishlist => !wishlist.familyId)).map(wishlist => (
                  <WishlistItem key={wishlist.id} wishlist={wishlist} user={user} />
                ))}
              </TabsContent>
              
              <TabsContent value="family" className="space-y-4">
                {familyWishlists && sortedWishlists(familyWishlists).map(wishlist => (
                  <WishlistItem 
                    key={wishlist.id} 
                    wishlist={wishlist} 
                    user={getWishlistUser(wishlist.userId) || user} 
                  />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Wishlist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-800 font-heading">
              Create New Wishlist
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
                Wishlist Title
              </Label>
              <Input
                id="title"
                className="w-full"
                placeholder="Enter wishlist title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                className="w-full"
                placeholder="Enter a description for your wishlist"
                {...register("description")}
              />
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
              <p className="text-xs text-neutral-500 mt-1">
                Family wishlists are visible to all family members. Private wishlists are only visible to you.
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createWishlistMutation.isPending}
              >
                {createWishlistMutation.isPending ? "Creating..." : "Create Wishlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
