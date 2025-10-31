# Warframe Trade Helper - Backend Only
# Frontend should be deployed on Vercel (free)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/pyproject.toml ./

# Install dependencies
RUN pip install --no-cache-dir -e .

# Copy backend source
COPY backend/ ./

# Expose port (Railway sets $PORT)
EXPOSE 8000

# Run backend
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

