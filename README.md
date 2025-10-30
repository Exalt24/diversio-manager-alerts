# Diversio Manager Alerts Dashboard

Full-stack manager alerts system with hierarchical employee tree traversal and real-time filtering.

**Live Demo:**
- Frontend: https://diversio-manager-alerts.vercel.app
- Backend API: https://diversio-alerts-api.onrender.com/api
- Health Check: https://diversio-alerts-api.onrender.com/api/health

---

## Setup & Run

### Quick Start (Recommended)
```bash
# Clone the repository
git clone https://github.com/Exalt24/diversio-manager-alerts.git
cd diversio-manager-alerts

# One-time setup (required)
npm run setup

# Start both servers (one terminal)
npm run dev
```

**URLs:**
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5173

**Note:** `npm run dev` will auto-install root dependencies if missing, but you still need to run `npm run setup` once for backend/frontend dependencies.

---

### Alternative: Separate Terminals

If you prefer separate terminals:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

---

### Alternative: Bash Scripts (Unix/Mac/Git Bash)
```bash
./setup.sh    # One-time setup
./run.sh      # Starts both servers
```

---

### Manual Setup (if preferred)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py load_seed_data
python manage.py runserver
# Server at http://127.0.0.1:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

---

## Tests

**Quick:**
```bash
npm test              # All tests (28 backend + 19 frontend)
npm run test:backend  # Backend only
npm run test:frontend # Frontend only
```

**Manual:**
```bash
# Backend (28 tests)
cd backend
pytest -v

# Frontend (19 tests)
cd frontend
npm test
```

---

## Requirements Checklist

### Core Requirements ✅
- ✅ **GET /api/alerts** with manager_id, scope (direct/subtree), severity, status, q filters
- ✅ **POST /api/alerts/{id}/dismiss** - idempotent (returns 200 unchanged on repeat)
- ✅ **Exact response format:** `{id, employee: {id, name}, severity, category, created_at, status}`
- ✅ **Exact error format:** `{"detail": "..."}` for 400/404
- ✅ **Tree traversal** with cycle detection using visited set
- ✅ **Sorting:** created_at DESC, id ASC
- ✅ **Django + DRF** backend
- ✅ **React + TypeScript** frontend (strict mode)
- ✅ **Table displays:** employee name, category, severity chip, status, created_at
- ✅ **Scope toggle:** direct vs subtree (default: direct)
- ✅ **Severity filter:** checkboxes for low/medium/high
- ✅ **Employee search:** q parameter (case-insensitive)
- ✅ **Dismiss button:** optimistic update with rollback on API failure
- ✅ **Backend tests (minimum 2):** cycle prevention + idempotency
- ✅ **Frontend tests (minimum 2):** high severity filter + optimistic rollback

### Bonus ✅
- ✅ **URL query param persistence** (explicitly mentioned bonus)

### Additional Features ✅
- Frontend status filter UI (backend API required, but UI not in spec)
- Manager ID input (easier testing)
- Toast notifications (react-hot-toast instead of alerts)
- Loading skeletons
- Empty state component
- Dark theme (Optimo-inspired)
- 43 extra tests (47 total vs 4 minimum)
- Django admin panel
- Health check endpoint
- Production deployment (optional in spec)

---

## API Documentation

### GET /api/alerts

Query all alerts for a manager's reports with filtering.

**Query Parameters:**
- `manager_id` (required): Manager employee ID
- `scope` (optional): `direct` (default) | `subtree`
- `severity` (optional): Comma-separated `low,medium,high`
- `status` (optional): Comma-separated `open,dismissed` (default: all)
- `q` (optional): Employee name search (case-insensitive)

**Response (200):**
```json
[
  {
    "id": "A1",
    "employee": { "id": "E3", "name": "Jordan Lee" },
    "severity": "high",
    "category": "retention",
    "created_at": "2025-09-01T09:00:00Z",
    "status": "open"
  }
]
```

**Errors:**
- `400`: `{"detail": "invalid severity"}` | `{"detail": "invalid status"}` | `{"detail": "invalid scope"}`
- `404`: `{"detail": "manager not found"}`

