import json, math, os
from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter

json_formatter = JSONFormatter()

# PARAMS
time_chunk_size_mins = 5


def orchestrate_timechunking(
    path_to_list_of_videoid: str,
    directory_to_store_subs: str,
    directory_to_store_timechunks: str,
):
    videoid_list = open(path_to_list_of_videoid).read().split()

    # # logging
    # print(videoid_list)

    for videoid in videoid_list:
        formatted_subs = extract_json_formatted_subs(videoid)
        # print(formatted_subs)
        write_subs_to_json(formatted_subs, directory_to_store_subs, videoid)
        print("succesfully created subs file")
        create_time_chunks(
            directory_to_store_subs, directory_to_store_timechunks, time_chunk_size_mins
        )


def extract_json_formatted_subs(video_id: str) -> json:
    subs = YouTubeTranscriptApi.get_transcript(video_id)
    formatted_subs = json_formatter.format_transcript(transcript=subs)
    return formatted_subs


def write_subs_to_json(json_formatted_subs: json, folder_path: str, video_id: str):
    with open(f"{folder_path}/{video_id}.json", mode="w") as f:
        f.write(json_formatted_subs)


def create_time_chunks(
    input_directory: str, output_directory: str, time_chunk_size_mins: int
):
    # iterate over all the files in the directory:
    for filename in os.listdir(input_directory):
        file = os.path.join(input_directory, filename)
        print(file)
        f = open(file)
        data = json.loads(f.read())

        # # logging
        # print(type(data))

        # start with empty dict that you will keep adding to
        timechunks = {}

        # helper variables to keep track of position, timechunk size, and collating the text
        current_time_pos = 0
        running_composite = []
        chunk_num = 1

        # loop to create the chunks
        #! the last chunk might be getting skipped
        for chunk in data:
            # print("working with chunk")
            # print(type(chunk), "-" * 30)
            # print(chunk)
            # print(chunk["start"], end="-" * 40)
            end_time = chunk["start"] + chunk["duration"]
            if math.isclose(end_time, chunk_num * 60 * time_chunk_size_mins, abs_tol=5):
                text = " ".join(running_composite)
                timechunks[f"{current_time_pos} - {end_time}"] = text
                running_composite.clear()
                current_time_pos = end_time
                chunk_num += 1
            else:
                running_composite.append(chunk["text"])

        # write the timechunks to a json file
        with open(f"{output_directory}/{filename}", "w") as f:
            json.dump(timechunks, f)


# videoId = "zBUhQPPS9AY"
# subs = YouTubeTranscriptApi.get_transcript(videoId)
# json_formatted = formatter.format_transcript(transcript=subs)

# with open("data/yc_test_subs.json", mode="w", encoding="utf-8") as f:
#     f.write(json_formatted)

# f = open("data/yc_test_subs.json")
# data = json.load(f)


# # combined_text = []

# # for i in data:
# #     combined_text.extend([i["text"]])


# with open("data/yc.json", mode="w") as f:
#     json.dump(timechunks, f)

if __name__ == "__main__":
    ...
