import { 
  users, type User, type InsertUser,
  families, type Family, type InsertFamily,
  familyMembers, type FamilyMember, type InsertFamilyMember,
  wishlists, type Wishlist, type InsertWishlist,
  wishlistItems, type WishlistItem, type InsertWishlistItem,
  lists, type List, type InsertList,
  listItems, type ListItem, type InsertListItem,
  notes, type Note, type InsertNote,
  events, type Event, type InsertEvent
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserGoogleData(userId: number, googleId: string, refreshToken: string): Promise<User>;
  
  // Family methods
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyMembers(familyId: number): Promise<FamilyMember[]>;
  getFamilyMembersWithUsers(familyId: number): Promise<(FamilyMember & { user: User })[]>;
  getFamiliesForUser(userId: number): Promise<Family[]>;
  createFamily(family: InsertFamily): Promise<Family>;
  addFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  
  // Wishlist methods
  getWishlists(userId: number): Promise<Wishlist[]>;
  getWishlist(id: number): Promise<Wishlist | undefined>;
  getWishlistItems(wishlistId: number): Promise<WishlistItem[]>;
  getFamilyWishlists(familyId: number): Promise<Wishlist[]>;
  createWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  updateWishlistVisibility(id: number, isPublic: boolean): Promise<Wishlist>;
  
  // List methods
  getLists(userId: number): Promise<List[]>;
  getList(id: number): Promise<List | undefined>;
  getListItems(listId: number): Promise<ListItem[]>;
  getFamilyLists(familyId: number): Promise<List[]>;
  createList(list: InsertList): Promise<List>;
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: number, completed: boolean): Promise<ListItem>;
  updateListVisibility(id: number, isPublic: boolean): Promise<List>;
  
  // Note methods
  getNotes(userId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  getFamilyNotes(familyId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNoteVisibility(id: number, isPublic: boolean): Promise<Note>;
  
  // Event methods
  getEvents(userId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getFamilyEvents(familyId: number): Promise<Event[]>;
  getEventsInRange(userId: number, start: Date, end: Date): Promise<Event[]>;
  getFamilyEventsInRange(familyId: number, start: Date, end: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private families: Map<number, Family>;
  private familyMembers: Map<number, FamilyMember>;
  private wishlists: Map<number, Wishlist>;
  private wishlistItems: Map<number, WishlistItem>;
  private lists: Map<number, List>;
  private listItems: Map<number, ListItem>;
  private notes: Map<number, Note>;
  private events: Map<number, Event>;
  
  sessionStore: session.SessionStore;
  
  private currentIds = {
    users: 1,
    families: 1,
    familyMembers: 1,
    wishlists: 1,
    wishlistItems: 1,
    lists: 1,
    listItems: 1,
    notes: 1,
    events: 1
  };

  constructor() {
    this.users = new Map();
    this.families = new Map();
    this.familyMembers = new Map();
    this.wishlists = new Map();
    this.wishlistItems = new Map();
    this.lists = new Map();
    this.listItems = new Map();
    this.notes = new Map();
    this.events = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id, googleId: null, googleRefreshToken: null, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserGoogleData(userId: number, googleId: string, refreshToken: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      googleId,
      googleRefreshToken: refreshToken
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Family methods
  async getFamily(id: number): Promise<Family | undefined> {
    return this.families.get(id);
  }
  
  async getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(
      (member) => member.familyId === familyId
    );
  }
  
  async getFamilyMembersWithUsers(familyId: number): Promise<(FamilyMember & { user: User })[]> {
    const members = await this.getFamilyMembers(familyId);
    return Promise.all(members.map(async (member) => {
      const user = await this.getUser(member.userId);
      return { ...member, user: user! };
    }));
  }
  
  async getFamiliesForUser(userId: number): Promise<Family[]> {
    const memberships = Array.from(this.familyMembers.values()).filter(
      (member) => member.userId === userId
    );
    
    return Promise.all(memberships.map(async (membership) => {
      const family = await this.getFamily(membership.familyId);
      return family!;
    }));
  }
  
  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const id = this.currentIds.families++;
    const family: Family = { ...insertFamily, id, createdAt: new Date() };
    this.families.set(id, family);
    return family;
  }
  
  async addFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentIds.familyMembers++;
    const member: FamilyMember = { ...insertMember, id, addedAt: new Date() };
    this.familyMembers.set(id, member);
    return member;
  }

  // Wishlist methods
  async getWishlists(userId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(
      (wishlist) => wishlist.userId === userId
    );
  }
  
  async getWishlist(id: number): Promise<Wishlist | undefined> {
    return this.wishlists.get(id);
  }
  
  async getWishlistItems(wishlistId: number): Promise<WishlistItem[]> {
    return Array.from(this.wishlistItems.values()).filter(
      (item) => item.wishlistId === wishlistId
    );
  }
  
  async getFamilyWishlists(familyId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values()).filter(
      (wishlist) => wishlist.familyId === familyId || 
        (wishlist.isPublic && 
          Array.from(this.familyMembers.values()).some(
            (member) => member.familyId === familyId && member.userId === wishlist.userId
          )
        )
    );
  }
  
  async createWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    const id = this.currentIds.wishlists++;
    const now = new Date();
    const wishlist: Wishlist = { ...insertWishlist, id, createdAt: now, updatedAt: now };
    this.wishlists.set(id, wishlist);
    return wishlist;
  }
  
  async createWishlistItem(insertItem: InsertWishlistItem): Promise<WishlistItem> {
    const id = this.currentIds.wishlistItems++;
    const item: WishlistItem = { ...insertItem, id, createdAt: new Date() };
    this.wishlistItems.set(id, item);
    return item;
  }
  
  async updateWishlistVisibility(id: number, isPublic: boolean): Promise<Wishlist> {
    const wishlist = await this.getWishlist(id);
    if (!wishlist) throw new Error("Wishlist not found");
    
    const updatedWishlist: Wishlist = {
      ...wishlist,
      isPublic,
      updatedAt: new Date()
    };
    
    this.wishlists.set(id, updatedWishlist);
    return updatedWishlist;
  }

  // List methods
  async getLists(userId: number): Promise<List[]> {
    return Array.from(this.lists.values()).filter(
      (list) => list.userId === userId
    );
  }
  
  async getList(id: number): Promise<List | undefined> {
    return this.lists.get(id);
  }
  
  async getListItems(listId: number): Promise<ListItem[]> {
    return Array.from(this.listItems.values()).filter(
      (item) => item.listId === listId
    );
  }
  
  async getFamilyLists(familyId: number): Promise<List[]> {
    return Array.from(this.lists.values()).filter(
      (list) => list.familyId === familyId || 
        (list.isPublic && 
          Array.from(this.familyMembers.values()).some(
            (member) => member.familyId === familyId && member.userId === list.userId
          )
        )
    );
  }
  
  async createList(insertList: InsertList): Promise<List> {
    const id = this.currentIds.lists++;
    const now = new Date();
    const list: List = { ...insertList, id, createdAt: now, updatedAt: now };
    this.lists.set(id, list);
    return list;
  }
  
  async createListItem(insertItem: InsertListItem): Promise<ListItem> {
    const id = this.currentIds.listItems++;
    const now = new Date();
    const item: ListItem = { ...insertItem, id, createdAt: now, updatedAt: now };
    this.listItems.set(id, item);
    return item;
  }
  
  async updateListItem(id: number, completed: boolean): Promise<ListItem> {
    const item = this.listItems.get(id);
    if (!item) throw new Error("List item not found");
    
    const updatedItem: ListItem = {
      ...item,
      completed,
      updatedAt: new Date()
    };
    
    this.listItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async updateListVisibility(id: number, isPublic: boolean): Promise<List> {
    const list = await this.getList(id);
    if (!list) throw new Error("List not found");
    
    const updatedList: List = {
      ...list,
      isPublic,
      updatedAt: new Date()
    };
    
    this.lists.set(id, updatedList);
    return updatedList;
  }

  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId
    );
  }
  
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async getFamilyNotes(familyId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.familyId === familyId || 
        (note.isPublic && 
          Array.from(this.familyMembers.values()).some(
            (member) => member.familyId === familyId && member.userId === note.userId
          )
        )
    );
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentIds.notes++;
    const now = new Date();
    const note: Note = { ...insertNote, id, createdAt: now, updatedAt: now };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNoteVisibility(id: number, isPublic: boolean): Promise<Note> {
    const note = await this.getNote(id);
    if (!note) throw new Error("Note not found");
    
    const updatedNote: Note = {
      ...note,
      isPublic,
      updatedAt: new Date()
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  // Event methods
  async getEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getFamilyEvents(familyId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.familyId === familyId || 
        (event.isPublic && 
          Array.from(this.familyMembers.values()).some(
            (member) => member.familyId === familyId && member.userId === event.userId
          )
        )
    );
  }
  
  async getEventsInRange(userId: number, start: Date, end: Date): Promise<Event[]> {
    return (await this.getEvents(userId)).filter(
      (event) => event.startDate >= start && (!event.endDate || event.endDate <= end)
    );
  }
  
  async getFamilyEventsInRange(familyId: number, start: Date, end: Date): Promise<Event[]> {
    return (await this.getFamilyEvents(familyId)).filter(
      (event) => event.startDate >= start && (!event.endDate || event.endDate <= end)
    );
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentIds.events++;
    const now = new Date();
    const event: Event = { ...insertEvent, id, createdAt: now, updatedAt: now };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event> {
    const event = await this.getEvent(id);
    if (!event) throw new Error("Event not found");
    
    const updatedEvent: Event = {
      ...event,
      ...eventUpdate,
      id,
      updatedAt: new Date()
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
}

export const storage = new MemStorage();
