---
name: Esports Tracker
description: Track live esports matches, schedules, and scores (specifically League of Legends / LEC)
triggers: esports, lec, lcs, lck, lpl, league of legends, lol, match, game, score, standings
---
When asked about live or upcoming esports matches (like League of Legends LEC):

1. **Do not just guess.** Schedules change frequently.
2. Official sites like lolesports.com often use client-side rendering (React) and embed Twitch/YouTube players, making them hard to read directly.
3. **Instead, search exclusively on Liquipedia.** They maintain up-to-date, text-based brackets and live scores that the bot can easily read.
   - **CRITICAL:** DO NOT use `lol.fandom.com` or official league websites. They are bloated with JS/images and will cause `read_url` to **timeout**.
   - Example Google search queries: 
     - `site:liquipedia.net League of Legends LEC 2026 Spring` 
     - `site:liquipedia.net League of Legends Prime League Division 1 2026`
     - `site:liquipedia.net League of Legends LCK Spring 2026 matches`
4. Use the `read_url` tool ONLY on the resulting `liquipedia.net` links.
5. If you cannot find live score information, look for official Twitter (X) accounts (e.g., @LEC) via web search for live updates.
6. When reporting scores, clearly state:
   - The teams playing
   - The current score (e.g., 1-0 in a Best of 3)
   - The phase of the tournament (e.g., Group Stage, Playoffs)
7. If a match is scheduled for the future, provide the date, time, and timezone clearly.
