import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'

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
})

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
})

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
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  type: businessTypeEnum('type').notNull(),
  description: text('description'),
  logo_url: text('logo_url'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const category = pgTable('category', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: categoryTypeEnum('type').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const transaction = pgTable('transaction', {
  id: text('id').primaryKey(),
  businessId: text('businessId').notNull().references(() => business.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  transaction_type: transactionTypeEnum('transaction_type').notNull().default('expense'),
  description: text('description').notNull(),
  categoryId: text('categoryId').references(() => category.id, { onDelete: 'set null' }),
  source: expenseSourceEnum('source').notNull().default('manual'),
  receipt_url: text('receipt_url'),
  tags: text('tags').array(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

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
