# SaaS Tracker - Copilot Instructions

## Architecture Overview

**Tech Stack:**
- **Frontend:** React 18 + Vite + React Router v6 + TailwindCSS
- **Backend:** Node.js/Express + PostgreSQL + Cron jobs
- **AI Integration:** Anthropic Claude API (via @anthropic-ai/sdk)
- **File Handling:** ExcelJS, PapaParse (CSV), Multer (uploads)
- **Email:** Resend service + node-cron scheduler
- **Auth:** JWT tokens, bcryptjs (password hashing)

**Project Structure:**
- `/client` - React SPA (Vite dev server on port 5174)
- `/server` - Express API (port 5000)
- Multi-tenant architecture with organization-level access control

---

## Core Architecture Patterns

### Multi-Tenant Isolation
- **Key Files:** [server/src/middlewares/authMiddleware.js](server/src/middlewares/authMiddleware.js), [server/src/middlewares/organizationMiddleware.js](server/src/middlewares/organizationMiddleware.js)
- Every user belongs to an `organization` (created at registration with auto-generated slug)
- Routes require both `authMiddleware` + `organizationMiddleware`
- Database queries **always** filter by `organization_id` to prevent data leakage
- Example pattern:
  ```javascript
  // Route uses: authMiddleware → organizationMiddleware → controller
  const contracts = await db.query(
    'SELECT * FROM contracts WHERE organization_id = $1',
    [req.organization.id]
  );
  ```

### Authentication Flow
1. User registers → Creates organization with slug + user record
2. Login returns JWT token (stored in `localStorage`)
3. Every API request includes `Authorization: Bearer <token>` header
4. [AuthContext.jsx](client/src/AuthContext.jsx) manages user state and token lifecycle
5. Protected routes use `<ProtectedRoute>` component wrapping page components

