ALTER TABLE "blockchain" RENAME TO "blockchain_transactions";--> statement-breakpoint
ALTER TABLE "blockchain_transactions" ALTER COLUMN "height" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "blockchain_transactions" ADD COLUMN "hash" varchar(70) NOT NULL;