from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# postgresql+psycopg2://<USER>:<PASSWORD>@<HOST>:<PORT>/<DBNAME>
DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}"
    f"@{os.environ['DB_HOST']}:{os.environ['DB_PORT']}/"
    f"{os.environ['DB_NAME']}"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
