import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, primaryKey, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  isbn: text("isbn").unique(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  priceCents: integer("price_cents").notNull(),
  rating: integer("rating").notNull().default(45),
  ratingCount: text("rating_count").notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  language: text("language").notNull().default("English"),
  featured: boolean("featured").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("books_category_idx").on(t.categoryId)]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  role: text("role").notNull().default("user"),
  favoriteGenres: text("favorite_genres").array().notNull().default(sql`ARRAY[]::text[]`),
  favoriteAuthors: text("favorite_authors").array().notNull().default(sql`ARRAY[]::text[]`),
  allowMessages: boolean("allow_messages").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const userInterests = pgTable("user_interests", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userId, t.categoryId] })]);

export const userFollows = pgTable("user_follows", {
  followerId: uuid("follower_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]);

export const favorites = pgTable("favorites", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.bookId] })]);

export const readingLists = pgTable("reading_lists", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("reading"),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.bookId] })]);

export const cartItems = pgTable("cart_items", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
}, (t) => [primaryKey({ columns: [t.userId, t.bookId] })]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("cash_on_delivery"),
  shippingName: text("shipping_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  createdAt: createdAt(),
}, (t) => [index("orders_user_idx").on(t.userId)]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  bookId: integer("book_id").references(() => books.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("discussion"),
  visibility: text("visibility").notNull().default("public"),
  bookId: integer("book_id").references(() => books.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("posts_author_idx").on(t.authorId), index("posts_created_idx").on(t.createdAt)]);

export const postImages = pgTable("post_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
});

export const postLikes = pgTable("post_likes", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [index("comments_post_idx").on(t.postId)]);

export const savedPosts = pgTable("saved_posts", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationMembers = pgTable("conversation_members", {
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] }), index("conversation_member_user_idx").on(t.userId)]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  href: text("href").notNull().default("/notifications"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("notifications_recipient_idx").on(t.recipientId)]);

export const userBlocks = pgTable("user_blocks", {
  blockerId: uuid("blocker_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);

export const userReports = pgTable("user_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").references(() => profiles.id, { onDelete: "set null" }),
  targetPostId: uuid("target_post_id").references(() => posts.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: createdAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export type Book = typeof books.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Category = typeof categories.$inferSelect;
