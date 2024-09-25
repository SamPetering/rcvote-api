ALTER TABLE "election_candidates" DROP CONSTRAINT "election_candidates_election_id_elections_id_fk";
--> statement-breakpoint
ALTER TABLE "election_configs" DROP CONSTRAINT "election_configs_election_id_elections_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_candidates" ADD CONSTRAINT "election_candidates_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_configs" ADD CONSTRAINT "election_configs_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
