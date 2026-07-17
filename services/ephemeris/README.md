# Ephemeris microservice

Swiss Ephemeris natal-chart API for Cosmographic.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./scripts/download_ephe.sh
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Swiss Ephemeris binary files (`sepl_18.se1`, `semo_18.se1`, `seas_18.se1`) are required for high-precision planetary positions. The download script pulls them from the official `aloistr/swisseph` mirror.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/health` | Service + sweph version |
| POST | `/v1/geocode` | City/country → lat/lon |
| POST | `/v1/timezone` | Lat/lon + local DT → IANA TZ + UTC |
| POST | `/v1/natal-chart` | Full natal chart payload |

Interactive docs: `http://localhost:8000/docs`

## Example

```bash
curl -s http://localhost:8000/v1/natal-chart \
  -H 'Content-Type: application/json' \
  -d '{
    "dateOfBirth": "1990-07-12",
    "timeOfBirth": "14:32",
    "location": { "city": "Athens", "country": "Greece" },
    "houseSystem": "P"
  }'
```

## Notes

- Geocoding uses OpenStreetMap Nominatim (respect rate limits; User-Agent identifies Cosmographic).
- House system default is Placidus (`P`).
- Optional bodies like Chiron are skipped gracefully if ephemeris files are unavailable.
