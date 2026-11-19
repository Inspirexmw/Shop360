import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  unique,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";

export const id = () => ({ id: uuid("id").defaultRandom().primaryKey() });

export const roleEnum = pgEnum("role", ["owner", "employee"]);

export const customers = pgTable(
  "customers",
  {
    ...id(),
    name: text("name").notNull(),
    type: text("type").default("individual").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    tin: text("tin"),
    tags: text("tags").array().default([]),
    creditOwed: numeric("credit_owed", { precision: 12, scale: 2 }).default("0").notNull(),
    storeCredit: numeric("store_credit", { precision: 12, scale: 2 }).default("0").notNull(),
    lastPurchase: timestamp("last_purchase"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    phoneIdx: index("customers_phone_idx").on(t.phone),
    emailIdx: index("customers_email_idx").on(t.email),
    activeIdx: index("customers_active_idx").on(t.active),
  }),
);

export const categories = pgTable(
  "categories",
  {
    ...id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index("categories_slug_idx").on(t.slug),
  }),
);

export const brands = pgTable(
  "brands",
  {
    ...id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index("brands_slug_idx").on(t.slug),
  }),
);

export const products = pgTable(
  "products",
  {
    ...id(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: text("category_id"),
    brandId: text("brand_id"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    stockQty: integer("stock_qty").default(0).notNull(),
    lowStock: integer("low_stock").default(5).notNull(),
    active: boolean("active").default(true).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    skuIdx: index("products_sku_idx").on(t.sku),
    categoryIdx: index("products_category_idx").on(t.categoryId),
    brandIdx: index("products_brand_idx").on(t.brandId),
  }),
);

export const productVariants = pgTable(
  "product_variants",
  {
    ...id(),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    stockQty: integer("stock_qty").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    skuIdx: index("variants_sku_idx").on(t.sku),
    productIdx: index("variants_product_idx").on(t.productId),
  }),
);

export const sales = pgTable(
  "sales",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    customerId: text("customer_id"),
    channel: text("channel").default("in-store").notNull(),
    paymentMethod: text("payment_method").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).default("0").notNull(),
    tax: numeric("tax", { precision: 12, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paid: numeric("paid", { precision: 12, scale: 2 }).default("0").notNull(),
    status: text("status").default("completed").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    location: text("location").default("Shop").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("sales_customer_idx").on(t.customerId),
    dateIdx: index("sales_date_idx").on(t.date),
    statusIdx: index("sales_status_idx").on(t.status),
    refIdx: index("sales_ref_idx").on(t.ref),
  }),
);

export const saleItems = pgTable(
  "sale_items",
  {
    ...id(),
    saleId: text("sale_id").notNull(),
    variantId: text("variant_id"),
    productId: text("product_id"),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    qty: integer("qty").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    saleIdx: index("sale_items_sale_idx").on(t.saleId),
    variantIdx: index("sale_items_variant_idx").on(t.variantId),
    productIdx: index("sale_items_product_idx").on(t.productId),
  }),
);

export const suppliers = pgTable(
  "suppliers",
  {
    ...id(),
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    email: text("email"),
    country: text("country"),
    currency: text("currency").default("MWK").notNull(),
    balanceOwed: numeric("balance_owed", { precision: 12, scale: 2 }).default("0").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    activeIdx: index("suppliers_active_idx").on(t.active),
  }),
);

export const orders = pgTable(
  "orders",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    supplierId: text("supplier_id").notNull(),
    status: text("status").default("draft").notNull(),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    projectedRevenue: numeric("projected_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
    orderedAt: timestamp("ordered_at").defaultNow().notNull(),
    receivedAt: timestamp("received_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    supplierIdx: index("orders_supplier_idx").on(t.supplierId),
    statusIdx: index("orders_status_idx").on(t.status),
    refIdx: index("orders_ref_idx").on(t.ref),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    ...id(),
    orderId: text("order_id").notNull(),
    productId: text("product_id"),
    variantId: text("variant_id"),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").default(0).notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orderIdx: index("order_items_order_idx").on(t.orderId),
    productIdx: index("order_items_product_idx").on(t.productId),
    variantIdx: index("order_items_variant_idx").on(t.variantId),
  }),
);

export const receivings = pgTable(
  "receivings",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    supplierId: text("supplier_id"),
    orderId: text("order_id"),
    source: text("source").default("manual").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    supplierIdx: index("receivings_supplier_idx").on(t.supplierId),
    orderIdx: index("receivings_order_idx").on(t.orderId),
    dateIdx: index("receivings_date_idx").on(t.date),
    refIdx: index("receivings_ref_idx").on(t.ref),
  }),
);

