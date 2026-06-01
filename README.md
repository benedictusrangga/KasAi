# AI Accounting SaaS

A modern AI-powered accounting platform for small businesses and freelancers to track expenses, extract transactions from natural language, and get financial insights.

## Features

### 🔐 Authentication & User Management
- Email/password authentication via Better Auth
- Secure session management
- Multi-business support per user
- User profile management

### 💼 Business Management
- Create and manage multiple businesses
- Support for different business types (Florist, Laundry, Cafe, Retail, Other)
- Business-specific expense tracking

### 📊 Expense Management
- Add expenses manually with categorization
- Automatic categorization via AI
- Multiple entry sources (manual, Telegram, voice notes, receipt images)
- Bulk import and batch processing

### 🤖 AI Features
- **Natural Language Processing**: Extract expenses from text descriptions
  - Example: "Spent 150000 on coffee supplies" → Auto-extracts amount, category, description
- **Receipt OCR**: Upload receipt images for automatic extraction
- **AI Chat Assistant**: Interactive conversation to add expenses and get spending insights
- **Smart Categorization**: Automatically categorizes expenses into predefined categories
- Powered by Google Gemini API (free tier)

### 📈 Analytics & Reporting
- Real-time financial dashboard with key metrics
- Monthly spending trends
- Category breakdown analysis
- Entry source statistics
- Average and highest transaction tracking

### 🎯 Categories
- Groceries
- Transportation
- Utilities
- Entertainment
- Dining
- Shopping
- Healthcare
- Education
- Office Supplies
- Other

## Tech Stack

### Frontend & Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library

### Backend & Database
- **Neon PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication and sessions

### AI & Machine Learning
- **Google Gemini API** - Free tier for AI features
  - Text extraction and categorization
  - Receipt OCR
  - Chat intelligence

### Infrastructure
- **Vercel** - Deployment and serverless functions
- **Vercel Blob** - File storage (for receipt images)

## Project Structure

```
app/
├── api/
│   └── auth/[...all]/route.ts       # Better Auth handler
├── page.tsx                         # Dashboard home
├── sign-in/page.tsx                 # Sign in page
├── sign-up/page.tsx                 # Sign up page
├── setup/page.tsx                   # Business setup
├── dashboard/[businessId]/
│   ├── page.tsx                     # Business dashboard
│   ├── add-expense/page.tsx         # Add expense form
│   ├── ai-chat/page.tsx             # AI assistant
│   └── reports/page.tsx             # Financial reports
└── actions/
    ├── business.ts                  # Business operations
    ├── transaction.ts               # Transaction operations
    └── ai-chat.ts                   # AI chat operations

lib/
├── auth.ts                          # Better Auth configuration
├── auth-client.ts                   # Better Auth client
├── gemini.ts                        # Gemini AI utilities
└── db/
    ├── index.ts                     # Drizzle database client
    └── schema.ts                    # Database schema

components/
├── auth-form.tsx                    # Sign in/up form
├── business-form.tsx                # Business creation form
├── add-expense-form.tsx             # Expense form
└── ai-chat.tsx                      # AI chat component
```

## Database Schema

### Core Tables
- **user** - User accounts
- **session** - Active sessions
- **account** - OAuth accounts
- **verification** - Email verification tokens

### Business Tables
- **business** - Business information (name, type, description)
- **category** - Expense categories per business
- **transaction** - Expense records
- **report** - Generated financial reports
- **ai_chat** - Chat conversation history

## Environment Variables

```env
# Database
DATABASE_URL=your_neon_postgres_url

# Authentication
BETTER_AUTH_SECRET=generate_with_openssl_rand_-base64_32

# AI
GEMINI_API_KEY=your_google_gemini_api_key
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm or npm
- Neon PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-accounting
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Start the development server:
```bash
pnpm dev
```

Visit http://localhost:3000 to see the application.

## Usage

### 1. Sign Up
Create a new account with email and password.

### 2. Create a Business
After signing up, create your first business with a name and type.

### 3. Add Expenses
- **Manual**: Click "Add Expense" to enter details
- **AI Assistant**: Use the AI chat to describe expenses naturally
- **Receipt**: Upload receipt images for OCR extraction

### 4. View Analytics
Navigate to Reports to see spending trends and insights.

## AI Features in Detail

### Natural Language Expense Extraction
Describe transactions naturally:
- "Bought coffee beans for 150000"
- "Paid rent 5000000"
- "Gas station fill up 200000"

The AI automatically extracts:
- Amount
- Description
- Category
- Confidence score

### Receipt OCR
Upload receipt images to automatically extract:
- Item names and prices
- Total amounts
- Categories

### AI Chat Assistant
Ask questions like:
- "How much did I spend on groceries this month?"
- "Show me my highest expenses"
- "What's my spending trend?"

The AI analyzes your data and provides insights.

## Security

- User authentication via Better Auth with secure sessions
- Password hashing and salting
- No RLS (Row Level Security) on Neon - all queries scoped by userId
- CORS protection
- Environment variables for sensitive data
- Type-safe database queries via Drizzle ORM

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
pnpm run build  # Test build locally
```

## Future Enhancements

- [ ] Telegram integration for direct expense submission
- [ ] Voice note support
- [ ] PDF report generation
- [ ] Budget tracking and alerts
- [ ] Recurring expense management
- [ ] Team/multi-user support
- [ ] Mobile app
- [ ] Integration with payment processors
- [ ] Export to accounting software

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Open a GitHub issue
- Contact support@aiaccounting.app

## Roadmap

### Phase 1 (MVP) - Complete
- Authentication and user management
- Business management
- Manual expense tracking
- Basic AI extraction
- Financial dashboard

### Phase 2 - In Progress
- Advanced AI features
- Receipt OCR
- Telegram integration
- Report exports

### Phase 3 - Planned
- Team management
- Budget tracking
- Recurring expenses
- Mobile app
