# NewsQuest

NewsQuest is a gamified news and learning platform with a Vite + React frontend in `frontend/` and a separate Express backend in `backend/`.

## What You Need

- Node.js 18 or newer
- npm
- Internet access for live news APIs

## Project Structure

- `frontend/` - React app, UI, and client-side state
- `backend/` - News API, enrichment API, and content generation endpoints

## Setup

1. Install dependencies in both folders:
   - `cd backend && npm install`
   - `cd frontend && npm install`
2. Make sure the backend environment file exists:
   - `backend/.env.local` should contain `NEWSDATA_API_KEY`
   - You can copy values from `backend/.env.example` and fill in your key
3. Start the backend first:
   - `cd backend && npm run start`
   - Default backend URL: `http://127.0.0.1:3001`
4. Start the frontend in a second terminal:
   - `cd frontend && npm run dev`
   - Default frontend URL: `http://127.0.0.1:4000`

## Environment Notes

- The frontend uses `/api` in development and Vite proxies it to the backend automatically.
- If you want to point the frontend to a hosted backend, set `VITE_API_URL` in `frontend/.env`.
- If you see `ECONNREFUSED 127.0.0.1:3001`, the backend is not running yet.

## Useful Scripts

Frontend:
- `cd frontend && npm run dev`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run test`

Backend:
- `cd backend && npm run start`
- `cd backend && npm run build`
- `cd backend && npm run typecheck`
