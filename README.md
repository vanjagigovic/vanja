# Calendar Project Documentation

## 1. Project Overview

Calendar application is split into two main parts:

- `backend` - a NestJS API backed by PostgreSQL using Drizzle ORM  
- `frontend` - a React single-page application for calendar presentation and interaction  

The application supports:

- day, week, and month calendar views  
- timezone-aware event presentation  
- event create, update, and delete flows  
- weekly recurring events  
- backend-driven overlap prevention  
- suggested alternative time slots when conflicts occur  
- reminder scheduling on the frontend  
- responsive UI built with Material UI  


## 2. Technology Stack

### Frontend

- React 18 + TypeScript  
- Vite  
- Material UI  
- Framer Motion  
- Luxon (date/time handling)  
- i18next (localization)  
- React Router (routing)  
- React Query (data fetching and caching)  

### Backend

- NestJS  
- PostgreSQL  
- Drizzle ORM  
- class-validator & class-transformer  
- Zod (environment validation)  
- Luxon  



## 3. Project Structure
calendar/
├── frontend/ # React application
├── backend/ # NestJS API
├── docker-compose.yml # Docker setup (PostgreSQL + Drizzle config)
└── README.md


## 4. Environment Variables

### Frontend (`frontend/.env`)
```env
`VITE_API_BASE_URL=http://127.0.0.1:3001`
```


### Backend (`backend/.env`)
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
PORT=3001
```

## 5. Getting Started

### Run application (frontend + backend)

```bash
npm run dev
```json
"dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
"dev:frontend": "npm --prefix frontend run dev",
"dev:backend": "npm --prefix backend run start:dev"
```
## 6. Database and Drizzle 

### Generate or apply schema with Drizzle + run Drizzle Studio

```bash
npm run migrate:generate
npm run migrate:push
npm run drizzle:studio
```
## 7. Docker 
- PostgreSQL runs inside Docker container
- Configuration is defined via drizzle.config.ts
- docker-compose.yml provides local development setup

## 8. API Overview

### Events Endpoints
- `GET /events` – list events (optionally by range)
- `GET /events/:id` – get single event
- `POST /events` – create event
- `PATCH /events/:id` – update event
- `DELETE /events/:id` – delete event

## 9. Aplication Arhitecture

### Frontend Responsibilities
- UI rendering and user interaction
- State management via custom React hooks
- Routing using React Router
- Data fetching and caching using React Query
- Timezone-aware date display

### Backend Responsibilities
- Request validation
- Business logic and rules
- Recurrence handling
- Overlap detection and prevention
- Suggested alternative time generation
- Database interaction
- Database Responsibilities
- Stores canonical event data in UTC
- Stores recurrence metadata
- Enforces data integrity via constraints

### Database Responsibilities
- Stores canonical event data in UTC
- Stores recurrence metadata
- Enforces data integrity via constraints

