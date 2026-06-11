# FEMS Deployment Checklist

**Status:** Ready for Production Deployment  
**Date:** 2026-06-12  

---

## ✅ Pre-Deployment Verification

### Code Ready?
- ✅ All 10 tasks completed
- ✅ 17/17 tests passed
- ✅ Production-ready code
- ✅ render.yaml configured
- ✅ .env.example complete
- ✅ Documentation complete
- ✅ GitHub repository created

### Do You Have?
- [ ] Render account (render.com)
- [ ] MongoDB Atlas account (mongodb.com/cloud/atlas)
- [ ] GitHub account with SSH keys configured
- [ ] Email for notifications (optional but recommended)

---

## 📋 STEP-BY-STEP DEPLOYMENT

### PHASE 1: MongoDB Atlas Setup (5-10 minutes)

#### Step 1.1: Create MongoDB Atlas Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in or create account
3. Create new project: "FEMS"
4. Click "Build a Database"
5. Choose "M0 Shared" (Free tier)
6. Select AWS as provider
7. Choose region closest to you
8. Click "Create Cluster"

**⏳ Wait 2-3 minutes for cluster to be ready**

#### Step 1.2: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create user:
   ```
   Username: femsuser
   Password: (generate strong password - SAVE IT!)
   ```
4. Set privileges: "Read and write to any database"
5. Click "Add User"

**📝 SAVE your password!**

#### Step 1.3: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (or add specific IPs)
4. Click "Confirm"

#### Step 1.4: Get Connection String
1. Go to "Clusters" → Click "Connect"
2. Select "Drivers" → Node.js
3. Copy the connection string
4. Replace `<password>` with your password
5. Replace `myFirstDatabase` with `fems`

**Example:**
```
mongodb+srv://femsuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fems?retryWrites=true&w=majority
```

**📝 SAVE this connection string!**

---

### PHASE 2: Render Deployment (15-20 minutes)

#### Step 2.1: Prepare for Render
1. You're already on GitHub: https://github.com/couper117/fire
2. Your code is ready to deploy

#### Step 2.2: Create Render Services (Do in this order)

**Service 1: API Gateway (Master Service)**

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect to your GitHub repo: `couper117/fire`
5. Configure:
   ```
   Name: fems-api-gateway
   Runtime: Node
   Build Command: npm install && npm run install:all
   Start Command: npm run start:gateway
   Plan: Free (or Starter for production)
   ```
6. Click "Create Web Service"

**⏳ Wait for deployment (~2 minutes)**

Once deployed, note your URL: `https://fems-api-gateway.onrender.com`

#### Step 2.3: Add Environment Variables to API Gateway
1. In Render, go to your API Gateway service
2. Click "Environment"
3. Add these variables:
   ```
   NODE_ENV=production
   GATEWAY_PORT=4000
   MONGO_URI=mongodb+srv://femsuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fems?retryWrites=true&w=majority
   USER_URL=https://fems-user-service.onrender.com
   EXT_URL=https://fems-extinguisher-service.onrender.com
   INSP_URL=https://fems-inspection-service.onrender.com
   REPORT_URL=https://fems-reporting-service.onrender.com
   ```
4. Click "Save Changes"

---

#### Step 2.4: Deploy Individual Services

**Create these 4 services using the same process:**

**Service 2: User Service**
```
Name: fems-user-service
Build Command: npm install && npm run install:all
Start Command: npm run start:user
Environment Variables:
  NODE_ENV=production
  USER_PORT=4001
  MONGO_URI=<your-mongodb-connection-string>
  JWT_SECRET=<CHANGE_THIS_TO_STRONG_RANDOM_STRING>
```

**Service 3: Extinguisher Service**
```
Name: fems-extinguisher-service
Build Command: npm install && npm run install:all
Start Command: npm run start:extinguisher
Environment Variables:
  NODE_ENV=production
  EXT_PORT=4002
  MONGO_URI=<your-mongodb-connection-string>
```

**Service 4: Inspection Service**
```
Name: fems-inspection-service
Build Command: npm install && npm run install:all
Start Command: npm run start:inspection
Environment Variables:
  NODE_ENV=production
  INSP_PORT=4003
  MONGO_URI=<your-mongodb-connection-string>
  EXT_URL=https://fems-extinguisher-service.onrender.com
  EMAIL_URL=https://fems-email-service.onrender.com
```