**Examples:**
```bash
# Direct reports only
GET /api/alerts?manager_id=E2&scope=direct

# Full subtree with filters
GET /api/alerts?manager_id=E2&scope=subtree&severity=high&status=open

# Search by name
GET /api/alerts?manager_id=E2&q=Jordan
```

---

### POST /api/alerts/{id}/dismiss

Dismiss an alert. Idempotent - dismissing an already-dismissed alert returns 200 with unchanged resource.

**Response (200):**
```json
{
  "id": "A1",
  "employee": { "id": "E3", "name": "Jordan Lee" },
  "severity": "high",
  "category": "retention",
  "created_at": "2025-09-01T09:00:00Z",
  "status": "dismissed"
}
```

**Errors:**
- `404`: `{"detail": "alert not found"}`

---

### GET /api/health

Health check endpoint (Go Beyond feature).

**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "employees": 10,
  "alerts": 14
}
```

---

## Architecture

### Tree Traversal Algorithm

**Function:** `get_employee_subtree(manager_id: str, scope: str) -> Set[str]`

**Implementation:**
- **Algorithm:** BFS (Breadth-First Search) with visited set
- **Time Complexity:** O(n) where n = number of employees
- **Space Complexity:** O(n) for visited set and queue
- **Cycle Handling:** Visited set prevents infinite loops (tested with E6→E7→E8→E6)
- **Manager Exclusion:** Manager never included in result set

**Pseudocode:**
```python
def get_employee_subtree(manager_id: str, scope: str) -> Set[str]:
    if scope == "direct":
        # Simple query for direct reports
        return {e.id for e in Employee.objects.filter(reports_to_id=manager_id)}
    
    # BFS for full subtree
    visited = set()
    queue = [manager_id]
    
    while queue:
        current = queue.pop(0)
        if current in visited:
            continue  # Cycle detected, skip
        visited.add(current)
        
        # Add all direct reports to queue
        reports = Employee.objects.filter(reports_to_id=current)
        queue.extend(r.id for r in reports)
    
    # Remove manager from results
    visited.discard(manager_id)
    return visited
```

### Data Model
```python
Employee:
  - id: CharField (PK)
  - name: CharField
  - reports_to: ForeignKey(self, nullable=True)

Alert:
  - id: CharField (PK)
  - employee: ForeignKey(Employee)
  - severity: CharField (choices: low, medium, high)
  - category: CharField
  - created_at: DateTimeField
  - status: CharField (choices: open, dismissed, default: open)
  
  Meta:
    ordering: ['-created_at', 'id']
```

### Frontend Architecture
```
src/
├── components/
│   ├── AlertsPage.tsx         # Main container with state management
│   ├── AlertsTable.tsx        # Table with dismiss actions
│   ├── Filters.tsx            # All filter controls
│   ├── LoadingSkeleton.tsx    # Loading state UI
│   ├── EmptyState.tsx         # No results UI
│   └── ErrorBoundary.tsx      # Error handling wrapper
├── hooks/
│   └── useFilters.ts          # URL query param sync
├── services/
│   └── api.ts                 # API client with error handling
└── types/
    └── index.ts               # TypeScript definitions
