FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY source_registry.yaml ./
COPY src/ ./src/

CMD ["python", "-m", "src.main"]
