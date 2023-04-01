from pydantic import BaseModel


class RequestBase(BaseModel):
    query: str


class Request(RequestBase):
    id: int

    class Config:
        orm_mode = True


class ResponseBase(BaseModel):
    response: str
    sources: str
    pass


class Response(ResponseBase):
    id: int

    class Config:
        orm_mode = True
