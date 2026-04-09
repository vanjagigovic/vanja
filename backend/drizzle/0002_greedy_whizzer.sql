ALTER TABLE "events" ADD COLUMN "reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "repeat_weekly" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "repeat_until_utc" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "events_start_utc_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "events_repeat_until_utc_idx" ON "events" USING btree ("repeat_until_utc");--> statement-breakpoint
CREATE INDEX "events_active_range_idx" ON "events" USING btree ("start_time","end_time","repeat_until_utc");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_valid_time_range_chk" CHECK ("events"."end_time" > "events"."start_time");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_valid_repeat_boundary_chk" CHECK ("events"."repeat_until_utc" IS NULL OR "events"."repeat_until_utc" >= "events"."start_time");