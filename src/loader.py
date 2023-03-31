import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter
import math

time_chunk_size_mins = 5

videoId = "Qyrjgf-_Vdk"
subs = YouTubeTranscriptApi.get_transcript(videoId)
formatter = JSONFormatter()
json_formatted = formatter.format_transcript(transcript=subs)

# with open("data/test_subs.json", mode="w", encoding="utf-8") as f:
#     f.write(json_formatted)

f = open("data/test_subs.json")
data = json.load(f)

timechunks = {}

current_time_pos = 0
running_composite = []
chunk_num = 1

for chunk in data:
    end_time = chunk["start"] + chunk["duration"]
    if math.isclose(end_time, chunk_num * 60 * time_chunk_size_mins, abs_tol=5):
        text = " ".join(running_composite)
        timechunks[f"{current_time_pos} - {end_time}"] = text
        running_composite.clear()
        current_time_pos = end_time
        chunk_num += 1
    else:
        running_composite.append(chunk["text"])

# combined_text = []

# for i in data:
#     combined_text.extend([i["text"]])


with open("data/timechunk.json", mode="w") as f:
    json.dump(timechunks, f)
