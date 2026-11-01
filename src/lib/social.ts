import { db } from "@/db";
import { isUuid } from "@/lib/http";
import { books, conversationMembers, messages, notifications, postComments, postImages, postLikes, posts, profiles, savedPosts, userBlocks, userFollows, type Post } from "@/db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";

export async function areBlocked(firstId: string, secondId: string) {
  const [row] = await db.select({ blockerId: userBlocks.blockerId }).from(userBlocks).where(or(
    and(eq(userBlocks.blockerId, firstId), eq(userBlocks.blockedId, secondId)),
    and(eq(userBlocks.blockerId, secondId), eq(userBlocks.blockedId, firstId)),
  )).limit(1);
  return Boolean(row);
}

export async function canSeePost(post: Post, viewerId: string | null) {
  if (viewerId === post.authorId) return true;
  if (viewerId && await areBlocked(viewerId, post.authorId)) return false;
  if (post.visibility === "public") return true;
  if (!viewerId) return false;
  const [follow] = await db.select().from(userFollows).where(and(eq(userFollows.followerId, viewerId), eq(userFollows.followingId, post.authorId))).limit(1);
  return Boolean(follow);
}

export async function notify(recipientId: string, actorId: string, text: string, href: string) {
  if (recipientId === actorId || await areBlocked(recipientId, actorId)) return;
  await db.insert(notifications).values({ recipientId, actorId, text, href });
}

export async function getFeed(viewerId: string | null, tab: string = "for-you", authorId?: string) {
  let followingIds = new Set<string>();
  let blockedIds = new Set<string>();
  if (viewerId) {
    const [following, blocked] = await Promise.all([
      db.select({ id: userFollows.followingId }).from(userFollows).where(eq(userFollows.followerId, viewerId)),
      db.select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId }).from(userBlocks)
        .where(or(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, viewerId))),
    ]);
    followingIds = new Set(following.map((row) => row.id));
    blockedIds = new Set(blocked.map((row) => row.blockerId === viewerId ? row.blockedId : row.blockerId));
  }
  const rows = await db.select({ post: posts, author: profiles, book: books }).from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id)).leftJoin(books, eq(posts.bookId, books.id))
    .orderBy(desc(posts.createdAt)).limit(150);
  const visible = rows.filter(({ post }) =>
    (!authorId || post.authorId === authorId) && !blockedIds.has(post.authorId) &&
    (post.visibility === "public" || post.authorId === viewerId || (post.visibility === "followers" && followingIds.has(post.authorId))) &&
    (tab !== "following" || followingIds.has(post.authorId)) &&
    (tab !== "reviews" || post.kind === "review") &&
    (tab !== "discussions" || post.kind === "discussion"),
  ).slice(0, 50);
  if (!visible.length) return [];
  const ids = visible.map(({ post }) => post.id);
  const [images, likes, comments, saved] = await Promise.all([
    db.select().from(postImages).where(inArray(postImages.postId, ids)),
    db.select({ postId: postLikes.postId, userId: postLikes.userId }).from(postLikes).where(inArray(postLikes.postId, ids)),
    db.select({ postId: postComments.postId }).from(postComments).where(inArray(postComments.postId, ids)),
    viewerId ? db.select({ postId: savedPosts.postId }).from(savedPosts).where(and(inArray(savedPosts.postId, ids), eq(savedPosts.userId, viewerId))) : Promise.resolve([] as { postId: string }[]),
  ]);
  const savedIds = new Set(saved.map((item) => item.postId));
  return visible.map(({ post, author, book }) => ({
    ...post,
    author: { id: author.id, username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl },
    book: book ? { id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl } : null,
    images: images.filter((item) => item.postId === post.id).map((item) => item.imageUrl),
    likesCount: likes.filter((item) => item.postId === post.id).length,
    commentCount: comments.filter((item) => item.postId === post.id).length,
    liked: likes.some((item) => item.postId === post.id && item.userId === viewerId),
    saved: savedIds.has(post.id),
  }));
}

export type FeedPost = Awaited<ReturnType<typeof getFeed>>[number];

export async function getSuggestedPeople(viewerId: string | null, genres: string[] = []) {
  const candidates = await db.select({ id: profiles.id, username: profiles.username, displayName: profiles.displayName, avatarUrl: profiles.avatarUrl, favoriteGenres: profiles.favoriteGenres, bio: profiles.bio, lastSeenAt: profiles.lastSeenAt, allowMessages: profiles.allowMessages })
    .from(profiles).orderBy(desc(profiles.createdAt)).limit(80);
  let excluded = new Set<string>();
  if (viewerId) {
    const blocked = await db.select().from(userBlocks).where(or(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, viewerId)));
    excluded = new Set(blocked.map((item) => item.blockerId === viewerId ? item.blockedId : item.blockerId));
  }
  return candidates.filter((item) => item.id !== viewerId && !excluded.has(item.id))
    .map((item) => ({ ...item, sharedGenres: item.favoriteGenres.filter((genre) => genres.includes(genre)) }))
    .sort((a, b) => b.sharedGenres.length - a.sharedGenres.length).slice(0, 8);
}

export async function getConversationMember(conversationId: string, userId: string) {
  if (!isUuid(conversationId)) return null;
  const [membership] = await db.select().from(conversationMembers).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId))).limit(1);
  if (!membership) return null;
  const [other] = await db.select({ profile: profiles }).from(conversationMembers)
    .innerJoin(profiles, eq(conversationMembers.userId, profiles.id))
    .where(and(eq(conversationMembers.conversationId, conversationId), inArray(conversationMembers.userId,
      (await db.select({ userId: conversationMembers.userId }).from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId))).map((member) => member.userId).filter((id) => id !== userId),
    ))).limit(1);
  if (!other || await areBlocked(userId, other.profile.id)) return null;
  return { membership, other: other.profile };
}

export async function getConversationList(userId: string) {
  const memberships = await db.select({ conversationId: conversationMembers.conversationId, lastReadAt: conversationMembers.lastReadAt })
    .from(conversationMembers).where(eq(conversationMembers.userId, userId));
  const result = await Promise.all(memberships.map(async ({ conversationId, lastReadAt }) => {
    const peer = await getConversationMember(conversationId, userId);
    if (!peer) return null;
    const [latest] = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(1);
    const allMessages = await db.select({ senderId: messages.senderId, createdAt: messages.createdAt }).from(messages).where(eq(messages.conversationId, conversationId));
    return {
      id: conversationId,
      other: { id: peer.other.id, username: peer.other.username, displayName: peer.other.displayName, avatarUrl: peer.other.avatarUrl, favoriteGenres: peer.other.favoriteGenres, lastSeenAt: peer.other.lastSeenAt },
      lastMessage: latest ? { body: latest.body, createdAt: latest.createdAt, senderId: latest.senderId } : null,
      unread: allMessages.filter((message) => message.senderId !== userId && message.createdAt > lastReadAt).length,
      online: Boolean(peer.other.lastSeenAt && Date.now() - peer.other.lastSeenAt.getTime() < 120000),
    };
  }));
  return result.filter((item) => item !== null).sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));
}
