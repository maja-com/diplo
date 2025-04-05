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
import { FileText, User, Users, Plus, FilePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import NoteItem from "@/components/notes/note-item";

interface CreateNoteFormData {
  title: string;
  content: string;
  visibility: "private" | "family";
  familyId?: number;
}

export default function NotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateNoteFormData>({
    defaultValues: {
      title: "",
      content: "",
      visibility: "private"
    }
  });
  
  const { data: personalNotes } = useQuery({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });
  
  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  const { data: familyNotes } = useQuery({
    queryKey: ["/api/families", families?.[0]?.id, "notes"],
    enabled: !!families && families.length > 0,
  });
  
  // Combine personal and family notes for 'all' tab
  const allNotes = [
    ...(personalNotes || []),
    ...(familyNotes || []).filter(fn => !personalNotes?.some(pn => pn.id === fn.id))
  ];
  
  // Sort notes by update date, most recent first
  const sortedNotes = (notesToSort: any[]) => {
    return [...notesToSort].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };
  
  const createNoteMutation = useMutation({
    mutationFn: async (data: CreateNoteFormData) => {
      const noteData = {
        title: data.title,
        content: data.content,
        familyId: data.visibility === "family" ? (families?.[0]?.id || undefined) : undefined,
        isPublic: data.visibility === "family"
      };
      
      const res = await apiRequest("POST", "/api/notes", noteData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/families", families?.[0]?.id, "notes"] });
      toast({
        title: "Success",
        description: "Note created successfully!",
      });
      setShowCreateModal(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create note: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateNoteFormData) => {
    createNoteMutation.mutate(data);
  };

  return (
    <Layout title="Notes">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Notes</CardTitle>
                <CardDescription>
                  Create and manage personal and family notes
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <FilePlus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  All Notes
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
              
              <TabsContent value="all" className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedNotes(allNotes).map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </TabsContent>
              
              <TabsContent value="personal" className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalNotes && sortedNotes(personalNotes.filter(note => !note.familyId)).map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </TabsContent>
              
              <TabsContent value="family" className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyNotes && sortedNotes(familyNotes).map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Note Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-800 font-heading">
              Create New Note
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
                Note Title
              </Label>
              <Input
                id="title"
                className="w-full"
                placeholder="Enter note title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-1">
                Content
              </Label>
              <Textarea
                id="content"
                className="w-full min-h-[150px]"
                placeholder="Enter your note content here"
                {...register("content")}
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
                Family notes are visible to all family members. Private notes are only visible to you.
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createNoteMutation.isPending}
              >
                {createNoteMutation.isPending ? "Creating..." : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
