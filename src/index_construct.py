from llama_index import Document
import json
from llama_index.node_parser import SimpleNodeParser
from llama_index import GPTTreeIndex, LLMPredictor, PromptHelper
from langchain import OpenAI

from llama_index.data_structs.node_v2 import Node, DocumentRelationship


class ConfigLLM:
    # define LLM
    name = "ada-003"
    llm_predictor = LLMPredictor(llm=OpenAI(temperature=0, model_name="text-ada-003"))

    # define prompt helper
    # set maximum input size
    max_input_size = 4096
    # set number of output tokens
    num_output = 256
    # set maximum chunk overlap
    max_chunk_overlap = 20
    prompt_helper = PromptHelper(max_input_size, num_output, max_chunk_overlap)


f = open("data/timechunk.json", mode="r")
data = json.load(f)

# for k,v in data.items():

text_list = [v for _, v in data.items()]
doc_index_list = [k for k, _ in data.items()]

# documents = [Document(t) for t in text_list]
# parser = SimpleNodeParser()
# nodes = parser.get_nodes_from_documents(documents)

# index = GPTTreeIndex(nodes=nodes)
# index.save_to_disk("data/index.json")
# answer = index.query("What is the document about?")
# print(
#     answer, answer.source_nodes, answer.get_formatted_sources(), sep="\n-------------\n"
# )

# nodes = [Node(text=v, doc_id=k) for k, v in data.items()]
# index = GPTTreeIndex(nodes=nodes)
# index.save_to_disk("data/index_time_id.json")

index = GPTTreeIndex.load_from_disk("data/index_time_id.json")
answer = index.query("Who is candace owens and is there any relationship to trump?")
print(
    answer,
    [
        [el.strip() for el in source.node.doc_id.split("-")]
        for source in answer.source_nodes
    ],
    answer.get_formatted_sources(),
    sep="\n-------------\n",
)
