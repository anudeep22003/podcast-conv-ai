from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func


Base = declarative_base()


engine = create_engine(
    "sqlite+pysqlite:///data/database/test.db",
    echo=True,
    connect_args={
        "check_same_thread": False
    },  # this helped with the mutliple thread problem
)

SessionLocal = sessionmaker(bind=engine)
