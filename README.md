# Split & Settle 💰

**Effortless group expense splitting for your trips, dinners, and shared living.**

Built with React Native + Expo. No backend, no sign-ups, no BS. Just split expenses and settle up with friends — all offline.

---

## ✨ Features

- **Smart Settlement** — Minimizes transactions with an optimized debt-simplification algorithm
- **Group Categories** — Trip ✈️, Roommates 🏠, Dinner 🍽️, Party 🎉, Shopping 🛒, Office 💼
- **Equal & Unequal Splits** — Split evenly or set custom amounts per person
- **Expense Categories** — Food, Transport, Stay, Fun, Shopping, Bills
- **Analytics Dashboard** — Spending trends, category breakdown, member comparison charts
- **Multi-Currency** — ₹ $ € £ ¥ ₩ support
- **Fully Offline** — All data stored locally on device via AsyncStorage
- **Security Hardened** — Input validation (OWASP), rate limiting, XSS sanitization

---

## 🚀 Quick Setup

```bash
# 1. Clone
git clone https://github.com/not-umesh/Group-expense-splitter-android-app.git
cd Group-expense-splitter-android-app/split-settle

# 2. Install dependencies
npm install

# 3. Run on device/emulator
npx expo start

# 4. Build APK (Android)
eas build --platform android --profile preview
```

> **Note:** You need an [Expo](https://expo.dev) account for EAS builds.

---

## 📁 Project Structure

```
split-settle/
├── app/                    # Screens (Expo Router file-based routing)
│   ├── (tabs)/             # Tab screens: Home, History, Analytics, Settings
│   ├── group/[id]/         # Group detail, Add Expense, Settle Up
│   └── create-group.tsx    # Create new group
├── components/             # Reusable UI components
├── constants/theme.ts      # Design system (colors, spacing, typography)
├── store/useStore.ts       # Zustand state management (validated & sanitized)
├── types/index.ts          # TypeScript interfaces
└── utils/
    ├── helpers.ts           # Formatting utilities
    ├── settlement.ts        # Debt simplification algorithm
    ├── validation.ts        # Input validation (OWASP A03)
    └── rateLimiter.ts       # Token-bucket rate limiter
```

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Input Validation | Schema-based validators for all user inputs |
| XSS Prevention | Control char stripping, angle bracket removal |
| Rate Limiting | Token-bucket algorithm (5 ops/10s create, 3 ops/15s delete) |
| Data Sanitization | All string inputs sanitized before storage |
| Capacity Limits | Max 50 groups, 500 expenses/group, 20 members/group |
| Type Safety | Full TypeScript with strict mode |

---

## 🛠 Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Routing:** Expo Router (file-based)
- **State:** Zustand + AsyncStorage
- **UI:** Custom components, LinearGradient, Material Community Icons
- **Language:** TypeScript

---

## 📱 Screens

1. **Home** — Summary card + group list with FAB
2. **Create Group** — Name, category, add members
3. **Group Detail** — 3-tab view (Expenses / Balances / Stats)
4. **Add Expense** — Amount, category, payer, equal/unequal split
5. **Settle Up** — Confirm settlement between members
6. **History** — All expenses across groups, sorted by date
7. **Analytics** — Category pie chart, spending trends, member comparison
8. **Settings** — Currency picker, stats, clear data

---

<p align="center">
  <code>&lt;/UV&gt;</code> — built different, split better.
</p>
