#Base Image
FROM python:3.13.7

#Label the Image to make it public in repo
LABEL org.opencontainers.image.source="https://github.com/LightningJ0e/Gameplatform-PUVS"

#Arbeitsverzeichnis
WORKDIR /app

# Abhängigkeiten installieren
COPY Services/RanglisteService/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code und shared code kopieren
COPY sharedShit /app/sharedShit
COPY Services/RanglisteService /app/Services/RanglistenService

# FastAPI starten
CMD ["uvicorn", "Services.RanglisteService.Main:app", "--host", "0.0.0.0", "--port", "8003"]