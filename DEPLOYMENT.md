# FEMS Deployment Guide

This guide explains how to deploy FEMS (Fire Extinguisher Management System) to production using MongoDB Atlas and Render.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Browser / Frontend                     │
│              (Vercel / Render Static)                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│            FEMS API Gateway (Render)                    │
│              https://fems-api.onrender.com              │
└──┬──────────────────┬─────────────────┬────────────────┘
   │                  │                 │
   ▼                  ▼                 ▼
┌────────┐       ┌─────────┐       ┌──────────┐
│ User   │       │Extinguish│      │Inspection│
│Service │       │ Service  │      │ Service  │
└───┬────┘       └────┬─────┘      └─────┬────┘
    │                 │                  │
    └─────────────────┼──────────────────┘
                      │
            ┌─────────▼─────────┐
            │  MongoDB Atlas    │
            │    (Cloud DB)     │
            └───────────────────┘
```

## Prerequisites

1. **GitHub Account** - to push code to Render
2. **MongoDB Atlas Account** - free tier available at https://www.mongodb.com/cloud/atlas
3. **Render Account** - free tier available at https://render.com

## Step 1: Set up MongoDB Atlas

### 1.1 Create a MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Create an account (or sign in if you already have one)
3. Create a new project: "FEMS Production"

### 1.2 Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Shared" (Free) or higher tier
3. Select AWS as provider
4. Choose a region close to you
5. Click "Create Cluster"

### 1.3 Set Up Database Access
1. Go to "Database Access" in the left menu
2. Click "Add New Database User"
3. Create username: `femsuser`
4. Generate password: Use a strong password and **save it**
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development) or add specific IPs (for production)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Clusters" and click "Connect"
2. Select "Drivers"
3. Choose Node.js
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `fems`

**Example connection string:**
```
mongodb+srv://femsuser:YourPassword@cluster0.xxxxx.mongodb.net/fems?retryWrites=true&w=majority
```

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository
```bash
cd FEMS-fire-extinguisher-system
git init
git add .
git commit -m "Initial FEMS setup with microservices and deployment config"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create new repository: `fems-fire-extinguisher-system`
3. Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/fems-fire-extinguisher-system.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render

### 3.1 Connect Render to GitHub
1. Go to https://render.com
2. Create account or sign in
3. Click "New +" → "Web Service"
4. Click "Connect account" under GitHub
5. Authorize Render to access your GitHub account
6. Select `fems-fire-extinguisher-system` repository

### 3.2 Deploy API Gateway Service
1. After selecting the repo, you should be prompted to create a service
2. **Service Name:** `fems-api-gateway`
3. **Runtime:** Node
4. **Build Command:** `npm install && npm run install:all`
5. **Start Command:** `npm run start:gateway`
6. **Plan:** Free (or Starter for production)
7. Click "Create Web Service"

### 3.3 Add Environment Variables
After the API Gateway is created, add these environment variables:

1. Click "Environment"
2. Add the following variables:
   ```
   NODE_ENV=production
   GATEWAY_PORT=4000
   MONGO_URI=<your-mongodb-atlas-connection-string>
   USER_URL=https://fems-user-service.onrender.com
   EXT_URL=https://fems-extinguisher-service.onrender.com
   INSP_URL=https://fems-inspection-service.onrender.com
   REPORT_URL=https://fems-reporting-service.onrender.com
   ```
3. Click "Save"

### 3.4 Deploy Individual Services
Repeat the following for each service:

**For User Service:**
- Go to Dashboard → "New +" → "Web Service"
- Select your GitHub repository
- Service Name: `fems-user-service`
- Build Command: `npm install && npm run install:all`
- Start Command: `npm run start:user`
- Environment Variables:
  ```
  NODE_ENV=production
  USER_PORT=4001
  MONGO_URI=<your-mongodb-atlas-connection-string>
  JWT_SECRET=<generate-a-strong-random-string>
  ```

**For Extinguisher Service:**
- Service Name: `fems-extinguisher-service`
- Start Command: `npm run start:extinguisher`
- EXT_PORT=4002
- Same MONGO_URI

**For Inspection Service:**
- Service Name: `fems-inspection-service`
- Start Command: `npm run start:inspection`
- INSP_PORT=4003
- Same MONGO_URI
- EXT_URL and EMAIL_URL environment variables

