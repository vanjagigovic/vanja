ALTER TABLE "events" ADD COLUMN "start_time" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "end_time" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "time_zone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "start_utc";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "end_utc";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "timezone";