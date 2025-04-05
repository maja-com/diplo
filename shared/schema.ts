import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  googleId: text("google_id"),
  googleRefreshToken: text("google_refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  googleId: true,
  googleRefreshToken: true,
});

// Families table
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
});

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

// FamilyMembers join table
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  addedAt: true,
});

// Wishlists table
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  familyId: integer("family_id"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Wishlist items table
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  price: text("price"),
  priority: integer("priority").default(1),
  purchased: boolean("purchased").default(false).notNull(),
  purchasedBy: integer("purchased_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});

// Lists table
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  icon: text("icon").default("list-ul"),
  color: text("color").default("primary"),
  userId: integer("user_id").notNull(),
  familyId: integer("family_id"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// List items table
export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  content: text("content").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListItemSchema = createInsertSchema(listItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  userId: integer("user_id").notNull(),
  familyId: integer("family_id"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  userId: integer("user_id").notNull(),
  familyId: integer("family_id"),
  isPublic: boolean("is_public").default(false).notNull(),
  googleEventId: text("google_event_id"),
  notifyUserIds: jsonb("notify_user_ids").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;

export type ListItem = typeof listItems.$inferSelect;
export type InsertListItem = z.infer<typeof insertListItemSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
