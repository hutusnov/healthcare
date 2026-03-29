FROM python:3.10-slim

WORKDIR /app

ENV DISABLE_MODEL_SOURCE_CHECK=True

# System dependencies for OpenCV
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY main.py ocr_services.py util.py ./
COPY models ./models
COPY data ./data

# Security: run as non-root user
RUN useradd -m -r appuser
RUN mkdir -p /tmp/ocr-output && chown -R appuser:appuser /app /tmp/ocr-output
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
