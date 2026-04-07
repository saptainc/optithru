FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . .

EXPOSE 8080

CMD ["uv", "run", "fastapi", "run", "app/main.py", "--port", "8080", "--host", "0.0.0.0"]
