drop extension if exists "pg_net";


  create table "public"."candidates" (
    "id" uuid not null default gen_random_uuid(),
    "election_id" uuid not null,
    "name" text not null,
    "plan" text,
    "photo_url" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."elections" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "starts_at" timestamp with time zone not null,
    "ends_at" timestamp with time zone not null,
    "status" text not null default 'DRAFT'::text,
    "created_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id);

CREATE UNIQUE INDEX elections_pkey ON public.elections USING btree (id);

alter table "public"."candidates" add constraint "candidates_pkey" PRIMARY KEY using index "candidates_pkey";

alter table "public"."elections" add constraint "elections_pkey" PRIMARY KEY using index "elections_pkey";

alter table "public"."candidates" add constraint "candidates_election_id_fkey" FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE not valid;

alter table "public"."candidates" validate constraint "candidates_election_id_fkey";

grant delete on table "public"."candidates" to "anon";

grant insert on table "public"."candidates" to "anon";

grant references on table "public"."candidates" to "anon";

grant select on table "public"."candidates" to "anon";

grant trigger on table "public"."candidates" to "anon";

grant truncate on table "public"."candidates" to "anon";

grant update on table "public"."candidates" to "anon";

grant delete on table "public"."candidates" to "authenticated";

grant insert on table "public"."candidates" to "authenticated";

grant references on table "public"."candidates" to "authenticated";

grant select on table "public"."candidates" to "authenticated";

grant trigger on table "public"."candidates" to "authenticated";

grant truncate on table "public"."candidates" to "authenticated";

grant update on table "public"."candidates" to "authenticated";

grant delete on table "public"."candidates" to "service_role";

grant insert on table "public"."candidates" to "service_role";

grant references on table "public"."candidates" to "service_role";

grant select on table "public"."candidates" to "service_role";

grant trigger on table "public"."candidates" to "service_role";

grant truncate on table "public"."candidates" to "service_role";

grant update on table "public"."candidates" to "service_role";

grant delete on table "public"."elections" to "anon";

grant insert on table "public"."elections" to "anon";

grant references on table "public"."elections" to "anon";

grant select on table "public"."elections" to "anon";

grant trigger on table "public"."elections" to "anon";

grant truncate on table "public"."elections" to "anon";

grant update on table "public"."elections" to "anon";

grant delete on table "public"."elections" to "authenticated";

grant insert on table "public"."elections" to "authenticated";

grant references on table "public"."elections" to "authenticated";

grant select on table "public"."elections" to "authenticated";

grant trigger on table "public"."elections" to "authenticated";

grant truncate on table "public"."elections" to "authenticated";

grant update on table "public"."elections" to "authenticated";

grant delete on table "public"."elections" to "service_role";

grant insert on table "public"."elections" to "service_role";

grant references on table "public"."elections" to "service_role";

grant select on table "public"."elections" to "service_role";

grant trigger on table "public"."elections" to "service_role";

grant truncate on table "public"."elections" to "service_role";

grant update on table "public"."elections" to "service_role";


