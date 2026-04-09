CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"start_utc" timestamp with time zone NOT NULL,
	"end_utc" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL
);
