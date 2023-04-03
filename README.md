# Podcast-conv-ai

## What is this
This is the winning submission of the hasgeek hackathon held in Bangalore on `March 03, 2023`. Our submission was a chrome plugin that you can open on any `youtube` video and ask questions off of. The plugin not only synthesizes an answer using `large language models` but also points you to the specific chunks in the video from where it constructed the answer from. This allows you to find the information you are looking for without having to scrub through the video, painfully slowly. 

## Steps to run
1. Clone the git repository locally using `<!git-command>` run from within the folder you want to store the project in
2. Create virtual environment:
		- `conda` or `mamba` - I use mamba but you can use conda also. They both function the same here. Run the following command in the terminal (from the project folder) `mamba env create --file env.yml` and then activate the env with `mamba activate podcast-conv-ai`  
		- you can also use `virtualenv` I will leave a `requirements.txt` file also 
3. We use OpenAI's GPT3.5, you need to add your own API key. Create a `.env` file and add an entry as `OPENAI_API_KEY="<enter-your-key-here>"`, save and close out of the file. 
3. From the terminal or your IDE, run `uvicorn src.main:app` to start the server from which we will be making `api` calls
		- If you get port error, then run `uvicorn src.main:app --port 8080` or whatever port you want to
		- You can also run `uvicorn src.main:app --reload` to run in developer mode, where any change detected will immediately be reflected
4. You can see the documentation on the `api` by visiting `http://127.0.0.1:8000/redoc` or `http://127.0.0.1:8000/docs`
5. To see the result, connect it up to a front end, or hit the `api` from `curl` or `postman`. The request will include the following:
		- `request body` `{'query': "Who are some of the people mentioned in the video?"}`
		- `query` parameter to be passed is `video_id=<youtube_video_id>`
6. Answer to the question and the relevant snippet are shared in the body as follows:
		```
		{
		  "response": "The video mentions Anne FRank, Hitler, and everyday people who struggle to make ends meet.",
		  "sources": "750.0044 - 600.9944",
		  "id": 0
		}
		```
		Here the `response` is the answer returned and `sources` is the `start` to `end` timestamp of the video where the information is in.  

## General Notes 
- Go to `src/index_construct.py` to change the llm model. We are using `gpt-3.5-turbo` but you can change to any other model. 
- We were consuming it as an api to a chrome plugin, but the plugin is not ready enough to share. So if you want to see this work, construct and send api calls and read the responses. 
- All files are stored in the project folder. `data` is where the database, the extracted subs, the timechunks and the index to every video you run this on. This index is what the converational queries are made to. 


## Improvement opportunities
- Currently only a single source is returned, multiple sources are not supported
- Currently built as a single question, single answer implementation. Use llangchain to create conversation that remembers context.
- Each index is separate without ony global hierarchy. To support multi-document search, index of indexes needs to be supported. This requires composing a graph. We tried doing this but the graph was unable to maintain timechunking over both documents. Likely an error in implementing composotitionality. I might have to manually set the `root node` like an `__init__.py`  
- bundle with the plugin 
