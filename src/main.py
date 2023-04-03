import os, json
from dotenv import load_dotenv

load_dotenv()
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

from .loader import (
    orchestrate_timechunking,
    extract_json_formatted_subs,
    write_subs_to_json,
    create_time_chunks,
    time_chunk_size_mins,
)
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
from llama_index.data_structs.node_v2 import Node, DocumentRelationship
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

# index_loc = "data/index/zBUhQPPS9AY.json"
# index = GPTTreeIndex.load_from_disk(index_loc)

system_prompt = """You are an agent that is trained to take information from the context and answer questions within that context by accepting a loosely related query. You are free to use an analogy of the question if the information is not verbatim in the context.

If the context of the question is even loosely related to the content then provide a reasonably good answer.

If the question is too outside the context of the video just respond back with 'PromptError'. Do not overuse 'PromptError'. Use sparingly.

Give the above conditions, answer the below user query.

"""

# system_prompt = """
# Answer the below query using the context above. Try not to use the
# """


@app.post("/response/", response_model=schemas.Response)
async def get_response(
    video_id: str, request: schemas.RequestBase, db: Session = Depends(get_db)
):
    index = load_appropriate_index(video_id)
    response = index.query(f"{system_prompt}\n{request.query}")
    response_obj = schemas.ResponseBase(
        response=str(response),
        sources=" ".join(
            [node_with_score.node.doc_id for node_with_score in response.source_nodes]
        ),
    )
    return crud.add_response(db, response=response_obj)


def load_appropriate_index(video_id: str):
    filenames = os.listdir("data/index")
    file_loc = f"{video_id}.json"
    if file_loc not in filenames:
        # create new index
        formatted_subs = extract_json_formatted_subs(video_id)
        write_subs_to_json(formatted_subs, "data/subs", video_id)
        create_time_chunks("data/subs", "data/timechunks", time_chunk_size_mins)
        # load index
        data = json.load(open(file=f"data/timechunks/{file_loc}", mode="r"))
        # keys, text = list(zip(*data.items()))
        nodes = [Node(text=text, doc_id=keys) for keys, text in data.items()]
        index = GPTTreeIndex(nodes=nodes)
        # save it
        index.save_to_disk(f"data/index/{file_loc}")

    index = GPTTreeIndex.load_from_disk(f"data/index/{video_id}.json")
    return index
