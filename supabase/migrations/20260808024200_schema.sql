


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."Challenge Category" AS ENUM (
    'performance',
    'physical',
    'knowledge',
    'creative',
    'exploration',
    'academic',
    'social'
);


ALTER TYPE "public"."Challenge Category" OWNER TO "postgres";


CREATE TYPE "public"."Submission Type" AS ENUM (
    'photo',
    'video',
    'audio'
);


ALTER TYPE "public"."Submission Type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_no_duplicate_verified_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if exists (
    select 1 from public.submissions
    where user_id = new.user_id
      and challenge_id = new.challenge_id
      and verified = true
  ) then
    raise exception 'You already have a verified submission for this challenge';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."check_no_duplicate_verified_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_own_account"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- optional: clean up storage objects first if you don't rely on cascade/hooks
  delete from storage.objects
  where bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text;

  -- deletes the auth user row; profiles row cascades via FK ON DELETE CASCADE
  delete from auth.users where id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."delete_own_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_referral referrals%ROWTYPE;
BEGIN
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = NEW.id AND status = 'pending'
  LIMIT 1;

  IF v_referral.id IS NULL THEN
    RETURN NEW; -- nothing staged, nothing to do
  END IF;

  -- Defensive re-checks in case anything changed during onboarding
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_referral.referrer_id) THEN
    UPDATE referrals SET status = 'rejected' WHERE id = v_referral.id;
    RETURN NEW;
  END IF;

  UPDATE profiles SET referred_by = v_referral.referrer_id WHERE id = NEW.id;
  UPDATE profiles SET referral_bonus_points = referral_bonus_points + 250
    WHERE id = v_referral.referrer_id;
  UPDATE profiles SET referral_bonus_points = referral_bonus_points + 250
    WHERE id = NEW.id;

  UPDATE referrals SET status = 'completed', completed_at = now()
    WHERE id = v_referral.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."finalize_referral"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  done_count integer;
begin
  if target_user_id is null then
    raise exception 'target_user_id cannot be null';
  end if;

  select count(distinct challenge_id)
  into done_count
  from public.submissions
  where user_id = target_user_id
    and verified = true;

  return done_count;
end;
$$;


ALTER FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_college_avg_done"("college_id_param" integer) RETURNS TABLE("avg_done" numeric, "member_count" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select
    coalesce(avg(total_points), 0) as avg_done,
    count(*) as member_count
  from (
    select
      p.id,
      coalesce(sum(c.points), 0) as total_points
    from profiles p
    left join submissions s
      on s.user_id = p.id and s.verified = true
    left join challenges c
      on c.id = s.challenge_id
    where p.college_id = college_id_param
    group by p.id
  ) per_user;
$$;


ALTER FUNCTION "public"."get_college_avg_done"("college_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_max_possible_points"() RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(sum(points), 0) from public.challenges;
$$;


ALTER FUNCTION "public"."get_max_possible_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_school_avg_done"() RETURNS TABLE("avg_done" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(avg(total_points), 0) as avg_done
  from (
    select
      p.id,
      coalesce(sum(c.points), 0) as total_points
    from profiles p
    left join submissions s
      on s.user_id = p.id and s.verified = true
    left join challenges c
      on c.id = s.challenge_id
    group by p.id
  ) per_user;
$$;


ALTER FUNCTION "public"."get_school_avg_done"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_points"("target_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  total_points integer;
begin
  if target_user_id is null then
    raise exception 'target_user_id cannot be null';
  end if;

  select coalesce(sum(c.points), 0)
  into total_points
  from public.submissions s
  join public.challenges c on c.id = s.challenge_id
  where s.user_id = target_user_id
    and s.verified = true;

  return total_points;
end;$$;


ALTER FUNCTION "public"."get_user_points"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_rank"("target_user_id" "uuid") RETURNS TABLE("overall_rank" integer, "college_rank" integer, "total_points" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$begin
  if target_user_id is null then
    raise exception 'target_user_id cannot be null';
  end if;

  return query
  with user_points as (
    select
      p.id as user_id,
      p.college_id,
      coalesce(sum(c.points), 0)::integer as points
    from public.profiles p
    left join public.submissions s on s.user_id = p.id and s.verified = true
    left join public.challenges c on c.id = s.challenge_id
    group by p.id, p.college_id
  ),
  ranked as (
    select
      user_id,
      points,
      rank() over (order by points desc)::integer as overall_rank,
      rank() over (partition by college_id order by points desc)::integer as college_rank
    from user_points
  )
  select ranked.overall_rank, ranked.college_rank, ranked.points
  from ranked
  where ranked.user_id = target_user_id;
end;$$;


ALTER FUNCTION "public"."get_user_rank"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$begin
  insert into public.profiles (id, display_name, handle, college_id, avatar_url, first_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    null,
    null,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    true
  );
  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_referred_by"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.referred_by IS NOT NULL AND NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'referred_by cannot be changed once set';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."lock_referred_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nanoid"("size" integer DEFAULT 21, "alphabet" "text" DEFAULT '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
    id text := '';
    bytes bytea;
    byte_index int;
    alphabet_array text[];
    alphabet_len int;
    mask int;
    step int;
begin
    alphabet_array := regexp_split_to_array(alphabet, '');
    alphabet_len := array_length(alphabet_array, 1);

    mask := (2 << cast(floor(log(alphabet_len - 1) / log(2)) as int)) - 1;
    step := cast(ceil(1.6 * mask * size / alphabet_len) as int);

    while length(id) < size loop
        bytes := extensions.gen_random_bytes(step);
        for byte_index in 0 .. step - 1 loop
            declare
                buf int;
                alphabet_index int;
            begin
                buf := get_byte(bytes, byte_index) & mask;
                if buf < alphabet_len then
                    alphabet_index := buf + 1;
                    id := id || alphabet_array[alphabet_index];
                    if length(id) = size then
                        return id;
                    end if;
                end if;
            end;
        end loop;
    end loop;

    return id;
end;
$$;


ALTER FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_referral_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_code varchar(8);
  v_attempts int := 0;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      v_code := nanoid(8);
      v_attempts := v_attempts + 1;

      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM profiles WHERE referral_code = v_code
      );

      IF v_attempts >= 5 THEN
        RAISE EXCEPTION 'Could not generate a unique referral_code after % attempts', v_attempts;
      END IF;
    END LOOP;

    NEW.referral_code := v_code;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stage_referral"("p_code" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_referrer_id uuid;
  v_referred_id uuid := auth.uid();
  v_is_new boolean;
BEGIN
  SELECT first_login INTO v_is_new FROM profiles WHERE id = v_referred_id;

  IF NOT v_is_new THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_new_account');
  END IF;

  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = p_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  IF v_referrer_id = v_referred_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'self_referral');
  END IF;

  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE referred_id = v_referred_id AND status IN ('pending', 'completed')
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_attempted');
  END IF;

  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, v_referred_id, 'pending');

  RETURN jsonb_build_object('success', true, 'status', 'pending');
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'reason', 'already_attempted');
END;
$$;


