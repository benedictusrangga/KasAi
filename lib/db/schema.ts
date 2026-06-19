import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phoneNumber').unique(),
  telegramId: text('telegramId'),
  currency: text('currency').default('USD'),
  timezone: text('timezone').default('UTC'),
  accountType: text('accountType').default('personal'), // 'personal' or 'business'
  plan: text('plan').default('free'),                   // plan id from PLANS
  planExpiresAt: timestamp('planExpiresAt'),             // null = no expiry (lifetime/manual)
  aiPersona: text('aiPersona').default('professional'), // AI personality: professional | sahabat | coach | santai
  activeTelegramBusinessId: text('activeTelegramBusinessId'), // bisnis aktif untuk Telegram bot
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
}, (t) => [
  index('session_userId_idx').on(t.userId),
  index('session_expiresAt_idx').on(t.expiresAt),
])

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: text('expiresAt'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  accountId: text('accountId'),
  providerId: text('providerId'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('account_userId_idx').on(t.userId),
])

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- Enum types ---
export const categoryTypeEnum = pgEnum('category_type', [
  'groceries',
  'transportation',
  'utilities',
  'entertainment',
  'dining',
  'shopping',
  'healthcare',
  'education',
  'office_supplies',
  'other',
])

export const expenseSourceEnum = pgEnum('expense_source', [
  'manual',
  'telegram',
  'voice_note',
  'receipt_image',
  'api',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'expense',
  'income',
])

export const businessTypeEnum = pgEnum('business_type', [
  'florist',
  'laundry',
  'cafe',
  'retail',
  'other',
])

// --- App tables ---
export const business = pgTable('business', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),  // owner
  name: text('name').notNull(),
  type: businessTypeEnum('type').notNull(),
  description: text('description'),
  logo_url: text('logo_url'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('business_userId_idx').on(t.userId),
])

// Member roles: owner (auto), admin (can input transactions), viewer (read-only)
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'viewer'])
export const memberStatusEnum = pgEnum('member_status', ['pending', 'active', 'removed'])

export const businessMember = pgTable('business_member', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }), // null until accepted
  invitedByUserId: text('invitedByUserId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),       // email yang diundang
  role: memberRoleEnum('role').notNull().default('admin'),
  status: memberStatusEnum('status').notNull().default('pending'),
  inviteToken: text('inviteToken').unique(), // token untuk accept invite
  invitedAt: timestamp('invitedAt').notNull().defaultNow(),
  joinedAt: timestamp('joinedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('bm_businessId_idx').on(t.businessId),
  index('bm_userId_idx').on(t.userId),
  index('bm_businessId_userId_status_idx').on(t.businessId, t.userId, t.status),
  index('bm_email_businessId_idx').on(t.email, t.businessId),
])

export const category = pgTable('category', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: categoryTypeEnum('type').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('category_businessId_idx').on(t.businessId),
])

export const transaction = pgTable('transaction', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull(),   // owner bisnis (untuk plan limit counting)
  inputByUserId: text('inputByUserId'), // siapa yang benar-benar input (bisa admin/member)
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  transaction_type: transactionTypeEnum('transaction_type').notNull().default('expense'),
  description: text('description').notNull(),
  categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
  categoryName: text('categoryName'), // human-readable nama kategori (custom atau dari enum)
  source: expenseSourceEnum('source').notNull().default('manual'),
  receipt_url: text('receipt_url'),
  tags: text('tags').array(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  // Index paling penting — hampir semua query filter by businessId
  index('tx_businessId_idx').on(t.businessId),
  // Untuk plan limit counting (COUNT per bulan)
  index('tx_businessId_createdAt_idx').on(t.businessId, t.createdAt),
  // Untuk filter by type (income/expense)
  index('tx_businessId_type_idx').on(t.businessId, t.transaction_type),
  // Untuk budget check per kategori
  index('tx_businessId_categoryId_idx').on(t.businessId, t.categoryId),
])

export const report = pgTable('report', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  report_type: text('report_type').notNull(),
  date_range_start: timestamp('date_range_start').notNull(),
  date_range_end: timestamp('date_range_end').notNull(),
  data: jsonb('data'),
  generated_at: timestamp('generated_at').notNull().defaultNow(),
})

