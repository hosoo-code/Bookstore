-- BookBuch RLS: run once in the Supabase SQL editor AFTER applying the Drizzle schema.
-- Next.js server routes use DATABASE_URL and enforce the same authorization rules.
-- The browser uses the Supabase publishable key only for Auth cookies and Realtime.

CREATE OR REPLACE FUNCTION public.bookbuch_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.bookbuch_is_blocked(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a));
$$;

CREATE OR REPLACE FUNCTION public.bookbuch_is_member(cid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = cid AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.bookbuch_conversation_blocked(cid uuid, viewer uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = cid AND cm.user_id <> viewer
      AND public.bookbuch_is_blocked(viewer, cm.user_id));
$$;

CREATE OR REPLACE FUNCTION public.bookbuch_can_message(cid uuid, sender uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT sender = auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = cid AND user_id = sender)
    AND EXISTS (SELECT 1 FROM public.conversation_members cm JOIN public.profiles p ON p.id = cm.user_id
      WHERE cm.conversation_id = cid AND cm.user_id <> sender AND p.allow_messages = true
        AND NOT public.bookbuch_is_blocked(sender, cm.user_id));
$$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY; -- no browser policies: server-only seed state
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Profile email, password hashes, and roles must never be exposed to browser queries.
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, bio, avatar_url, cover_url, favorite_genres, favorite_authors, allow_messages, last_seen_at, created_at)
  ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url, cover_url, favorite_genres, favorite_authors, allow_messages, last_seen_at)
  ON public.profiles TO authenticated;
GRANT SELECT ON public.categories, public.books, public.posts, public.post_images, public.post_likes, public.post_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.books, public.user_interests, public.user_follows,
  public.favorites, public.reading_lists, public.cart_items, public.orders, public.order_items, public.posts,
  public.post_images, public.post_likes, public.post_comments, public.saved_posts, public.conversations,
  public.conversation_members, public.messages, public.notifications, public.user_blocks, public.user_reports,
  public.contact_messages TO authenticated;
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE POLICY category_read ON public.categories FOR SELECT USING (true);
CREATE POLICY category_write ON public.categories FOR ALL TO authenticated USING (public.bookbuch_is_admin()) WITH CHECK (public.bookbuch_is_admin());
CREATE POLICY book_read ON public.books FOR SELECT USING (true);
CREATE POLICY book_write ON public.books FOR ALL TO authenticated USING (public.bookbuch_is_admin()) WITH CHECK (public.bookbuch_is_admin());

-- Public profile reads are served by Next.js with a safe field whitelist, not by direct SQL.
CREATE POLICY profile_self_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.bookbuch_is_admin());
CREATE POLICY profile_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- No client INSERT or DELETE: signup and admin operations happen on the server.
-- No policies for sessions: opaque session hashes are strictly server-only.

CREATE POLICY interests_read ON public.user_interests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY interests_write ON public.user_interests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY follows_read ON public.user_follows FOR SELECT TO authenticated USING (follower_id = auth.uid() OR following_id = auth.uid());
CREATE POLICY follows_insert ON public.user_follows FOR INSERT TO authenticated WITH CHECK
  (follower_id = auth.uid() AND follower_id <> following_id AND NOT public.bookbuch_is_blocked(follower_id, following_id));
CREATE POLICY follows_delete ON public.user_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());
CREATE POLICY favorites_own ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reading_own ON public.reading_lists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cart_own ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Orders and line items are created by the trusted server, never by direct client SQL.
CREATE POLICY orders_read ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.bookbuch_is_admin());
CREATE POLICY order_items_read ON public.order_items FOR SELECT TO authenticated USING
  (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.bookbuch_is_admin())));

CREATE POLICY posts_read ON public.posts FOR SELECT USING
  (NOT public.bookbuch_is_blocked(auth.uid(), author_id) AND
    (visibility = 'public' OR author_id = auth.uid() OR
      (visibility = 'followers' AND EXISTS (SELECT 1 FROM public.user_follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = author_id))));
CREATE POLICY posts_insert ON public.posts FOR INSERT TO authenticated WITH CHECK
  (author_id = auth.uid() AND visibility IN ('public', 'followers'));
CREATE POLICY posts_update ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid() AND visibility IN ('public', 'followers'));
CREATE POLICY posts_delete ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.bookbuch_is_admin());
CREATE POLICY post_images_read ON public.post_images FOR SELECT USING
  (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY post_images_insert ON public.post_images FOR INSERT TO authenticated WITH CHECK
  (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY post_images_delete ON public.post_images FOR DELETE TO authenticated USING
  (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY likes_read ON public.post_likes FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY likes_insert ON public.post_likes FOR INSERT TO authenticated WITH CHECK
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY likes_delete ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY comments_read ON public.post_comments FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY comments_insert ON public.post_comments FOR INSERT TO authenticated WITH CHECK
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY comments_delete ON public.post_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.bookbuch_is_admin());
CREATE POLICY saved_own ON public.saved_posts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Clients cannot add themselves to another conversation. Only the server creates membership.
CREATE POLICY conversations_read ON public.conversations FOR SELECT TO authenticated USING
  (public.bookbuch_is_member(id) AND NOT public.bookbuch_conversation_blocked(id, auth.uid()));
CREATE POLICY members_read ON public.conversation_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY messages_read ON public.messages FOR SELECT TO authenticated USING
  (public.bookbuch_is_member(conversation_id) AND NOT public.bookbuch_conversation_blocked(conversation_id, auth.uid()));
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated WITH CHECK
  (sender_id = auth.uid() AND public.bookbuch_can_message(conversation_id, sender_id));
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY blocks_own ON public.user_blocks FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid() AND blocker_id <> blocked_id);
CREATE POLICY reports_read ON public.user_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.bookbuch_is_admin());
CREATE POLICY reports_insert ON public.user_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_update ON public.user_reports FOR UPDATE TO authenticated USING (public.bookbuch_is_admin()) WITH CHECK (public.bookbuch_is_admin());
CREATE POLICY contact_admin_read ON public.contact_messages FOR SELECT TO authenticated USING (public.bookbuch_is_admin());

-- Server-side uploads use the service role key; only public image reads are allowed in Storage.
INSERT INTO storage.buckets (id, name, public) VALUES ('bookbuch-media', 'bookbuch-media', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY bookbuch_media_public_read ON storage.objects FOR SELECT USING (bucket_id = 'bookbuch-media');

-- The Realtime client only receives rows permitted by messages/notifications SELECT policies.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;
