FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY Services/MatchmakingService/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the shared dependencies
COPY sharedShit/ /app/sharedShit/

# Copy the service code
COPY Services/MatchmakingService/ .

# Expose the port
EXPOSE 8002

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