export const receivingItems = pgTable(
  "receiving_items",
  {
    ...id(),
    receivingId: text("receiving_id").notNull(),
    productId: text("product_id"),
    variantId: text("variant_id"),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    qty: integer("qty").notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    receivingIdx: index("receiving_items_receiving_idx").on(t.receivingId),
    productIdx: index("receiving_items_product_idx").on(t.productId),
    variantIdx: index("receiving_items_variant_idx").on(t.variantId),
  }),
);

export const layaways = pgTable(
  "layaways",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    customerId: text("customer_id").notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paid: numeric("paid", { precision: 12, scale: 2 }).default("0").notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("layaways_customer_idx").on(t.customerId),
    statusIdx: index("layaways_status_idx").on(t.status),
    refIdx: index("layaways_ref_idx").on(t.ref),
  }),
);

export const layawayPayments = pgTable(
  "layaway_payments",
  {
    ...id(),
    layawayId: text("layaway_id").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: text("method").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    layawayIdx: index("layaway_payments_layaway_idx").on(t.layawayId),
  }),
);

export const customerCredits = pgTable(
  "customer_credits",
  {
    ...id(),
    customerId: text("customer_id").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: text("type").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("customer_credits_customer_idx").on(t.customerId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    ...id(),
    txnId: text("txn_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: text("method").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    storeCreditUsed: boolean("store_credit_used").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    txnIdx: index("payments_txn_idx").on(t.txnId),
    dateIdx: index("payments_date_idx").on(t.date),
  }),
);

export const refunds = pgTable(
  "refunds",
  {
    ...id(),
    saleId: text("sale_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason"),
    date: timestamp("date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    saleIdx: index("refunds_sale_idx").on(t.saleId),
    dateIdx: index("refunds_date_idx").on(t.date),
  }),
);

export const transfers = pgTable(
  "transfers",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    fromLocation: text("from_location").notNull(),
    toLocation: text("to_location").notNull(),
    status: text("status").default("pending").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("transfers_status_idx").on(t.status),
    refIdx: index("transfers_ref_idx").on(t.ref),
  }),
);

export const stocktakes = pgTable(
  "stocktakes",
  {
    ...id(),
    ref: text("ref").notNull().unique(),
    location: text("location").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    status: text("status").default("open").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("stocktakes_status_idx").on(t.status),
    refIdx: index("stocktakes_ref_idx").on(t.ref),
  }),
);

export const stocktakeItems = pgTable(
  "stocktake_items",
  {
    ...id(),
    stocktakeId: text("stocktake_id").notNull(),
    productId: text("product_id"),
    variantId: text("variant_id"),
    countedQty: integer("counted_qty").notNull(),
    recordedQty: integer("recorded_qty").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    stocktakeIdx: index("stocktake_items_stocktake_idx").on(t.stocktakeId),
    productIdx: index("stocktake_items_product_idx").on(t.productId),
    variantIdx: index("stocktake_items_variant_idx").on(t.variantId),
  }),
);

export const activity = pgTable(
  "activity",
  {
    ...id(),
    activity: text("activity").notNull(),
    reference: text("reference"),
    location: text("location"),
    quantity: integer("quantity"),
    when: timestamp("when").defaultNow().notNull(),
    status: text("status").default("ok").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    whenIdx: index("activity_when_idx").on(t.when),
  }),
);

export const cashbook = pgTable(
  "cashbook",
  {
    ...id(),
    date: timestamp("date").defaultNow().notNull(),
    direction: text("direction").notNull(),
    category: text("category").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: text("method").default("cash").notNull(),
    note: text("note"),
    sourceTxnId: text("source_txn_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    dateIdx: index("cashbook_date_idx").on(t.date),
    directionIdx: index("cashbook_direction_idx").on(t.direction),
  }),
);

export const expenses = pgTable(
  "expenses",
  {
    ...id(),
    date: timestamp("date").defaultNow().notNull(),
    category: text("category").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: text("method").default("cash").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    dateIdx: index("expenses_date_idx").on(t.date),
    categoryIdx: index("expenses_category_idx").on(t.category),
  }),
);

export const settings = pgTable(
  "settings",
  {
    ...id(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const migrations = pgTable(
  "migrations",
  {
    ...id(),
    name: text("name").notNull().unique(),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
  },
);

export const appState = pgTable(
  "app_state",
  {
    id: text("id").primaryKey().default("shop360-blank-test-state-v1"),
    payload: text("payload").notNull(),
    version: integer("version").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const appSettings = pgTable(
  "app_settings",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const users = pgTable(
  "users",
  {
    ...id(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    username: text("username").unique(),
    phone: text("phone"),
    avatar: text("avatar"),
    preferences: jsonb("preferences").default({}).notNull(),
    role: text("role").default("owner").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  }),
);

// Server-side sessions. Only a SHA-256 hash of the session token is stored.
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  }),
);