### API Configuration
- **Client:** All requests use centralized [config/api.js](client/src/config/api.js) with `API_URL` env var
- **Fetch Pattern:** Include `Authorization` header manually or extend fetch wrapper
- **CORS:** Configured in [server/server.js](server/server.js#L24) with frontend URL whitelist

---

## Developer Workflows

### Development Setup
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev          # Starts on http://localhost:5000

# Terminal 2 - Frontend
cd client
npm install
npm run dev          # Starts on http://localhost:5174 (--host 127.0.0.1)
```

### Build & Deployment
```bash
# Frontend
npm run build        # Creates dist/ folder

# Backend
npm start            # Production start (no nodemon)

# Linting
npm run lint         # ESLint for client
```

### Database Management
- **File:** [server/src/db.js](server/src/db.js)
- Uses `pg` pool with SSL config for production
- Custom query method logs SQL only in development mode
- Supports transactions via `db.withTransaction()`
- Connection env vars: `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT`

---

## Key Features & Their Architecture

### 1. Contract Management
- **Controllers:** [contractsController.js](server/src/contractsController.js)
- **Routes:** [contracts.routes.js](server/src/contracts.routes.js)
- **Frontend:** [ContractForm.jsx](client/src/components/ContractForm.jsx), [ContractList.jsx](client/src/components/ContractList.jsx)
- Supports document attachments, status tracking (active/expired/archived)

### 2. Import Pipeline (CSV/Excel)
- **Route:** [routes/import.routes.js](server/src/routes/import.routes.js)
- **Frontend:** [ImportPage.jsx](client/src/pages/ImportPage.jsx), [ColumnMapper.jsx](client/src/components/ColumnMapper.jsx)
- **Data Flow:** Upload → Column mapping → Preview → Validation → DB insert
- Uses PapaParse for CSV, ExcelJS for Excel parsing
- Column mapper allows dynamic field matching

### 3. AI Analysis & Optimization
- **Controllers:** [aiAnalysisController.js](server/src/aiAnalysisController.js), [optimizationController.js](server/src/optimizationController.js)
- **API Key:** Stored in `ANTHROPIC_API_KEY` env var
- **Usage:** Analyzes contracts/documents using Claude API for risk scoring, cost analysis
- **Frontend:** [AIAnalysisModal.jsx](client/src/components/AIAnalysisModal.jsx), [OptimizationPage.jsx](client/src/pages/OptimizationPage.jsx)

### 4. Workflows & Automation
- **Controllers:** [server/src/routes/](server/src/routes/) + cron schedulers
- **Schedulers:** [server/src/jobs/emailScheduler.js](server/src/jobs/emailScheduler.js), [workflowScheduler.js](server/src/jobs/workflowScheduler.js)
- **Frontend:** [workflows/](client/src/pages/workflows/)
- Automated emails, task assignments, notifications via node-cron

### 5. Employees & Assets Management
- **Controllers:** [employeesController.js](server/src/employeesController.js), [assetsController.js](server/src/assetsController.js)
- **Frontend:** [EmployeesPage.jsx](client/src/pages/EmployeesPage.jsx), [AssetsPage.jsx](client/src/pages/AssetsPage.jsx)
- CRUD operations with employee-asset relationships

### 6. Dashboard & Reporting
- **Controllers:** [dashboardController.js](server/src/dashboardController.js), [dashboardGlobalController.js](server/src/dashboardGlobalController.js)
- **Frontend:** [DashboardPage.jsx](client/src/pages/DashboardPage.jsx), [Dashboard.jsx](client/src/pages/Dashboard.jsx)
- Uses Recharts for visualizations (expense trends, contract status pie charts)
- Global data fetching patterns for analytics

---

## Common Development Patterns

### Controller Pattern
```javascript
// Standard error handling with try-catch, return early on validation failure
const getContracts = async (req, res) => {
  try {
    if (!req.user || !req.organization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(
      'SELECT * FROM contracts WHERE organization_id = $1 LIMIT $2 OFFSET $3',
      [req.organization.id, 50, 0]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### React Component Pattern
```jsx
// Functional components with hooks, centralized state management
import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import API_URL from '../config/api';

export default function MyComponent() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/contracts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

### Form Validation
- Uses `express-validator` on backend
- Client-side validation with HTML5 + optional form libraries
- Return validation errors as JSON: `{ error: 'Field name is required' }`

---

## Integration Points to Know

### Email Service
- **Service:** [server/src/services/emailService.js](server/src/services/emailService.js)
- Uses Resend API (`RESEND_API_KEY` env var)
- Template-based emails in [server/src/templates/](server/src/templates/)
- Triggered by workflows, password resets, notifications

### File Uploads
- **Middleware:** [server/src/config/upload.config.js](server/src/config/upload.config.js)
- Files stored in [server/uploads/](server/uploads/)
- Uses Multer with filename pattern: `{timestamp}-{id}-{originalname}`
- Document relationships tracked in DB

### Database Transactions
```javascript
// Use db.withTransaction() for multi-step operations
await db.withTransaction(async (client) => {
  await client.query('INSERT INTO table1 ...', [params]);
  await client.query('UPDATE table2 ...', [params]);
  // Auto-commits on success, rolls back on error
});
```

---

## Environment Variables Checklist

**Backend (.env required):**
- `PORT=5000`
- `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT`
- `JWT_SECRET` (64+ char random string)
- `RESEND_API_KEY` (email service)
- `ANTHROPIC_API_KEY` (Claude API)
- `FRONTEND_URL` (CORS whitelist)
- `NODE_ENV` (development/production)

**Frontend (.env.local optional):**
- `VITE_API_URL=http://localhost:5000`

---

## Testing & Debugging

### Common Issues
- **CORS errors:** Check `corsOptions` in [server/server.js](server/server.js#L20)
- **Auth failures:** Ensure middleware order: authMiddleware → organizationMiddleware
- **"Unauthorized" 401:** Verify JWT token in localStorage matches server secret
- **Database errors:** Check `PGPASSWORD`, `PGHOST` connection string in `.env`

### Logging Strategy
- Backend logs DB queries only in development (see [db.js](server/src/db.js#L23))
- Console.error() for controller exceptions
- Frontend: Browser DevTools Network tab to inspect API responses

---

## Adding New Features

### New Route Checklist
1. Create controller file in [server/src/controllers/](server/src/controllers/) or [server/src/routes/](server/src/routes/)
2. Add authentication + organization filter to all queries
3. Create route file, export router
4. Import and register in [server/server.js](server/server.js#L43-L57)
5. Create React page/component in [client/src/pages/](client/src/pages/) or [client/src/components/](client/src/components/)
6. Add route to [App.jsx](client/src/App.jsx) with `<ProtectedRoute>` wrapper
7. Verify CORS whitelist includes your endpoint

### Database Schema Pattern
- Always include `organization_id`, `created_at`, `updated_at`
- Use timestamps for audit trails
- Foreign keys reference organization_id for isolation
