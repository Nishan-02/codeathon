from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# For a fast hackathon setup, you can use a local SQLite file if Postgres isn't running yet.
# To use Postgres, change this to: "postgresql://user:password@localhost:5432/your_db_name"
SQLALCHEMY_DATABASE_URL = "sqlite:///./codeathon.db"

# The 'check_same_thread' arg is only needed for SQLite. Remove it if using Postgres.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()