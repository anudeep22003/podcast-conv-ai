from sqlalchemy.orm import Session
from . import models, schemas


def add_request(db: Session, query: str):
    request_entry = models.Request(query=query)
    db.add(request_entry)
    db.commit()
    db.refresh(request_entry)
    return request_entry


def add_response(db: Session, response: schemas.ResponseBase):
    # response_entry = models.Response(response=response, sources=sources)
    response_entry = models.Response(
        response=response.response, sources=response.sources
    )
    db.add(response_entry)
    db.commit()
    db.refresh(response_entry)
    return response_entry
