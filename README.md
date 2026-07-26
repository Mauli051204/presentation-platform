# Presentation Platform

A marketplace connecting colleges (post presentation requirements) and presenters (apply, get booked, get paid).

## Stack
- Frontend: React 19, Vite, JavaScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express.js, MongoDB Atlas, Mongoose
- Real-time: Socket.io
- Payments: Razorpay
- Storage: Cloudinary

## Local Setup
1. `cd backend && npm install && cp .env.example .env` — fill in values
2. `cd frontend && npm install && cp .env.example .env`
3. Backend: `npm run dev` (port 5000)
4. Frontend: `npm run dev` (port 5173)