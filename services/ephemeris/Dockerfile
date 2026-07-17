FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# .se1 files are gitignored — download official Swiss Ephemeris data at build time
# (falls back to local COPY if present for offline builds)
RUN mkdir -p /app/ephe && \
    BASE="https://raw.githubusercontent.com/aloistr/swisseph/master/ephe" && \
    for f in sepl_18.se1 semo_18.se1 seas_18.se1; do \
      curl -fsSL -o "/app/ephe/$f" "$BASE/$f"; \
    done && \
    ls -la /app/ephe

ENV PORT=8000
ENV EPHE_PATH=/app/ephe
ENV CORS_ORIGINS=https://www.cosmographic.store,https://shop.cosmographic.store,http://localhost:3000
ENV NOMINATIM_USER_AGENT="CosmographicNatalCustomizer/0.1_cosmographicstore_at_gmail.com"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/v1/health" || exit 1

# Render / Railway inject PORT at runtime
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]