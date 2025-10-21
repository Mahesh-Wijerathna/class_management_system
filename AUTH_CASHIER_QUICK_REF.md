# Quick Reference: Auth vs Cashier

## TL;DR (Too Long; Didn't Read)

### Auth Folder = User Accounts
- 👤 Who can log in?
- 🔐 Password verification
- 🎭 User roles (student, teacher, admin, **cashier**)
- 📝 User profiles (name, email, phone)

### Cashier Folder = Cashier Work
- 💰 Daily cash collections
- 🧾 Receipt counting
- 📊 KPI tracking
- 🗃️ Activity logs
- 💵 Cash drawer management

---

## Simple Rule

**If it's about USERS → Auth folder**  
**If it's about CASHIER WORK → Cashier folder**

---

## Examples

| Task | Where? | Why? |
|------|--------|------|
| Create cashier user account | ✅ Auth | User management |
| Cashier login | ✅ Auth | Authentication |
| Start cashier session | ✅ Cashier | Business logic |
| Track daily collections | ✅ Cashier | Business data |
| Store cashier password | ✅ Auth | User credentials |
| Log payment collection | ✅ Cashier | Activity tracking |
| Verify cashier role | ✅ Auth | User verification |
| Generate day end report | ✅ Cashier | Business reporting |

---

## Current Setup (Correct ✅)

```
backend/
│
├── auth/                    ← Manages ALL users
│   ├── Database: auth-db
│   │   └── users table
│   │       ├── S00001 (student)
│   │       ├── T00001 (teacher)
│   │       ├── A00001 (admin)
│   │       └── C00001 (cashier) ✅
│   │
│   └── APIs:
│       ├── POST /login      ← All users (including cashiers)
│       ├── POST /register
│       └── POST /forgot-password
│
└── cashier/                 ← Manages cashier WORK
    ├── Database: cashier_db
    │   ├── cashier_sessions
    │   ├── session_activities
    │   └── cash_drawer_transactions
    │
    └── APIs:
        ├── POST /api/session/start
        ├── POST /api/session/update-kpis
        └── POST /api/session/close-day
```

---

## Connection Between Them

```
When cashier starts a session:

1. Cashier logs in
   → Auth service verifies credentials
   → Returns: token, cashier name

2. Cashier opens cash drawer
   → Cashier service checks: "Is C00001 a cashier?"
   → Reads from auth-db (read-only)
   → Creates session in cashier_db
```

**Key Point:** Cashier service **READS** from auth database but **WRITES** to its own database.

---

## Answer to Your Question

> "Is it needed to include cashier related things in auth folder?"

**NO!** ❌

- Auth folder already has cashier **users** (C00001, C00002, etc.)
- That's all auth needs - just the user account
- All cashier **work** (sessions, KPIs, cash) goes in cashier folder

**You don't need to add anything to auth folder for cashier functionality.**  
**Everything is already set up correctly!** ✅

---

## What We Already Did

✅ Auth database has cashier users (role='cashier')  
✅ Cashier service connects to auth DB to verify users  
✅ Cashier service has its own DB for business data  
✅ Clean separation of concerns  
✅ No duplication  

**Nothing needs to be added to auth folder!** 🎉
