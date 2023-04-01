from .loader import orchestrate_timechunking
from .index_construct import (
    index_construct_and_save,
    query_composed_index,
    compose_graph_and_save,
    query_single_index,
)
from llama_index import GPTTreeIndex
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import SessionLocal, engine
from datetime import datetime
from typing import Optional

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# Dependency
# returns a session to run a transaction
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# create time chunks
# orchestrate_timechunking(
#     path_to_list_of_videoid="data/videoids.txt",
#     directory_to_store_subs="data/subs",
#     directory_to_store_timechunks="data/timechunks",
# )

# index_construct_and_save(timechunk_path="data/timechunks", save_loc="data/index")
# compose_graph_and_save(index_loc="data/index", save_loc="data/graph/graph_index.json")

# while True:
#     query = input("What's your query\n")
#     # query_composed_index(query, "data/graph/graph_index.json")
#     query_single_index(query, index_loc="data/index/Qyrjgf-_Vdk.json")

# index = GPTTreeIndex.load_from_disk("data/index/Qyrjgf-_Vdk.json")

index_loc = "data/index/zBUhQPPS9AY.json"
index = GPTTreeIndex.load_from_disk(index_loc)


@app.get("/response/", response_model=schemas.Response)
async def get_response(request: schemas.RequestBase, db: Session = Depends(get_db)):
    response = index.query(request.query)
    response_obj = schemas.ResponseBase(
        response=str(response),
        sources=" ".join(
            [node_with_score.node.doc_id for node_with_score in response.source_nodes]
        ),
    )
    return crud.add_response(db, response=response_obj)
