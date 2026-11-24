# EarthPulse AI

Upload a sustainability PDF to extract ESG indicators, highlight detected claims and contradictory evidence, and explore contradiction links in a graph.

## What it includes

- PDF upload (text-based PDFs, up to 50 MB)
- ESG metric extraction and a directional score breakdown
- PDF text review with detected claims and conflicting evidence highlighted
- A graph containing contradiction links only

Scanned PDFs without selectable text are not supported. URL fetching, media analysis, credit scoring, supply-chain analysis, climate scenarios, and financing recommendations are not included.

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The API starts at `http://localhost:5001`.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` requests to the local backend.

## Production

Build the frontend with `npm run build` in `frontend`. Set `VITE_API_BASE_URL` to the deployed backend URL ending in `/api`. The Flask API can be served with `gunicorn app:app`.

## Analysis notes

Metric extraction and contradiction matching use text and pattern matching. Results are suggestions for review, not audited measurements or a certified ESG rating. PDF text highlighting uses PDF.js when available; if it cannot load, the app falls back to the text extracted by the backend.
