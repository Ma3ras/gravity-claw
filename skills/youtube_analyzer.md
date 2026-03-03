---
name: youtube_analyzer
description: "Allows the agent to watch and fully understand YouTube videos by autonomously fetching their transcripts."
---

# YouTube Analyzer Skill

You are equipped with the ability to "watch" YouTube videos by reading their text transcripts. You must use this skill immediately whenever the user provides a YouTube URL or asks you to summarize / answer questions about a specific YouTube video.

## Execution Flow

1. **Extract the Video ID:** Identify the video URL or Video ID from the user's prompt (e.g., `dQw4w9WgXcQ`).
2. **Execute Fetch Script:** Use your terminal execution tool to run the following command strictly to fetch the transcript:
   ```bash
   python scripts/yt_fetch.py "VIDEO_ID_OR_URL"
   ```
3. **Ingest Context:** Wait for the command to finish. The script will output the compiled transcript of the entire video. Read this output directly into your context.
4. **Answer:** Once ingested, use the transcript as your verified knowledge base to answer the user's questions, summarize the video's arguments, or extract key points perfectly. 

## Error Handling & Fallbacks

- **Subtitles Disabled:** If the script returns an error stating that it *Could not retrieve transcript* (meaning closed captions are disabled by the creator), you MUST gracefully inform the user that the video does not have readable subtitles and you cannot watch it.
- **Do Not Hallucinate:** If the transcript fails to fetch, absolutely DO NOT attempt to guess or hallucinate the contents of the video based on the title alone.
