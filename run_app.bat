@echo off
echo Starting Backend...
start cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload"

echo Starting Frontend...
start cmd /k "cd frontend && node node_modules\vite\bin\vite.js"

echo Both frontend and backend are starting in separate windows!
