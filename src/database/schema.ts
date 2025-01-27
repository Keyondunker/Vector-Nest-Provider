import { OfferParameterType } from "@/constants";
import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { DeploymentStatus } from "@forest-protocols/sdk";

export const resourcesTable = pgTable(
  "resources",
  {
    id: integer("id").notNull(),
    name: varchar({ length: 100 }).notNull(),
    ownerAddress: varchar("owner_address", { length: 100 }).notNull(),
    details: json().$type<any>().default({}).notNull(),
    deploymentStatus: varchar("deployment_status", { length: 20 })
      .$type<DeploymentStatus>()
      .notNull(),
    groupName: varchar("group_name", { length: 100 })
      .default("default")
      .notNull(),
    offerId: integer("offer_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    providerId: integer("provider_id")
      .references(() => providersTable.id)
      .notNull(),
    pcAddressId: integer("pc_address_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.pcAddressId],
    }),
    foreignKey({
      name: "resources_offers_fk",
      columns: [table.offerId, table.pcAddressId],
      foreignColumns: [offersTable.id, offersTable.pcAddressId],
    }),
  ]
);
relations(resourcesTable, ({ one }) => ({
  provider: one(providersTable, {
    fields: [resourcesTable.providerId],
    references: [providersTable.id],
  }),
}));

export const providersTable = pgTable("providers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  details: json().$type<any>().default({}).notNull(),
  ownerAddress: varchar("owner_address", { length: 65 }).notNull().unique(),
});
relations(providersTable, ({ many }) => ({
  offers: many(offersTable),
  resources: many(resourcesTable),
}));

export const productCategoriesTable = pgTable("product_categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  address: varchar({ length: 100 }).notNull(),
});
relations(productCategoriesTable, ({ many }) => ({
  offers: many(offersTable),
  resources: many(resourcesTable),
}));

export const offersTable = pgTable(
  "offers",
  {
    id: integer("id").notNull(),
    providerId: integer("provider_id")
      .references(() => providersTable.id)
      .notNull(),
    pcAddressId: integer("pc_address_id")
      .references(() => productCategoriesTable.id)
      .notNull(),
    details: jsonb().$type<any>().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.pcAddressId],
    }),
  ]
);
relations(offersTable, ({ one, many }) => ({
  resources: many(resourcesTable),
  productCategory: one(productCategoriesTable, {
    fields: [offersTable.pcAddressId],
    references: [productCategoriesTable.id],
  }),
  provider: one(providersTable, {
    fields: [offersTable.providerId],
    references: [providersTable.id],
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

export type DbResourceInsert = typeof resourcesTable.$inferInsert;
export type Resource = typeof resourcesTable.$inferSelect;

export type DbOffer = {
  id: number;
  name: string;
  deploymentParams: any;
  cid: string;
  providerId: number;
  parameters: {
    name: string;
    value: string;
    type: OfferParameterType;
  }[];
};
