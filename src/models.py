from sqlalchemy import Column, String, Boolean, Text, Integer
from .database import Base


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True)
    query = Column(String)


class Response(Base):
    __tablename__ = "response"

    id = Column(Integer, primary_key=True)
    response = Column(String)
    sources = Column(String)