export const aiChat = pgTable('ai_chat', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull(),
  userId: text('userId').notNull(),
  messages: jsonb('messages').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const businessProducts = pgTable('business_products', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }),
  unit: text('unit').default('pcs'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const onboardingProgress = pgTable('onboarding_progress', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  step: text('step').notNull(),
  completed: boolean('completed').default(false),
  data: jsonb('data'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const goal = pgTable('goal', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  businessId: text('businessId').references(() => business.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  targetAmount: decimal('targetAmount', { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal('currentAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  deadline: timestamp('deadline'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('goal_businessId_idx').on(t.businessId),
  index('goal_userId_idx').on(t.userId),
])

export const budget = pgTable('budget', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  businessId: text('businessId').references(() => business.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  period: text('period').notNull().default('monthly'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('budget_businessId_userId_idx').on(t.businessId, t.userId),
])

// ── Hutang (Payable — kita yang berhutang ke orang lain) ──────────────────────
export const payable = pgTable('payable', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  contactName: text('contactName').notNull(),
  contactPhone: text('contactPhone'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paidAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  description: text('description').notNull(),
  dueDate: timestamp('dueDate'),
  status: text('status').notNull().default('unpaid'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('payable_businessId_idx').on(t.businessId),
  index('payable_businessId_status_idx').on(t.businessId, t.status),
])

export const receivable = pgTable('receivable', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  contactName: text('contactName').notNull(),
  contactPhone: text('contactPhone'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paidAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  description: text('description').notNull(),
  dueDate: timestamp('dueDate'),
  status: text('status').notNull().default('unpaid'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('receivable_businessId_idx').on(t.businessId),
  index('receivable_businessId_status_idx').on(t.businessId, t.status),
])

// ── Inventaris ────────────────────────────────────────────────────────────────
export const inventoryItem = pgTable('inventory_item', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  unit: text('unit').notNull().default('pcs'),
  currentStock: decimal('currentStock', { precision: 12, scale: 2 }).notNull().default('0'),
  minStock: decimal('minStock', { precision: 12, scale: 2 }).default('0'),
  buyPrice: decimal('buyPrice', { precision: 12, scale: 2 }),
  sellPrice: decimal('sellPrice', { precision: 12, scale: 2 }),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('inv_item_businessId_idx').on(t.businessId),
])

export const inventoryLog = pgTable('inventory_log', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  itemId: text('itemId').notNull().references(() => inventoryItem.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'in' | 'out' | 'adjustment'
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  note: text('note'),
  transactionId: text('transactionId').references(() => transaction.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (t) => [
  index('inv_log_itemId_idx').on(t.itemId),
  index('inv_log_businessId_idx').on(t.businessId),
])

// ── Konfigurasi fitur per bisnis ──────────────────────────────────────────────
export const userFeatureConfig = pgTable('user_feature_config', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().unique().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  enableInventory: boolean('enableInventory').notNull().default(false),
  enablePayables: boolean('enablePayables').notNull().default(false),
  enableReceivables: boolean('enableReceivables').notNull().default(false),
  enableBudget: boolean('enableBudget').notNull().default(true),
  enableGoals: boolean('enableGoals').notNull().default(true),
  enableTelegram: boolean('enableTelegram').notNull().default(true),
  enableTeam: boolean('enableTeam').notNull().default(false),
  // Apakah kontribusi goal dihitung sebagai pengeluaran di laporan?
  // true  = kontribusi goal SEKALIGUS mencatat transaksi expense ("Tabungan Motor")
  // false = goal terpisah dari catatan transaksi (default)
  goalContributionAsExpense: boolean('goalContributionAsExpense').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// ── Komentar transaksi ────────────────────────────────────────────────────────
export const transactionComment = pgTable('transaction_comment', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  transactionId: text('transactionId').references(() => transaction.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (t) => [
  index('txcomment_transactionId_idx').on(t.transactionId),
  index('txcomment_businessId_idx').on(t.businessId),
])

// ── Relations (untuk Drizzle query API dengan `with`) ─────────────────────────

export const businessMemberRelations = relations(businessMember, ({ one }) => ({
  business: one(business, {
    fields: [businessMember.businessId],
    references: [business.id],
  }),
  user: one(user, {
    fields: [businessMember.userId],
    references: [user.id],
  }),
  invitedBy: one(user, {
    fields: [businessMember.invitedByUserId],
    references: [user.id],
    relationName: 'invitedByUser',
  }),
}))

export const businessRelations = relations(business, ({ many }) => ({
  members: many(businessMember),
  comments: many(transactionComment),
}))

export const transactionCommentRelations = relations(transactionComment, ({ one }) => ({
  user: one(user, {
    fields: [transactionComment.userId],
    references: [user.id],
  }),
  business: one(business, {
    fields: [transactionComment.businessId],
    references: [business.id],
  }),
  transaction: one(transaction, {
    fields: [transactionComment.transactionId],
    references: [transaction.id],
  }),
}))
