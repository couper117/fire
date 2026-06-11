# Quick Start Guide

## 🚀 Get FEMS Running in 2 Minutes

### Prerequisites
- Node.js installed
- MongoDB running locally (or Atlas connection string)

### Step 1: Start Backend (Terminal 1)
```bash
cd FEMS-fire-extinguisher-system
npm install:all
npm start
```

✅ You should see:
```
FEMS is up.
Gateway: http://localhost:4000
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd FEMS-fire-extinguisher-system/frontend
npm run dev
```

✅ You should see:
```
VITE ready in 308ms
Local: http://localhost:5173
```

### Step 3: Open in Browser
```
http://localhost:5173
```

### Step 4: Create Account
- Click "Create one" link
- Fill in form with strong password (uppercase, lowercase, number, special char)
- Click "Create Account"

### Step 5: Login
- Use credentials you just created
- Explore dashboard

---

## 🎯 What to Try

### Basic Features
- ✅ Register new user
- ✅ Login with credentials
- ✅ View dashboard
- ✅ Check statistics

### Admin Features (if admin role)
- ✅ Manage users
- ✅ View user list
- ✅ Create/edit users
- ✅ Filter by role

### API Testing
```bash
# Test health
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/users/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

---

## 🔧 Troubleshooting

### Port already in use?
```bash
# Find process on port 4000
lsof -i :4000

# Kill it
kill -9 <PID>
```

### Frontend not loading?
```bash
# Clear cache
rm -rf node_modules/.vite .vite

# Reinstall
npm install --legacy-peer-deps

# Restart
npm run dev
```

### Backend not starting?
```bash
# Kill all node processes
pkill -f node

# Reinstall
npm run install:all

# Restart
npm start
```

---

## 📚 Next Steps

- Read [SYSTEM_STATUS.md](../SYSTEM_STATUS.md) for detailed information
- Read [DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment
- Read [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) for all features

---

**Ready?** → **http://localhost:5173**