ALTER FUNCTION "public"."stage_referral"("p_code" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_like"("submission_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  updated_likers uuid[];
begin
  update submissions
  set likers = case
    when auth.uid() = any(likers) then array_remove(likers, auth.uid())
    else array_append(coalesce(likers, '{}'), auth.uid())
  end
  where id = submission_id
  returning likers into updated_likers;

  return updated_likers;
end;
$$;


ALTER FUNCTION "public"."toggle_like"("submission_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "points" integer NOT NULL,
    "deadline" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "public"."Challenge Category" DEFAULT 'exploration'::"public"."Challenge Category",
    "submission_type" "public"."Submission Type"[]
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."challenges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."challenges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."challenges_id_seq" OWNED BY "public"."challenges"."id";



CREATE TABLE IF NOT EXISTS "public"."colleges" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."colleges" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."colleges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."colleges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."colleges_id_seq" OWNED BY "public"."colleges"."id";



CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "handle" "text",
    "display_name" "text" NOT NULL,
    "college_id" integer,
    "avatar_url" "text",
    "is_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "first_login" boolean DEFAULT true NOT NULL,
    "referral_code" character varying NOT NULL,
    "referred_by" "uuid",
    "referral_bonus_points" numeric DEFAULT '0'::numeric NOT NULL,
    CONSTRAINT "profiles_referral_code_check" CHECK (("length"(("referral_code")::"text") = 8))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."referral_bonus_points" IS 'Bonus points awarded so far as a result of being referred by or referring someone. Default 0';



CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "challenge_id" integer,
    "college_id" integer,
    "media_url" "text" NOT NULL,
    "media_type" "text",
    "caption" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "verified" boolean DEFAULT false,
    "pending" boolean DEFAULT true,
    "likers" "uuid"[],
    "rejected" boolean DEFAULT false NOT NULL,
    CONSTRAINT "submissions_media_type_check" CHECK (("media_type" = ANY (ARRAY['photo'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leaderboard_view" WITH ("security_invoker"='on') AS
 SELECT "c"."name" AS "college",
    COALESCE("sum"("ch"."points"), (0)::bigint) AS "points",
    "count"(DISTINCT "s"."id") AS "completed",
    "count"(DISTINCT "p"."id") AS "members"
   FROM ((("public"."colleges" "c"
     LEFT JOIN "public"."profiles" "p" ON (("p"."college_id" = "c"."id")))
     LEFT JOIN "public"."submissions" "s" ON ((("s"."user_id" = "p"."id") AND ("s"."verified" = true))))
     LEFT JOIN "public"."challenges" "ch" ON (("ch"."id" = "s"."challenge_id")))
  GROUP BY "c"."id", "c"."name"
  ORDER BY COALESCE("sum"("ch"."points"), (0)::bigint) DESC;


ALTER VIEW "public"."leaderboard_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" bigint NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "referrals_no_self" CHECK (("referrer_id" <> "referred_id")),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


ALTER TABLE "public"."referrals" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."referrals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."student_leaderboard_view" AS
 SELECT "p"."id" AS "user_id",
    "p"."display_name",
    "p"."handle",
    "p"."avatar_url",
    "p"."college_id",
    COALESCE("sum"("c"."points"), (0)::bigint) AS "points"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."submissions" "s" ON ((("s"."user_id" = "p"."id") AND ("s"."verified" = true))))
     LEFT JOIN "public"."challenges" "c" ON (("c"."id" = "s"."challenge_id")))
  GROUP BY "p"."id", "p"."display_name", "p"."handle", "p"."avatar_url", "p"."college_id";


ALTER VIEW "public"."student_leaderboard_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submission_likes" (
    "submission_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."submission_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submission_tags" (
    "submission_id" "uuid" NOT NULL,
    "tagged_user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."submission_tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."challenges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."challenges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."colleges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."colleges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_pkey" PRIMARY KEY ("submission_id", "user_id");



ALTER TABLE ONLY "public"."submission_tags"
    ADD CONSTRAINT "submission_tags_pkey" PRIMARY KEY ("submission_id", "tagged_user_id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "unique_follow_pair" UNIQUE ("follower_id", "following_id");



CREATE UNIQUE INDEX "one_verified_submission_per_challenge" ON "public"."submissions" USING "btree" ("user_id", "challenge_id") WHERE ("verified" = true);



CREATE UNIQUE INDEX "profiles_handle_lower_idx" ON "public"."profiles" USING "btree" ("lower"("handle"));



CREATE UNIQUE INDEX "referrals_referred_active_uidx" ON "public"."referrals" USING "btree" ("referred_id") WHERE ("status" = ANY (ARRAY['pending'::"text", 'completed'::"text"]));



CREATE OR REPLACE TRIGGER "prevent_duplicate_verified" BEFORE INSERT ON "public"."submissions" FOR EACH ROW EXECUTE FUNCTION "public"."check_no_duplicate_verified_submission"();



CREATE OR REPLACE TRIGGER "sync-avatar" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://fmdedboybkedusvzuojx.supabase.co/functions/v1/sync-avatar', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZGVkYm95YmtlZHVzdnp1b2p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU2MjM0NywiZXhwIjoyMDk5MTM4MzQ3fQ.zGltBnDk0XnblyL2B61ITI_rexDg_ZQmtQ7HDGUEIPU"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trg_finalize_referral" AFTER UPDATE OF "first_login" ON "public"."profiles" FOR EACH ROW WHEN ((("old"."first_login" = true) AND ("new"."first_login" = false))) EXECUTE FUNCTION "public"."finalize_referral"();



CREATE OR REPLACE TRIGGER "trg_lock_referred_by" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."lock_referred_by"();



CREATE OR REPLACE TRIGGER "trg_set_referral_code" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_referral_code"();



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submission_tags"
    ADD CONSTRAINT "submission_tags_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submission_tags"
    ADD CONSTRAINT "submission_tags_tagged_user_id_fkey" FOREIGN KEY ("tagged_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin update" ON "public"."submissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin write challenges" ON "public"."challenges" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND "profiles"."is_admin"))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin"()));



CREATE POLICY "Admins can view all submissions" ON "public"."submissions" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Anyone can view challenges" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Anyone can view colleges" ON "public"."colleges" FOR SELECT USING (true);



CREATE POLICY "Anyone can view follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Anyone can view profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Delete own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Delete own likes" ON "public"."submission_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Insert own" ON "public"."submissions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Only admins can modify challenges" ON "public"."challenges" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Own follows" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Own likes" ON "public"."submission_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own profile update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Public profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read challenges" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Public read follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Public read likes" ON "public"."submission_likes" FOR SELECT USING (true);



CREATE POLICY "Users can follow others as themselves" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can unfollow their own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."colleges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submission_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submission_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."submissions";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."check_no_duplicate_verified_submission"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_no_duplicate_verified_submission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_no_duplicate_verified_submission"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_own_account"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_own_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_referral"() TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_referral"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_referral"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_challenges_done"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_college_avg_done"("college_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_college_avg_done"("college_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_college_avg_done"("college_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_max_possible_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_max_possible_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_max_possible_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_school_avg_done"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_school_avg_done"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_school_avg_done"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_points"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_points"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_points"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_points"("target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_rank"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_rank"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_rank"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_rank"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_referred_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."lock_referred_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_referred_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."stage_referral"("p_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."stage_referral"("p_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stage_referral"("p_code" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_like"("submission_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_like"("submission_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_like"("submission_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."colleges" TO "anon";
GRANT ALL ON TABLE "public"."colleges" TO "authenticated";
GRANT ALL ON TABLE "public"."colleges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."colleges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."colleges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."colleges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_view" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_view" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_view" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."student_leaderboard_view" TO "anon";
GRANT ALL ON TABLE "public"."student_leaderboard_view" TO "authenticated";
GRANT ALL ON TABLE "public"."student_leaderboard_view" TO "service_role";



GRANT ALL ON TABLE "public"."submission_likes" TO "anon";
GRANT ALL ON TABLE "public"."submission_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."submission_likes" TO "service_role";



GRANT ALL ON TABLE "public"."submission_tags" TO "anon";
GRANT ALL ON TABLE "public"."submission_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."submission_tags" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































