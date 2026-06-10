
🏋️ Gym Management System
A modern, robust, and scalable platform designed to streamline gym operations. Built to handle everything from member life-cycles to financial reporting with a clean, responsive interface.

🚀 Features
Secure Authentication: User and admin access management.

Member Management: Comprehensive tracking of member profiles and statuses.

Membership Plans: Flexible configuration for various subscription tiers.

Attendance Tracking: Real-time logging of member check-ins.

Billing & Financials: Automated tracking of payments and subscription status.

Dashboard Analytics: Insightful data visualization for facility management.

Responsive Design: Optimized for seamless usage across all devices.

🛠 Tech Stack
Framework: Next.js 15 (App Router)

Language: TypeScript

Database & Auth: Supabase

Styling: Tailwind CSS

🏗 Database Schema Overview
The system architecture utilizes the following core modules:

members: Central repository for personal and status data.

membership_plans: Definitions for pricing and duration.

subscriptions: Tracks the relationship between members and their chosen plans.

check_ins: Attendance history logging.

payments: Financial transaction records.

🚀 Getting Started
Prerequisites
Node.js 18+

A Supabase account and project

npm, yarn, pnpm, or bun

Installation
Clone the repository:

Bash
git clone https://github.com/your-username/gym-management.git
cd gym-management
2. Install dependencies:
   ```bash
   npm install
Configure your environment variables in a .env.local file (see .env.example).

Start the development server:

npm run dev

   Access the application at [http://localhost:3000](http://localhost:3000).

## 📈 Deployment
This project is optimized for deployment on the [Vercel Platform](https://vercel.com/new). Refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

***
