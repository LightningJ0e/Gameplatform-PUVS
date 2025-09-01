#Base Image
FROM python:3.13.7

#Arbeitsverzeichnis
WORKDIR /app

# Abhängigkeiten installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code und shared code kopieren
COPY ../../sharedShit /app/sharedShit
COPY . .

# FastAPI starten
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]