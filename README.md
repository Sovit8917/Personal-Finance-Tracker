# FinTrack — MERN Personal Finance Tracker

A full-stack personal finance tracker built with **MongoDB, Express, React, and Node.js**.

## Features
- ✅ User Registration & Login (JWT auth + bcrypt)
- ✅ Expense Tracking (CRUD with categories, filters, pagination)
- ✅ Income Management (sources, frequency, recurring)
- ✅ Budget Setting with live progress bars
- ✅ Transaction History (combined view with search & filter)
- ✅ Dashboard with charts (bar + pie via Recharts)

---

## Project Structure
```
finance-tracker/
├── backend/
│   ├── models/         # Mongoose schemas (User, Expense, Income, Budget)
│   ├── routes/         # Express routes (auth, expenses, income, budgets, transactions)
│   ├── middleware/     # JWT auth middleware
│   ├── server.js       # Entry point
│   └── .env.example    # Copy to .env and fill in values
│
└── frontend/
    ├── src/
    │   ├── context/    # AuthContext (global user state)
    │   ├── pages/      # Dashboard, Expenses, Income, Budgets, Transactions, Login, Register
    │   ├── components/ # Layout, Modal
    │   └── utils/      # Axios instance, helper functions
    ├── index.html
    └── vite.config.js  # Proxy to backend on port 5000
```

---

## Setup

### 1. Backend
```bash
cd backend
npm install

# Copy and fill in your MongoDB URI and JWT secret
cp .env.example .env
# Edit .env with your values

npm run dev   # starts with nodemon on port 5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev   # starts Vite on port 5173
```

### 3. MongoDB Atlas
1. Create a free cluster at https://mongodb.com/atlas
2. Create a database user
3. Whitelist your IP (Network Access → 0.0.0.0/0 for dev)
4. Copy the connection string into backend `.env` as `MONGO_URI`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user (protected) |

### Expenses (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses | List with filters & pagination |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/expenses/summary | Category totals for a month |

### Income (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/income | List income records |
| POST | /api/income | Add income |
| PUT | /api/income/:id | Edit income |
| DELETE | /api/income/:id | Delete income |

### Budgets (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/budgets?month=&year= | Budgets with spending progress |
| POST | /api/budgets | Set/update budget (upsert) |
| DELETE | /api/budgets/:id | Remove budget |

### Transactions (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | Combined expense+income history |
| GET | /api/transactions/dashboard | Summary stats + 6-month trend |

---

## Tech Stack
- **MongoDB** + **Mongoose** — Database & ODM
- **Express.js** — REST API
- **React 18** + **React Router v6** — Frontend SPA
- **Vite** — Frontend build tool
- **JWT** + **bcryptjs** — Authentication
- **Recharts** — Charts on dashboard
- **Axios** — HTTP client