**For Email Service:**
- Service Name: `fems-email-service`
- Start Command: `npm run start:email` (add script to package.json)
- EMAIL_PORT=4005
- Email configuration variables

### 3.5 Update Service URLs
After all services are deployed, update the environment variables in API Gateway with the actual Render URLs:

```
USER_URL=https://fems-user-service.onrender.com
EXT_URL=https://fems-extinguisher-service.onrender.com
INSP_URL=https://fems-inspection-service.onrender.com
REPORT_URL=https://fems-reporting-service.onrender.com
EMAIL_URL=https://fems-email-service.onrender.com
```

## Step 4: Deploy Frontend

### 4.1 Deploy to Vercel (Recommended)
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select "Other" as framework
5. **Build Command:** `npm --prefix frontend run build`
6. **Output Directory:** `frontend/dist`
7. **Environment Variables:**
   ```
   VITE_API_URL=https://fems-api-gateway.onrender.com
   VITE_WS_URL=wss://fems-websocket-service.onrender.com
   ```
8. Click "Deploy"

### 4.2 Deploy to Render (Alternative)
1. Create a new Static Site on Render
2. Connect to your GitHub repository
3. **Build Command:** `npm --prefix frontend run build`
4. **Publish directory:** `frontend/dist`
5. Add environment variables same as above
6. Deploy

## Step 5: Verify Deployment

### 5.1 Test Health Endpoints
```bash
# API Gateway
curl https://fems-api-gateway.onrender.com/health

# Individual services
curl https://fems-user-service.onrender.com/health
curl https://fems-extinguisher-service.onrender.com/health
curl https://fems-inspection-service.onrender.com/health
curl https://fems-reporting-service.onrender.com/health
curl https://fems-email-service.onrender.com/health
```

### 5.2 Test Authentication
```bash
# Login with default admin account
curl -X POST https://fems-api-gateway.onrender.com/users/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tzw.rw","password":"Admin@123"}'
```

### 5.3 Monitor Logs
1. Go to your Render services
2. Click each service and check the "Logs" tab
3. Look for errors or warnings

## Troubleshooting

### MongoDB Connection Issues
- **Verify credentials** in connection string
- **Check IP whitelist** in MongoDB Atlas (Network Access)
- **Ensure database name** is correct (`fems`)

### Services Can't Communicate
- **Update environment variables** with correct Render URLs
- **Check service status** - all services should show "Live"
- **Review logs** for specific error messages

### Email Not Sending
- **Configure SMTP credentials** in environment variables
- **Test with the email service endpoint:**
  ```bash
  curl -X POST https://fems-email-service.onrender.com/api/emails/test \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com"}'
  ```

### Deployment Fails
- **Check build logs** - look for missing dependencies
- **Verify all services have correct start commands**
- **Ensure MONGO_URI is in all service environment variables**

## Production Checklist

- [ ] MongoDB Atlas cluster created and secured
- [ ] All Render services deployed and showing "Live"
- [ ] Environment variables configured for all services
- [ ] API Gateway URLs updated with actual service URLs
- [ ] Frontend deployed with correct VITE_API_URL
- [ ] Health endpoints responding successfully
- [ ] Test login with admin account works
- [ ] Email notifications configured and tested
- [ ] WebSocket service deployed
- [ ] Logging enabled and monitored
- [ ] Rate limiting enabled on API Gateway
- [ ] CORS properly configured for frontend domain

## Monitoring & Maintenance

### Set Up Email Alerts
1. In Render, go to Account Settings
2. Enable email notifications for:
   - Service failures
   - Deploy failures
   - Memory warnings

### Regular Backups
1. In MongoDB Atlas, enable automated daily backups
2. Schedule weekly exports to external storage

### Update Dependencies
```bash
npm audit fix --audit-level=moderate
git commit -am "chore: security updates"
git push origin main
```

## Support & Documentation

- **API Documentation:** Available at `/users/api/docs`, `/extinguishers/api/docs`, etc.
- **Service Health:** Check `/health` endpoints
- **Logs:** Available in Render service logs
- **GitHub Issues:** Report bugs in your repository

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Express.js Guide](https://expressjs.com/)
- [Microservices Architecture](https://microservices.io/)
