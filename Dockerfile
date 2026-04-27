FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY . /app

RUN uv sync --no-dev

EXPOSE 5172

CMD ["sh", "-c", "cd examples/mnist && uv run vest data.csv --host 0.0.0.0 --port 5172 --image-path ./images"]
