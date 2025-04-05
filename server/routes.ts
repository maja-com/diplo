import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupGoogleCalendar } from "./google";
import { z } from "zod";
import { 
  insertFamilySchema, insertFamilyMemberSchema, 
  insertWishlistSchema, insertWishlistItemSchema,
  insertListSchema, insertListItemSchema,
  insertNoteSchema, insertEventSchema
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up Google Calendar integration
  setupGoogleCalendar(app);

  // Family routes
  app.post("/api/families", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(validatedData);
      
      // Add the creator as a family member with admin role
      await storage.addFamilyMember({
        familyId: family.id,
        userId: req.user!.id,
        role: "admin"
      });
      
      res.status(201).json(family);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/families", isAuthenticated, async (req, res) => {
    try {
      const families = await storage.getFamiliesForUser(req.user!.id);
      res.json(families);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch families" });
    }
  });

  app.get("/api/families/:id", isAuthenticated, async (req, res) => {
    try {
      const family = await storage.getFamily(parseInt(req.params.id));
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(family.id);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      res.json(family);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family" });
    }
  });

  app.get("/api/families/:id/members", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      const membersWithUsers = await storage.getFamilyMembersWithUsers(familyId);
      res.json(membersWithUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family members" });
    }
  });

  app.post("/api/families/:id/members", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is an admin of this family
      const members = await storage.getFamilyMembers(familyId);
      const isAdmin = members.some(m => m.userId === req.user!.id && m.role === "admin");
      
      if (!isAdmin) {
        return res.status(403).json({ error: "Only family admins can add members" });
      }
      
      const validatedData = insertFamilyMemberSchema.parse({
        ...req.body,
        familyId
      });
      
      const newMember = await storage.addFamilyMember(validatedData);
      res.status(201).json(newMember);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlists", isAuthenticated, async (req, res) => {
    try {
      const wishlists = await storage.getWishlists(req.user!.id);
      res.json(wishlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlists" });
    }
  });

  app.post("/api/wishlists", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWishlistSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const wishlist = await storage.createWishlist(validatedData);
      res.status(201).json(wishlist);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/wishlists/:id", isAuthenticated, async (req, res) => {
    try {
      const wishlist = await storage.getWishlist(parseInt(req.params.id));
      if (!wishlist) {
        return res.status(404).json({ error: "Wishlist not found" });
      }
      
      // Check if user can view this wishlist
      if (wishlist.userId !== req.user!.id && !wishlist.isPublic) {
        // If it's a family wishlist, check if user is in the family
        if (wishlist.familyId) {
          const members = await storage.getFamilyMembers(wishlist.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this wishlist" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this wishlist" });
        }
      }
      
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.get("/api/wishlists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const wishlist = await storage.getWishlist(wishlistId);
      
      if (!wishlist) {
        return res.status(404).json({ error: "Wishlist not found" });
      }
      
      // Check if user can view this wishlist
      if (wishlist.userId !== req.user!.id && !wishlist.isPublic) {
        // If it's a family wishlist, check if user is in the family
        if (wishlist.familyId) {
          const members = await storage.getFamilyMembers(wishlist.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this wishlist" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this wishlist" });
        }
      }
      
      const items = await storage.getWishlistItems(wishlistId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist items" });
    }
  });

  app.post("/api/wishlists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const wishlist = await storage.getWishlist(wishlistId);
      
      if (!wishlist) {
        return res.status(404).json({ error: "Wishlist not found" });
      }
      
      // Check if user can add to this wishlist
      if (wishlist.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to add items to this wishlist" });
      }
      
      const validatedData = insertWishlistItemSchema.parse({
        ...req.body,
        wishlistId
      });
      
      const item = await storage.createWishlistItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/wishlists/:id/visibility", isAuthenticated, async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const wishlist = await storage.getWishlist(wishlistId);
      
      if (!wishlist) {
        return res.status(404).json({ error: "Wishlist not found" });
      }
      
      // Check if user owns this wishlist
      if (wishlist.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this wishlist" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      
      const updatedWishlist = await storage.updateWishlistVisibility(wishlistId, isPublic);
      res.json(updatedWishlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wishlist visibility" });
    }
  });

  app.get("/api/families/:id/wishlists", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      const wishlists = await storage.getFamilyWishlists(familyId);
      res.json(wishlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family wishlists" });
    }
  });

  // List routes
  app.get("/api/lists", isAuthenticated, async (req, res) => {
    try {
      const lists = await storage.getLists(req.user!.id);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  app.post("/api/lists", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertListSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const list = await storage.createList(validatedData);
      res.status(201).json(list);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/lists/:id", isAuthenticated, async (req, res) => {
    try {
      const list = await storage.getList(parseInt(req.params.id));
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      
      // Check if user can view this list
      if (list.userId !== req.user!.id && !list.isPublic) {
        // If it's a family list, check if user is in the family
        if (list.familyId) {
          const members = await storage.getFamilyMembers(list.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this list" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this list" });
        }
      }
      
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch list" });
    }
  });

  app.get("/api/lists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const list = await storage.getList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      
      // Check if user can view this list
      if (list.userId !== req.user!.id && !list.isPublic) {
        // If it's a family list, check if user is in the family
        if (list.familyId) {
          const members = await storage.getFamilyMembers(list.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this list" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this list" });
        }
      }
      
      const items = await storage.getListItems(listId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch list items" });
    }
  });

  app.post("/api/lists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const list = await storage.getList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      
      // Check if user can add items to this list
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to add items to this list" });
      }
      
      const validatedData = insertListItemSchema.parse({
        ...req.body,
        listId
      });
      
      const item = await storage.createListItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/list-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.listItems.get(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "List item not found" });
      }
      
      const list = await storage.getList(item.listId);
      if (!list) {
        return res.status(404).json({ error: "Associated list not found" });
      }
      
      // Check if user can update this list item
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this list item" });
      }
      
      const { completed } = req.body;
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "completed must be a boolean" });
      }
      
      const updatedItem = await storage.updateListItem(itemId, completed);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update list item" });
    }
  });

  app.patch("/api/lists/:id/visibility", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const list = await storage.getList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      
      // Check if user owns this list
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this list" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      
      const updatedList = await storage.updateListVisibility(listId, isPublic);
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: "Failed to update list visibility" });
    }
  });

  app.get("/api/families/:id/lists", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      const lists = await storage.getFamilyLists(familyId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family lists" });
    }
  });

  // Note routes
  app.get("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getNotes(req.user!.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Check if user can view this note
      if (note.userId !== req.user!.id && !note.isPublic) {
        // If it's a family note, check if user is in the family
        if (note.familyId) {
          const members = await storage.getFamilyMembers(note.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this note" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this note" });
        }
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.patch("/api/notes/:id/visibility", isAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Check if user owns this note
      if (note.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this note" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      
      const updatedNote = await storage.updateNoteVisibility(noteId, isPublic);
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note visibility" });
    }
  });

  app.get("/api/families/:id/notes", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      const notes = await storage.getFamilyNotes(familyId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family notes" });
    }
  });

  // Event routes
  app.get("/api/events", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getEvents(req.user!.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Check if user can view this event
      if (event.userId !== req.user!.id && !event.isPublic) {
        // If it's a family event, check if user is in the family
        if (event.familyId) {
          const members = await storage.getFamilyMembers(event.familyId);
          const isMember = members.some(m => m.userId === req.user!.id);
          
          if (!isMember) {
            return res.status(403).json({ error: "Not authorized to view this event" });
          }
        } else {
          return res.status(403).json({ error: "Not authorized to view this event" });
        }
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.get("/api/events/range", isAuthenticated, async (req, res) => {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date range" });
      }
      
      const events = await storage.getEventsInRange(req.user!.id, start, end);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/families/:id/events", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const members = await storage.getFamilyMembers(familyId);
      const isMember = members.some(m => m.userId === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this family" });
      }
      
      // Check if start and end dates are provided
      if (req.query.start && req.query.end) {
        const start = new Date(req.query.start as string);
        const end = new Date(req.query.end as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ error: "Invalid date range" });
        }
        
        const events = await storage.getFamilyEventsInRange(familyId, start, end);
        return res.json(events);
      }
      
      // Fetch all events if no date range is specified
      const events = await storage.getFamilyEvents(familyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family events" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