```

**Key Patterns:**
- **Optimistic Updates:** Immediate UI update → API call → Revert on failure
- **URL State Sync:** react-router-dom `useSearchParams` for shareable filtered views
- **Error Handling:** Try-catch with toast notifications, error boundaries for render errors
- **Loading States:** Skeleton UI prevents layout shift

---

## Expected Test Results (Verified ✅)

Using seed data with 10 employees and 14 alerts:

### Manager E2 Direct Reports
- **Employees:** E3, E4, E9
- **Alerts:** 6 total
  - High: 2 (A1, A11)
  - Medium: 2 (A2, A5)
  - Low: 2 (A7, A12)

### Manager E2 Full Subtree
- **Employees:** E3, E4, E5, E9, E10
- **Alerts:** 10 total
  - High: 4 (A1, A4, A6, A11)
  - Medium: 3 (A2, A5, A13)
  - Low: 3 (A3, A7, A12)

### Manager E2 Subtree + Filters
- **open + high:** 3 alerts (A1, A4, A11)
- **Status defaults to all:** Includes both open and dismissed

### Manager E7 (Cycle Test)
- **Cycle:** E6→E7→E8→E6
- **Employees in subtree:** E6, E8
- **Alerts:** 2 (A8, A10)
- **Behavior:** Algorithm terminates without infinite loop ✅

### Idempotency Test
- **First dismiss:** Returns 200 with `status: "dismissed"`
- **Second dismiss:** Returns 200 with unchanged resource ✅

---

## Time Spent and What I Cut

**Total Time: ~3.5 hours**

**Breakdown:**
- Setup & models: 10 min
- Tree traversal algorithm + tests: 30 min
- Backend API + comprehensive tests: 1 hour
- Frontend core + filters: 1 hour
- Optimistic updates + polish: 30 min
- Deployment + documentation: 40 min

**What I Built:**
- ✅ All core requirements (100%)
- ✅ Bonus feature (URL params)
- ✅ 47 tests (28 backend + 19 frontend vs 4 minimum)
- ✅ Production deployment
- ✅ Dark theme with accessibility
- ✅ Health check endpoint
- ✅ Comprehensive documentation

**What I Cut for Time:**
- User authentication system
- Bulk actions (select and dismiss multiple)
- Email notifications for high-severity alerts
- Alert details modal with full context
- Alert history/audit log
- Real-time WebSocket updates
- Advanced analytics dashboard
- Export to CSV

**What I Added Beyond Requirements:**
- Status filter (open/dismissed) - useful for real-world use
- Manager ID input - easier to test different managers
- Toast notifications - better UX than browser alerts
- Loading skeletons - prevents layout shift
- Empty state - guides users when no results
- Dark theme - Optimo-inspired design
- Error boundaries - graceful error handling
- 43 extra tests - confidence in refactoring

---

## How I Used AI/LLMs

**AI-Assisted (with validation):**
- Django project boilerplate and initial settings
- TypeScript type definitions and interfaces
- Tailwind CSS class suggestions for dark theme
- Test case structure and pytest fixtures
- Deployment configuration files (build.sh, environment variables)
- README structure and markdown formatting

**Human-Written (with research):**
- **Tree traversal algorithm** - Core BFS logic with cycle detection written from scratch
- **API endpoint validation** - All parameter validation, filtering, sorting logic
- **Filter state management** - URL sync with react-router-dom
- **Optimistic update pattern** - UI update, API call, rollback logic
- **All test assertions** - Expected results, edge cases, error scenarios
- **CORS debugging** - Production environment troubleshooting

**Validation Process:**
1. Tested all AI-generated code locally before committing
2. Verified responses against exact spec requirements
3. Ran full test suite (47 tests) to catch any issues
4. Manually tested all user flows in both dev and production
5. Checked API responses match spec format byte-for-byte

**Tools Used:**
- Claude (Anthropic) for code generation and technical consultation
- GitHub Copilot for autocomplete suggestions (minimal usage)

---

## Self-Review

### Why This Solution is Good

**1. Exact Spec Compliance**
- Response format matches exactly (nested employee object)
- Error messages use exact wording: `{"detail": "invalid severity"}`
- Sorting verified: created_at DESC, id ASC
- All expected results match specification exactly

**2. Algorithm Correctness**
- BFS with visited set elegantly handles cycles
- O(n) time and space complexity (optimal)
- Tested with real cycle in seed data (E6→E7→E8)
- Manager never included in results (explicitly tested)

**3. Production-Ready Code**
- 47 comprehensive tests (28 backend + 19 frontend vs 4 minimum)
- TypeScript strict mode with no `any` types
- Python type hints throughout backend
- Deployed and working in production
- Error handling at every layer
- Logging with rotation for production monitoring

**4. User Experience Excellence**
- Optimistic updates for instant feedback
- Toast notifications (better than browser alerts)
- Loading skeletons prevent layout shift
- Empty state guides users
- URL persistence enables sharing filtered views
- Dark theme with full accessibility (ARIA, semantic HTML, keyboard nav)

**5. Engineering Judgment**
- Clean separation of concerns (utils, services, hooks)
- Reusable components (filters, table, skeletons)
- Comprehensive error boundaries
- Idiomatic React and Django patterns

### What I'd Improve Next

**1. Performance Optimization**
- Add database indexes on `employee_id`, `reports_to_id`, `status`, `created_at`
- Implement pagination (currently loads all alerts)
- Cache subtree calculations with TTL (memoization)
- Add database connection pooling for production
- Optimize queries with `select_related`

**2. Enhanced Features**
- Bulk actions (select multiple alerts to dismiss)
- Alert details modal with full employee context
- Filter presets (save common filter combinations)
- Sort by multiple columns (click headers)
- Export filtered results to CSV
- Alert snooze functionality

**3. Testing & Monitoring**
- Add E2E tests with Playwright
- Performance testing for large hierarchies (1000+ employees)
- Frontend load time metrics with Lighthouse
- Backend API response time monitoring
- Error tracking integration (e.g., Sentry)
- Test coverage reporting

**4. Code Organization**
- Extract filter logic into useReducer for complex state
- Split AlertsPage into smaller focused components
- Add React Query for API caching and optimistic updates
- Create shared UI component library
- Add Storybook for component documentation

**5. Security & Scalability**
- Add authentication (JWT tokens or session-based)
- Implement rate limiting on API endpoints
- Add request validation middleware
- Database read replicas for horizontal scaling
- CDN for frontend static assets

---

## Technical Trade-offs

**1. BFS vs DFS for Tree Traversal**
- **Chose BFS:** More intuitive for organizational hierarchies, easier to visualize levels
- **Trade-off:** Slightly more memory (queue vs call stack) but better debuggability

**2. SQLite (dev) vs PostgreSQL (prod)**
- **Chose hybrid:** SQLite for fast local iteration, PostgreSQL for production reliability
- **Trade-off:** Must test both environments, but worth the development speed

**3. Optimistic Updates vs Wait for API**
- **Chose optimistic:** Instant feedback, perceived performance boost
- **Trade-off:** More complex error handling (rollback logic), but UX significantly better

**4. URL Query Params vs Local State**
- **Chose URL sync:** Shareable links, browser back/forward support, bookmark-able
- **Trade-off:** More complex state management, but huge usability win

**5. Comprehensive Testing (47 vs 4 minimum)**
- **Chose extensive coverage:** Confidence in refactoring, catches edge cases early
- **Trade-off:** More upfront time, but saves debugging time and prevents regressions

**6. Dark Theme Only**
- **Chose single theme:** Consistent with Diversio's Optimo brand, simpler codebase
- **Trade-off:** No light mode, but keeps styling maintainable

---

## Technical Stack

**Backend:**
- Django 5.2 + Django REST Framework 3.16
- Python 3.13
- PostgreSQL (production) / SQLite (dev)
- pytest 8.4 + pytest-django 4.11
- Gunicorn 23.0 (WSGI server)
- django-cors-headers 4.9

**Frontend:**
- React 19 + TypeScript 5.x (strict mode)
- Vite 6.x (build tool)
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- react-router-dom 7.x (URL state management)
- react-hot-toast (notifications)
- Vitest + Testing Library (testing)

**Deployment:**
- Frontend: Vercel (serverless)
- Backend: Render (free tier with managed PostgreSQL)
- CORS: Configured for production domains

---

## Project Structure
```
diversio-manager-alerts/
├── backend/
│   ├── alerts/
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── load_seed_data.py
│   │   ├── tests/
│   │   │   ├── test_api.py (19 tests)
│   │   │   ├── test_health.py (2 tests)
│   │   │   └── test_tree_traversal.py (7 tests)
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── utils.py (tree traversal algorithm)
│   │   └── views.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── build.sh
│   ├── pytest.ini
│   ├── requirements.txt
│   └── seed_data.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertsPage.tsx
│   │   │   ├── AlertsTable.tsx
│   │   │   ├── Filters.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   └── useFilters.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── test/
│   │   │   ├── AlertsPage.test.tsx (7 tests)
│   │   │   ├── Filters.test.tsx (6 tests)
│   │   │   └── useFilters.test.tsx (6 tests)
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── .env.production
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── setup.sh (cross-platform setup script)
├── run.sh (bash script to run both servers)
├── package.json (root-level scripts for npm run dev)
├── package-lock.json
├── .gitignore
└── README.md
```

---

## License

This project was created as a take-home assessment for Diversio.

---

## Contact

**GitHub:** [@Exalt24](https://github.com/Exalt24)

**Email:** dcruz@up.edu.ph
