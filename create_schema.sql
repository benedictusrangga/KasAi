BEGIN;

-- Enum types (create only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
    CREATE TYPE category_type AS ENUM (
      'groceries','transportation','utilities','entertainment','dining',
      'shopping','healthcare','education','office_supplies','other'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_source') THEN
    CREATE TYPE expense_source AS ENUM (
      'manual','telegram','voice_note','receipt_image','api'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('expense','income');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
    CREATE TYPE business_type AS ENUM ('florist','laundry','cafe','retail','other');
  END IF;
END
$$;

-- Users (Better Auth style; keep camelCase column names quoted)
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "phoneNumber" text UNIQUE,
  "telegramId" text,
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  "accountType" text DEFAULT 'personal',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refreshToken" text,
  "accessToken" text,
  "expiresAt" text,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);


-- Compatibility columns for Better Auth defaults (non-destructive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='accountId'
  ) THEN
    ALTER TABLE account ADD COLUMN accountId text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='providerId'
  ) THEN
    ALTER TABLE account ADD COLUMN providerId text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='idToken'
  ) THEN
    ALTER TABLE account ADD COLUMN "idToken" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='accessTokenExpiresAt'
  ) THEN
    ALTER TABLE account ADD COLUMN "accessTokenExpiresAt" timestamp;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='refreshTokenExpiresAt'
  ) THEN
    ALTER TABLE account ADD COLUMN "refreshTokenExpiresAt" timestamp;
  END IF;
  -- add password column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='account' AND column_name='password'
  ) THEN
    ALTER TABLE account ADD COLUMN password text;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  name text NOT NULL,
  type business_type NOT NULL,
  description text,
  logo_url text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category (
  id text PRIMARY KEY,
  "businessId" text NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  name text NOT NULL,
  type category_type NOT NULL,
  description text,
  icon text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_products (
  id text PRIMARY KEY,
  "businessId" text NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2),
  unit text DEFAULT 'pcs',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "transaction" (
  id text PRIMARY KEY,
  "businessId" text NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  "userId" text NOT NULL,
  amount numeric(12,2) NOT NULL,
  transaction_type transaction_type NOT NULL DEFAULT 'expense',
  description text NOT NULL,
  "categoryId" text REFERENCES category(id) ON DELETE SET NULL,
  source expense_source NOT NULL DEFAULT 'manual',
  receipt_url text,
  tags text[],
  notes text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report (
  id text PRIMARY KEY,
  "businessId" text NOT NULL,
  "userId" text NOT NULL,
  title text NOT NULL,
  report_type text NOT NULL,
  date_range_start timestamp NOT NULL,
  date_range_end timestamp NOT NULL,
  data jsonb,
  generated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat (
  id text PRIMARY KEY,
  "businessId" text NOT NULL,
  "userId" text NOT NULL,
  messages jsonb NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  step text NOT NULL,
  completed boolean DEFAULT false,
  data jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

COMMIT;

 