**Service 5: Reporting Service**
```
Name: fems-reporting-service
Build Command: npm install && npm run install:all
Start Command: npm run start:reporting
Environment Variables:
  NODE_ENV=production
  REPORT_PORT=4004
  MONGO_URI=<your-mongodb-connection-string>
```

**⏳ Wait for all services to deploy**

---

#### Step 2.5: Deploy Frontend

**Option A: Vercel (Recommended)**
1. Go to https://vercel.com
2. Import your GitHub repo: `couper117/fire`
3. Configure:
   ```
   Build Command: npm --prefix frontend run build
   Output Directory: frontend/dist
   ```
4. Add Environment Variables:
   ```
   VITE_API_URL=https://fems-api-gateway.onrender.com
   VITE_WS_URL=wss://fems-websocket-service.onrender.com
   ```
5. Deploy

**Option B: Render (Alternative)**
1. Create new Static Site on Render
2. Connect GitHub repo
3. Same build command and env vars as above

---

### PHASE 3: Verification (5 minutes)

#### Step 3.1: Test Health Endpoints
```bash
# API Gateway
curl https://fems-api-gateway.onrender.com/health

# User Service
curl https://fems-user-service.onrender.com/health

# Extinguisher Service
curl https://fems-extinguisher-service.onrender.com/health

# Inspection Service
curl https://fems-inspection-service.onrender.com/health

# Reporting Service
curl https://fems-reporting-service.onrender.com/health
```

All should return 200 OK ✅

#### Step 3.2: Test Login
```bash
# Register new user
curl -X POST https://fems-api-gateway.onrender.com/users/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Login
curl -X POST https://fems-api-gateway.onrender.com/users/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### Step 3.3: Test Frontend
1. Open your Vercel/Render frontend URL
2. Should see login page
3. Create account
4. Login
5. See dashboard

✅ **If all tests pass, you're live!**

---

## 📊 Post-Deployment

### Monitor Your System
1. Check Render service logs
2. Monitor MongoDB Atlas metrics
3. Test API endpoints regularly
4. Check frontend loading

### Set Up Alerts (Recommended)
1. Render: Enable email notifications
2. MongoDB Atlas: Enable alerts
3. Monitor error rates

### Regular Maintenance
1. Check logs weekly
2. Update dependencies monthly
3. Monitor database size
4. Backup important data

---

## 🚨 Troubleshooting

### Service Won't Start
1. Check Render logs
2. Verify environment variables
3. Check MongoDB connection string
4. Ensure all required env vars are set

### Database Connection Error
1. Verify connection string format
2. Check MongoDB Atlas IP whitelist
3. Verify username/password
4. Check database name is `fems`

### Frontend Can't Connect to API
1. Verify VITE_API_URL is correct
2. Check CORS configuration
3. Check API Gateway is running
4. Check network requests in browser DevTools

### Services Can't Talk to Each Other
1. Verify service URLs in environment variables
2. Check each service is running (health endpoint)
3. Verify network is accessible
4. Check Render service logs

---

## ✅ Final Checklist

Before marking as complete:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string saved
- [ ] API Gateway deployed
- [ ] User Service deployed
- [ ] Extinguisher Service deployed
- [ ] Inspection Service deployed
- [ ] Reporting Service deployed
- [ ] Frontend deployed
- [ ] All health endpoints return 200 OK
- [ ] Login/Register works
- [ ] Dashboard loads
- [ ] API can be accessed from frontend

---

## 🎉 Deployment Complete!

Once all checks pass:

**Your FEMS System is Live!** 🚀

### Access Points
- **Frontend:** Your Vercel/Render URL
- **API Gateway:** https://fems-api-gateway.onrender.com
- **API Docs:** https://fems-api-gateway.onrender.com/users/api/docs/

### Next Steps
1. Monitor system performance
2. Gather user feedback
3. Plan future enhancements
4. Set up CI/CD pipeline

---

## 📚 Need Help?

Refer to:
- **DEPLOYMENT.md** - Detailed deployment guide
- **SYSTEM_STATUS.md** - System overview
- **docs/QUICK_START.md** - Quick reference
- **reports/INDEX.md** - All available reports

---

**Deployment Date:** _______________  
**Deployed By:** ___________________  
**Status:** ✅ Ready to Deploy
