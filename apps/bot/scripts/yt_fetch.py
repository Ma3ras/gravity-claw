import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def get_transcript(video_id):
    try:
        # Prioritize English and German, but fall back to auto-generated or other available languages if needed.
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'de', 'en-US', 'en-GB'])
        formatter = TextFormatter()
        return formatter.format_transcript(transcript)
    except Exception as e:
        return f"Error: Could not retrieve transcript. The video might not have closed captions enabled, or they are auto-generated and restricted. Details: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python yt_fetch.py <video_id_or_url>")
        sys.exit(1)
        
    video_input = sys.argv[1]
    
    # Auto-extract video ID if the agent passed a full URL instead of just the ID
    video_id = video_input
    if "v=" in video_input:
        video_id = video_input.split("v=")[1].split("&")[0]
    elif "youtu.be/" in video_input:
        video_id = video_input.split("youtu.be/")[1].split("?")[0]
        
    print(get_transcript(video_id))
