# Personal Expense & Income Tracker

A modern, premium-quality personal finance application designed specifically for salaried individuals, employees, professionals, students, and freelancers. Inspired by the clean workflows of industry leaders like Expensify and Zoho Expense, this app replaces complex business jargon with intuitive personal budgeting, goal planning, and smart insights.

## Features

- **Elegant Premium UI/UX:** Built with Tailwind CSS, supporting both Light and Dark mode seamlessly with a persistent sidebar toggle.
- **Robust Authentication:** Complete Firebase Auth integration supporting Sign In, Sign Up, Google Sign-In, Password Reset, Remember Me, and Password Visibility toggles.
- **Comprehensive Dashboard:** Instant financial overview with top summary cards, real-time charts (Income vs Expense, Spending Breakdown, Cash Flow, Savings Growth), quick actions, upcoming bills, and a Financial Health Score widget.
- **Transactions Module:** Full management of Income and Expenses across tailored categories. Filter, search, sort, edit, delete, bulk actions, pagination, and export capabilities.
- **Multiple Account Management:** Track finances across Cash, Bank Accounts, Savings Accounts, Wallets, and Credit Cards with internal transfer tracking.
- **Advanced Analytics:** Custom date range selection, account filtering, and category analysis with interactive Line, Bar, Pie, and Area charts.
- **Dynamic Budgets:** Set Monthly, Category, and Savings budgets with visual progress bars, remaining budget calculations, and over-budget alerts.
- **Goals & Savings:** Visual tracking for Emergency Funds, New Phones, Cars, House Deposits, Travel, and Education with progress percentages and estimated completion dates.
- **Smart Features & Insights:** Automatic recurring bills, subscription tracking, spending insights (e.g., "You spent 18% more on dining this month"), and savings recommendations.
- **Notifications:** Milestone alerts, upcoming bill reminders, budget exceed alerts, and monthly summaries.
- **Settings & Data Management:** Profile customization, currency/language/theme preferences, backup/export data, change password, and account deletion.

## Project Architecture & File Structure

```
expense-tracker-app/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/          # Auth Screen, Protected Route
│   │   ├── layout/        # Collapsible Sidebar, Header, Page Layout
│   │   ├── dashboard/     # Financial Overview, Summary Cards, Widgets
│   │   ├── transactions/  # Transaction Management, Filters, Modals
│   │   ├── accounts/      # Multi-account cards, Transfer functionality
│   │   ├── analytics/     # Advanced Charts (Line, Bar, Pie, Area)
│   │   ├── budgets/       # Budget allocation, tracking, alerts
│   │   ├── goals/         # Savings goals, milestone tracking
│   │   ├── reports/       # Report generation & exports (PDF, CSV, Excel)
│   │   ├── smart/         # Smart insights, recurring transactions, bills
│   │   ├── notifications/ # User alert center
│   │   └── settings/      # Preferences, user security, data export
│   ├── context/           # AuthContext, ThemeContext, FinanceContext
│   ├── firebase/          # Config, Auth & Database wrapper services
│   ├── types/             # TypeScript definitions for Firestore models
│   ├── App.tsx            # Main component routing
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind & custom scrollbar styles
├── firestore.rules        # Secure Firestore rules with data isolation
├── firestore.indexes.json # Composite indexes for high-performance queries
├── package.json           # Project dependencies
├── tailwind.config.js     # Custom theme & dark mode configuration
├── tsconfig.json          # TypeScript compiler configuration
├── FIREBASE_GUIDE.md      # Setup guide for Firebase integration
└── DEPLOYMENT.md          # Guides for Vercel, Netlify, Firebase, GitHub Pages
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone or Extract the Repository:**
   Navigate into the project root directory:
   ```bash
   cd expense-tracker-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Open `src/firebase/config.ts` and replace the placeholder API keys with your Firebase project credentials. See `FIREBASE_GUIDE.md` for complete step-by-step instructions.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Production Build:**
   ```bash
   npm run build
   ```

## Design and Customization
- **Theme:** Uses Tailwind CSS `class` strategy for Dark Mode. The toggle in the sidebar adds/removes the `dark` class on the root `<html>` element.
- **Charts:** Powered by `chart.js` and `react-chartjs-2` configured with sleek custom tooltips and elegant colors matching premium fintech design principles.

## License
MIT License.
