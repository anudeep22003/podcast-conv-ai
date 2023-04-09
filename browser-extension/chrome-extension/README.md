Semantic search through videos by asking natural questions

## About

This extension is the user interface for searching videos. When the extension is activated, the YouTube video ID is firstly sent to the backend. Backend starts processing the transcripts of the video into embeddings and then once ready, the extension can accept queries.

The user can type in a natural language query into the search bar post which the backend would figure out the snippet(s) of the video where the queried topic have been talked about. Once it is confident, it would return the snippet as well as a textual answer. The textual answer is shown within the extension, and the video snippet opens up in a new tab.

In the current setup, the backend is at http://localhost:8000 (check src/background.js), which can be later replaced with a hosted endpoint.

### Set up

This is an unpackaged extension, and hence needs to be loaded differently.

- `npm run watch` would compile the extension source code into the `build` directory.
- One needs to visit `chrome://extensions` and load the entire `build` directory as an unpackaged extension.
