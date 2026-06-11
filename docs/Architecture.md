# FEMS System Architecture

## 🏗️ Overview

```
┌─────────────────────────────────────────────────────┐
│           Browser / Frontend                        │
│        (React 19 + Tailwind CSS)                    │
│        http://localhost:5173                        │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS (REST API)
┌────────────────────▼────────────────────────────────┐
│        API Gateway (Express.js)                     │
│  Rate Limiting + Request Validation                 │
│        http://localhost:4000                        │
└──┬──────────────────┬─────────────────┬────────────┘
   │                  │                 │
   ▼                  ▼                 ▼
┌─────────┐    ┌──────────────┐   ┌──────────────┐
│ User    │    │Extinguisher  │   │ Inspection   │
│Service  │    │  Service     │   │  Service     │
│ Port    │    │   Port 4002  │   │   Port 4003  │
│ 4001    │    └──────┬───────┘   └──────┬───────┘
└────┬────┘           │                  │
     │         ┌──────▼──────┐     ┌─────▼────┐
     │         │ Reporting   │     │  Email   │
     │         │  Service    │     │ Service  │
     │         │  Port 4004  │     │ Port 4005│
     │         └─────────────┘     └──────────┘
     │
     └──────────────────────────┐
                                │
                    ┌───────────▼───────────┐
                    │   MongoDB             │
                    │   Local or Atlas      │
                    └───────────────────────┘
```

## 🔧 Microservices Architecture

### 1. User Service (Port 4001)
**Database:** `fems_user`

**Responsibilities:**
- User registration & login
- JWT token generation
- Password management
- User profile management
- Role management (Admin, Inspector, User)

**Key Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `PUT /api/users/me/password` - Change password

### 2. Extinguisher Service (Port 4002)
**Database:** `fems_extinguisher`

**Responsibilities:**
- Extinguisher CRUD operations
- Maintenance logging
- Status tracking
- Location management

**Key Endpoints:**
- `GET /api/extinguishers` - List all extinguishers
- `POST /api/extinguishers` - Create new extinguisher
- `GET /api/extinguishers/:id` - Get extinguisher details
- `PUT /api/extinguishers/:id` - Update extinguisher
- `DELETE /api/extinguishers/:id` - Delete extinguisher
- `POST /api/extinguishers/:id/maintenance` - Log maintenance

### 3. Inspection Service (Port 4003)
**Database:** `fems_inspection`

**Responsibilities:**
- Inspection scheduling
- Inspection tracking
- Personnel notifications
- Inspection status management

**Key Endpoints:**
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Schedule inspection
- `GET /api/inspections/:id` - Get inspection details
- `PUT /api/inspections/:id` - Update inspection status
- `DELETE /api/inspections/:id` - Cancel inspection

### 4. Reporting Service (Port 4004)
**Database:** None (aggregates from other services)

**Responsibilities:**
- Generate reports (daily, monthly, yearly)
- Aggregate statistics
- System health metrics

