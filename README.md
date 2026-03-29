# TradeFxBook Clone

A comprehensive trading journal application built with Next.js 14, Prisma, and Tailwind CSS.

## Features

- **Trade Management**: Track all your trades with detailed information
- **Performance Analytics**: View comprehensive statistics and charts
- **Strategy Tracking**: Monitor performance by strategy
- **Screenshot Support**: Attach charts and analysis screenshots
- **Tagging System**: Organize trades with custom tags
- **Dark Theme**: Eye-friendly dark UI optimized for traders
- **CSV Import**: Bulk import trades from broker exports
- **Risk Analysis**: Track R-multiples and risk metrics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Charts**: Recharts + Lightweight Charts
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and other configuration.

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main entities:
- **Users**: User accounts and authentication
- **Accounts**: Broker account connections
- **Trades**: Individual trade records with full details
- **Tags**: Custom tags for organizing trades
- **Strategies**: Trading strategies for performance tracking
- **Settings**: User preferences and configuration

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## License

MIT
