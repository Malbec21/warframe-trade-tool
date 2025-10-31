FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application
COPY . .

# Run the application (Railway sets $PORT automatically)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

