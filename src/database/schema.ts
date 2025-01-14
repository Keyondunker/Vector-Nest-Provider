import { OfferParameterType } from "@/constants";
import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  json,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { DeploymentStatus } from "@forest-protocols/sdk";

export const resourcesTable = pgTable("resources", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  ownerAddress: varchar("owner_address", { length: 100 }).notNull(),
  details: json().$type<any>().default({}).notNull(),
  deploymentStatus: varchar("deployment_status", { length: 20 })
    .notNull()
    .$type<DeploymentStatus>(),
  groupName: varchar("group_name", { length: 100 })
    .notNull()
    .default("default"),
  offerId: integer("offer_id")
    .references(() => offersTable.id)
    .notNull(),
});
relations(resourcesTable, ({ one }) => ({
  offer: one(offersTable, {
    fields: [resourcesTable.offerId],
    references: [offersTable.id],
  }),
}));

export const offersTable = pgTable("offers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  deploymentParams: json("deployment_params")
    .$type<any>()
    .notNull()
    .default({}),
  cid: varchar({ length: 65 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
});
relations(offersTable, ({ many }) => ({
  parameters: many(offerParametersTable),
  resources: many(resourcesTable),
}));

export const offerParametersTable = pgTable("offer_parameters", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 50 }).notNull(),
  value: varchar({ length: 50 }).notNull(),
  type: varchar({ length: 10 })
    .notNull()
    .$type<OfferParameterType>()
    .default(OfferParameterType.String),
  offerId: integer("offer_id")
    .references(() => offersTable.id)
    .notNull(),
});
relations(offerParametersTable, ({ one }) => ({
  offer: one(offersTable, {
    fields: [offerParametersTable.offerId],
    references: [offersTable.id],
  }),
}));

export const blockchainTxsTable = pgTable(
  "blockchain_transactions",
  {
    height: bigint({ mode: "bigint" }).notNull(),
    hash: varchar({ length: 70 }).notNull(),
    isProcessed: boolean("is_processed").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.height, table.hash],
    }),
  ]
);

export const providerDetailsTable = pgTable("provider_details", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 20 }).notNull(),
  value: varchar({ length: 200 }).notNull(),
});
