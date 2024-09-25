ALTER TABLE "elections" ALTER COLUMN "creator_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "elections" ADD CONSTRAINT "elections_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
