FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Run the application using start script
CMD ["./start.sh"]