**Key Endpoints:**
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/yearly` - Yearly report
- `GET /api/reports/stream/live` - Live report stream

### 5. Email Service (Port 4005)
**Database:** None

**Responsibilities:**
- Email template management
- Email sending (SMTP/SendGrid)
- Batch email processing
- Email delivery tracking

**Key Endpoints:**
- `POST /api/emails/send` - Send single email
- `POST /api/emails/queue` - Queue batch emails
- `POST /api/emails/test` - Test email configuration

### 6. WebSocket Service (Port 4006)
**Database:** None

**Responsibilities:**
- Real-time event streaming
- Live inspection updates
- System notifications
- Alert broadcasting

**Events:**
- `inspection:scheduled`
- `inspection:completed`
- `maintenance:needed`
- `alert:*`

### 7. API Gateway (Port 4000)
**Database:** None

**Responsibilities:**
- Route requests to services
- Rate limiting
- Request validation
- Error handling
- CORS management

---

## 🔐 Security Features

### Authentication
- **JWT Tokens** - Issued by User Service
- **Token Validation** - Checked by all services
- **Password Hashing** - bcrypt with 10 rounds

### Authorization
- **RBAC** - Role-based access control
- **Roles:**
  - Admin: Full system access
  - Inspector: Inspection and extinguisher management
  - User: Read-only access + inspection scheduling

### Rate Limiting
- **General:** 100 requests/15 minutes
- **Auth:** 5 attempts/15 minutes
- **Health check:** Bypassed

### Input Validation
- **Zod schemas** - Frontend & backend validation
- **Type checking** - TypeScript throughout
- **Sanitization** - XSS prevention

---

## 💾 Database Design

### User Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  passwordHash: String,
  role: Enum('Admin', 'Inspector', 'User'),
  isActive: Boolean,
  resetToken: String?,
  resetExpires: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

### Extinguisher Collection
```javascript
{
  _id: ObjectId,
  serialNumber: String (unique),
  location: String,
  type: Enum('Water', 'CO2', 'Foam', 'Dry Chemical'),
  size: Enum('2.5 lbs', '5 lbs', '9 lbs', '12 lbs'),
  installationDate: Date,
  expiryDate: Date,
  status: Enum('Active', 'Expired', 'Needs Maintenance', 'Decommissioned'),
  createdAt: Date,
  updatedAt: Date
}
```

### Inspection Collection
```javascript
{
  _id: ObjectId,
  extinguisherId: ObjectId,
  serialNumber: String,
  scheduledAt: Date,
  assignedTo: String (email),
  status: Enum('Scheduled', 'Completed', 'Cancelled', 'Missed'),
  result: String?,
  notes: String?,
  createdBy: String (email),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Data Flow

### User Registration Flow
1. Frontend sends registration data to API Gateway
2. API Gateway validates data with Zod
3. Forwards to User Service
4. User Service validates and hashes password
5. Creates user in MongoDB
6. Returns user object (without password)

### Login Flow
1. Frontend sends email + password
2. API Gateway routes to User Service
3. User Service looks up user by email
4. Compares password hash with bcrypt
5. If valid, generates JWT token
6. Returns token + user data
7. Frontend stores token in localStorage

### Inspection Scheduling Flow
1. Frontend sends inspection data
2. API Gateway validates and routes to Inspection Service
3. Inspection Service validates extinguisher exists (calls Extinguisher Service)
4. Creates inspection record
5. Calls Email Service to send notification
6. Broadcasts via WebSocket to relevant users
7. Returns inspection details

---

## 🚀 Deployment Architecture

### Production Environment
```
┌────────────────────────────────────────┐
│  Vercel (Frontend) or Render (Static)  │
│  https://fems.example.com              │
└─────────────┬──────────────────────────┘
              │ HTTPS
┌─────────────▼──────────────────────────┐
│ Render (API Gateway)                   │
│ https://api.example.com                │
└──────┬─────────────────┬───────────────┘
       │                 │
┌──────▼──────────────┐ ┌▼──────────────┐
│ Render Services     │ │ MongoDB Atlas  │
│ (User, Ext, Insp)   │ │ (Cloud DB)     │
└─────────────────────┘ └────────────────┘
```

### Environment Variables Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing tokens
- `SMTP_*` - Email configuration
- `NODE_ENV` - production/development
- Service URLs for inter-service communication

---

## 📊 Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (email, serialNumber)
- Connection pooling for MongoDB
- Query optimization for large datasets

### API Performance
- Rate limiting prevents abuse
- Response caching ready (Redis-compatible)
- Pagination support for large result sets
- Async processing for emails

### Frontend Performance
- Vite for fast development builds
- React.lazy for code splitting
- Tailwind CSS optimization
- Local storage for session tokens

---

## 🔄 Inter-Service Communication

### Synchronous (HTTP)
- Inspection Service → Extinguisher Service (verify extinguisher exists)
- Reporting Service → Extinguisher Service (aggregate stats)
- Reporting Service → Inspection Service (get inspection counts)

### Asynchronous (Event-based)
- Inspection Service → Email Service (notify on scheduling)
- Extinguisher Service → Email Service (alert on status change)
- All Services → WebSocket Service (broadcast updates)

### JWT Validation
- All services validate JWT token signature
- Services use shared JWT_SECRET
- Token includes user ID, email, and role
- Requests without valid token rejected (401 Unauthorized)

---

## 🛡️ Fault Tolerance

### Service Failure Handling
- API Gateway has timeout on service calls
- Graceful degradation if service unavailable
- Error messages returned to client
- Logs capture all errors

### Database Failure
- Connection retry logic
- Exponential backoff
- Circuit breaker pattern ready
- Data persistence verified before returning success

### Rate Limit Handling
- HTTP 429 response when limit exceeded
- Clients can retry after delay
- Different limits for auth vs general requests

---

## 📈 Monitoring & Logging

### Application Logging
- Winston logger in all services
- Structured JSON format
- Log levels: debug, info, warn, error
- File rotation and compression

### Health Checks
- All services have `/health` endpoint
- Gateway checks service availability
- Metrics available at health endpoint

### Metrics Available
- Request count and latency
- Error rates
- Database connection health
- User authentication attempts
- Rate limit hits

---

## 🔮 Future Enhancements

- [ ] Caching layer (Redis)
- [ ] Message queue (RabbitMQ)
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] GraphQL API option
- [ ] Multi-tenancy support

---

**Architecture Last Updated:** 2026-06-12
