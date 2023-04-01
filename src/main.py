from loader import orchestrate_timechunking
from index_construct import (
    index_construct_and_save,
    query_composed_index,
    compose_graph_and_save,
)

# create time chunks
orchestrate_timechunking(
    path_to_list_of_videoid="data/videoids.txt",
    directory_to_store_subs="data/subs",
    directory_to_store_timechunks="data/timechunks",
)

index_construct_and_save(timechunk_path="data/timechunks", save_loc="data/index")
compose_graph_and_save(index_loc="data/index", save_loc="data/graph/graph_index.json")

while True:
    query = input("What's your query\n")
    query_composed_index(query, "data/graph/graph_index.json")
