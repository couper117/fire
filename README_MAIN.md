# FEMS - Fire Extinguisher Management System

## 🚀 Quick Start

### Running the System
```bash
# Terminal 1: Start Backend Services
npm start

# Terminal 2: Start Frontend
cd frontend && npm run dev
```

**Frontend:** http://localhost:5173  
**Backend Gateway:** http://localhost:4000

---

## 📚 Documentation

### Getting Started
- **[SYSTEM_STATUS.md](./SYSTEM_STATUS.md)** - Current system status and how to use it
- **[QUICK_START.md](./docs/QUICK_START.md)** - Quick setup guide

### Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (MongoDB Atlas + Render)
- **[render.yaml](./render.yaml)** - Infrastructure as Code

### Implementation Details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete feature list and architecture
- **[docs/Architecture.md](./docs/Architecture.md)** - System architecture and microservices

### Reports & Analysis
- **[reports/](./reports/)** - All reports and analysis documents

---

## 🎯 Features

### ✅ Completed
- ✅ Tailwind CSS UI with 6 reusable components
- ✅ Modern authentication pages (login, register)
- ✅ Admin dashboard with user management
- ✅ Email notification service
- ✅ Zod form validation
- ✅ API rate limiting
- ✅ Winston logging
- ✅ WebSocket real-time service
- ✅ Microservices architecture (7 services)
- ✅ Production deployment config

### 🔄 Ready for Production
- ✅ MongoDB Atlas integration
- ✅ Render hosting configuration
- ✅ JWT authentication
- ✅ Role-based authorization

---

## 🛠️ Tech Stack

**Frontend:** React 19 + Vite + Tailwind CSS + TypeScript  
**Backend:** Node.js + Express + Mongoose + MongoDB  
**Architecture:** Microservices (7 services)  
**Deployment:** Render + MongoDB Atlas  

---

## 📂 Project Structure

```
FEMS-fire-extinguisher-system/
├── frontend/                 # React application
├── services/                 # 7 microservices
├── shared/                   # Shared utilities
├── docs/                     # Documentation
├── reports/                  # Reports and analysis
├── README_MAIN.md           # This file
├── SYSTEM_STATUS.md         # System status
├── DEPLOYMENT.md            # Deployment guide
├── IMPLEMENTATION_SUMMARY.md # Feature summary
└── render.yaml              # Infrastructure config
```

---

## 🚀 Next Steps

1. **Local Testing:** Use http://localhost:5173
2. **Production:** Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Customization:** Modify components in `frontend/src/`
4. **API Docs:** Visit http://localhost:4000/users/api/docs/

---

## 📞 Support

Refer to the appropriate documentation:
- **Setup Issues:** [SYSTEM_STATUS.md](./SYSTEM_STATUS.md)
- **Deployment Issues:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Feature Details:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Status:** ✅ Production Ready  
**Last Updated:** 2026-06-12  
**All Services:** Online
