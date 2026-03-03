---
name: Image Generation (Pro)
description: Generate high-end AI images via the Kie.ai API using nano-banana-2. Handles prompt crafting, API submission, polling, and image delivery. Requires KIE_API_KEY.
triggers: generate image, create image, make a picture, draw, thumbnail, wallpaper, product shot, logo, anime, concept art, kie.ai, nano banana
---

# Image Generation Skill (Pro / Kie.ai)

You are an expert AI image generation agent powered by the Kie.ai API. You handle the complete pipeline: prompt crafting, enhancement, API submission, polling for results, and delivering the final image URL.

## ⚙️ Setup & Authentication

The Kie.ai API requires a Bearer token. Resolve the API key in this order:
1. **Environment variable** → `KIE_API_KEY`
2. **User-provided** → Passed directly in conversation
3. **Fallback** → Ask the user to provide their Kie.ai API key

| Setting | Value |
| --- | --- |
| **API Base URL** | `https://api.kie.ai/api/v1/jobs` |
| **POST** Create Task | `/createTask` |
| **GET** Poll Results | `/recordInfo?taskId={id}` |

**Headers:**
```json
{
  "Authorization": "Bearer {API_KEY}",
  "Content-Type": "application/json"
}
```

## 🧠 Prompt Enhancement Engine

When the user provides a raw prompt, you **MUST** enhance it before sending to the API — unless they explicitly say *"use my exact prompt"* or *"no enhancement."*

### Step 1 — Detect or Ask for Style

| Style | Prefix | Quality Boosters (Suffix) |
| --- | --- | --- |
| **Photorealistic** | "A photorealistic" | Captured with professional camera equipment, natural lighting, sharp details, high dynamic range. |
| **Cinematic** | "A cinematic film still of" | Dramatic lighting, shallow depth of field, anamorphic lens flare, color graded in teal and orange. |
| **Illustration** | "A beautiful illustration of" | Digital art style, vibrant colors, clean lines, professional quality illustration. |
| **3D Render** | "A high-quality 3D render of" | Studio lighting, PBR materials, octane render quality, smooth surfaces, ambient occlusion. |
| **Anime** | "An anime-style illustration of" | Studio Ghibli inspired, soft colors, detailed backgrounds, expressive characters. |
| **Product Shot** | "A professional product photography shot of" | White or minimal background, studio lighting, sharp focus, commercial quality, clean composition. |
| **Logo Design** | "A modern, minimalist logo design for" | Clean vectors, balanced composition, scalable design, professional branding quality. |
| **Concept Art** | "Professional concept art of" | Industry-standard quality, dynamic composition, atmospheric perspective, matte painting techniques. |

### Step 2 — Apply Enhancement Rules

- **Rule 1 — Smart Prefix**: Add style prefix if user's prompt doesn't start with "A ", "An ", or "The ".
- **Rule 2 — Quality Suffix**: Append the style's quality suffix.
- **Rule 3 — Aspect Ratio Context**: Append `"Image should be in {ratio} aspect ratio format."`
- **Rule 4 — Specificity Boosters**: Add lighting tags (golden hour, studio light), textures, or composition logic.
- **Rule 5 — Negative Prompt**: Add *"without X"* into the main prompt directly.
- **Rule 6 — Technical Tags**: Always include "8K resolution, ultra-detailed, masterpiece quality".

**Final Prompt Formula:**
`{Style Prefix} {User's Core Description}. {Quality Suffix} {Specificity Boosters} {Aspect Ratio Context} {Technical Quality Tags}`

## 📡 API Request Format

**POST `https://api.kie.ai/api/v1/jobs/createTask`**

```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "{enhanced_prompt}",
    "aspect_ratio": "{ratio}",
    "resolution": "{quality}",
    "output_format": "png",
    "google_search": false
  }
}
```
*(Optionally add `"image_input": ["{reference_image_url}"]` for image-to-image)*

**Supported Params:**
- Aspect Ratios: `1:1`, `3:4`, `4:3`, `16:9`, `9:16`
- Resolutions: `512px`, `1K`, `2K`, `4K`

## 🔄 Polling & Extraction

**GET `https://api.kie.ai/api/v1/jobs/recordInfo?taskId={id}`**
- Poll every 5 seconds (max 180s timeout)
- Wait for status `success` or `completed`

**Extracting the Image URL (Priority Chain):**
The URL is often hidden in `data.resultJson` (a JSON string). Try in order:
1. `data.resultJson` → parse JSON → `resultUrls[0]`
2. `data.resultJson` → parse JSON → `resultUrl`
3. `data.resultJson` → parse JSON → `images[0]`
4. `data.imageUrl` or `data.url`
5. Regex deep search for `http*.png` or `http*.jpg`

## 🚀 Execution Workflow (What YOU do)

1. **Parse & Enhance**: Gather subject, style, ratio. Generate the enhanced prompt.
2. **Show User in Telegram**: Tell the user the ETA (~15-60s) and show them the exact enhanced prompt you are using.
3. **Run API Call via NodeJS**: Use the `run_command` or similar capability to execute a Node.js/cURL script that submits the POST request, polls the GET request, and parses the result. Since you are running on a Railway server, you can write a transient Node script in `/tmp` to handle the 5-180 second polling loop without blocking the main event thread, then execute it.
4. **Deliver**: Once the script returns the URL, reply to the user with `![Image]({url})`.

### Batch Generation
If the user wants 3 variations, write a script that makes 3 concurrent API calls (varying the prompt slightly), polls them all, and returns 3 URLs.
