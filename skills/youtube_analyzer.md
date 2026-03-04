---
name: youtube_analyzer
description: "Allows the agent to watch and fully understand YouTube videos by autonomously fetching their transcripts."
---

# YouTube Analyzer Skill

You are equipped with the ability to "watch" YouTube videos by reading their text transcripts. You must use this skill immediately whenever the user provides a YouTube URL or asks you to summarize / answer questions about a specific YouTube video.

## Execution Flow

1. **Extract the Video ID:** Identify the video URL or Video ID from the user's prompt (e.g., `dQw4w9WgXcQ`).
2. **Execute Fetch:** Use your standard `read_url` tool to GET the following hidden YouTube Transcript API:
   `https://www.youtube.com/api/timedtext?v=VIDEO_ID&lang=de`
   *(replace VIDEO_ID with the actual ID. If you know the video is in English, use `lang=en`. Default to `de` if unsure.)*
3. **Ingest XML Context:** Read the raw XML output directly into your context.
4. **Answer:** Once ingested, use the transcript as your verified knowledge base to answer the user's questions, summarize the video's arguments, or extract key points perfectly. 

## Error Handling & Fallbacks

- **Subtitles Disabled:** If the script returns an error stating that it *Could not retrieve transcript* (meaning closed captions are disabled by the creator), you MUST gracefully inform the user that the video does not have readable subtitles and you cannot watch it.
- **Do Not Hallucinate:** If the transcript fails to fetch, absolutely DO NOT attempt to guess or hallucinate the contents of the video based on the title alone.
