# 🧵 Loom & Logic

> **AI-Powered Fashion Design Studio & Intelligent Concept Generation Platform**

Loom & Logic is an end-to-end design tool that transforms conceptual prompts and fashion sketches into complete apparel collections. It integrates live trend intelligence, multi-variation visual generation, silhouette and fabric specification breakdown, and automated K-Means color palette extraction.

---

## ✨ Features

- **Trend-Informed Prompt Enhancement:** Searches live fashion editorial sources (Vogue, GQ, Harper's Bazaar, etc.) to enhance and contextualize user prompts.
- **Multi-Variation Visual Generation:** Generates multiple distinct stylistic variations (Avant-Garde, Commercial, Minimalist, Sustainable, etc.) tailored by silhouette and target gender.
- **Detailed Design Breakdown:** Automatic extraction of fabric specs, silhouettes, construction details, and styling notes for each garment variation.
- **K-Means Color Palette Extraction:** Uses computer vision and unsupervised clustering to isolate the 5 dominant HEX shades from garments.
- **Moodboard & Project Export:** Interactive designer workspace built with fluid micro-interactions and high-aesthetic styling.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS v4, Lucide React, Framer Motion

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn
- **Language:** Python 3.11+
- **AI & Trend Analysis:** DuckDuckGo Search API, Pollinations AI & Google Gemini
- **Image Processing & ML:** Pillow, NumPy, Scikit-learn (K-Means Clustering)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Git**

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/loom-and-logic.git
cd loom-and-logic
```

#### 2. Backend Setup
```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env   # On macOS/Linux: cp .env.example .env
```
Edit `backend/.env` with your API keys if needed (e.g. `GEMINI_API_KEY`).

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

---

## 🏃 Running the Application

### Option A: One-Click Startup (Windows)
Double-click `run_app.bat` or run:
```cmd
run_app.bat
```
This automatically boots both the backend API server and Vite frontend server in separate terminal windows.

### Option B: Manual Startup

**Start Backend (Port 8000):**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

**Start Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start designing!

---

## 📂 Project Structure

```
loom-and-logic/
├── backend/
│   ├── main.py                # FastAPI entry point & API endpoints
│   ├── requirements.txt       # Backend dependencies
│   ├── .env.example           # Example environment template
│   ├── services/
│   │   ├── ai_service.py      # Trend analysis & visual concept generator
│   │   └── color_extractor.py # K-Means color palette extraction
│   └── static/                # Static asset storage
├── frontend/
│   ├── src/                   # React components, views & hooks
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.ts         # Vite configuration
│   └── tailwind.config.js     # Styling configuration
├── run_app.bat                # Windows one-click runner script
├── .gitignore                 # Root Git ignore rules
└── README.md                  # Project documentation
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
