---
name: Image Generation (Free)
description: Generate AI images instantly using a free API with automatic prompt enhancement. Handles prompt crafting, style detection, and image delivery without requiring API keys.
triggers: generate image, create image, make a picture, draw, thumbnail, wallpaper, product shot, logo, anime, concept art
---

# Image Generation Skill (Free Edition)

You generate high-quality images by enhancing user prompts and using the free **Pollinations.ai** visual generation API. 
The enhancement step is what separates a mediocre result from a stunning one.

## Authentication
**None required.** The API is completely free and public.

## Core Workflow

Every image generation request follows three steps:

### 1. Parse the Request

Pull these from the user's message (fill in defaults if missing):

| Field | Required? | Default |
| --- | --- | --- |
| Subject / scene | Yes | — |
| Style | No | Photorealistic |
| Aspect ratio | No | `1:1` |

Use this **Quick Reference** to auto-detect style and size from common phrases:

| User Says | Style | Resolution (Width x Height) | Enhancement Focus |
| --- | --- | --- | --- |
| "headshot" / "portrait" | Photorealistic | 768x1024 | Shallow DOF, portrait lens, studio lighting |
| "wallpaper" / "desktop" | Any | 1920x1080 | Ultra-wide composition, high detail |
| "phone wallpaper" / "story" | Any | 1080x1920 | Vertical composition, mobile framing |
| "product photo" | Product Shot | 1024x1024 | Clean background, commercial lighting |
| "logo" | Logo Design | 1024x1024 | Vector-clean, minimal, scalable, flat colors |
| "thumbnail" | Cinematic | 1280x720 | High contrast, bold focal point, vibrant |
| "social media" | Any | 1080x1080 | Vibrant, scroll-stopping |
| "anime character" | Anime | 768x1024 | Expressive, detailed, studio ghibli or makoto shinkai style |

### 2. Enhance the Prompt (Crucial)

Generation models need detailed, structured prompts. "A cat" produces generic junk. "A cinematic shot of a Maine Coon cat sitting on a windowsill, golden hour lighting, dust motes, 85mm lens, f/1.8, highly detailed, 8k resolution" produces a masterpiece.

**Step 2.1 — Detect or Ask for Style**

| Style | Prefix | Quality Boosters (Suffix) |
| --- | --- | --- |
| **Photorealistic** | "A photorealistic" | Captured with professional camera equipment, natural lighting, sharp details, high dynamic range. |
| **Cinematic** | "A cinematic film still of" | Dramatic lighting, shallow depth of field, anamorphic lens flare, color graded in teal and orange. |
| **Illustration** | "A beautiful illustration of" | Digital art style, vibrant colors, clean lines, professional quality illustration. |
| **3D Render** | "A high-quality 3D render of" | Studio lighting, PBR materials, octane render quality, smooth surfaces, ambient occlusion. |
| **Anime** | "An anime-style illustration of" | Studio Ghibli inspired, soft colors, detailed backgrounds, expressive characters. |
| **Watercolor** | "A watercolor painting of" | Soft washes of color, visible brush strokes, paper texture, artistic imperfections, dreamy quality. |
| **Product Shot** | "A professional product photography shot of" | White or minimal background, studio lighting, sharp focus, commercial quality, clean composition. |
| **Logo Design** | "A modern, minimalist logo design for" | Clean vectors, balanced composition, scalable design, professional branding quality. |
| **Oil Painting** | "An oil painting of" | Rich impasto texture, visible brushwork, classical composition, museum-quality finish, chiaroscuro lighting. |
| **Pixel Art** | "Pixel art of" | 16-bit retro style, clean pixel edges, limited color palette, nostalgic video game aesthetic. |
| **Concept Art** | "Professional concept art of" | Industry-standard quality, dynamic composition, atmospheric perspective, matte painting techniques. |

**Step 2.2 — Apply Enhancement Rules**

- **Rule 1 — Smart Prefix**: Add style prefix if user's prompt doesn't start with "A ", "An ", or "The ".
- **Rule 2 — Quality Suffix**: Append the style's quality suffix.
- **Rule 3 — Specificity Boosters**: Add lighting tags (golden hour, studio light), textures, or composition logic.
- **Rule 4 — Negative Prompt**: Add *"without X"* into the main prompt directly.
- **Rule 5 — Technical Tags**: Always include "8K resolution, ultra-detailed, masterpiece quality".

**Final Prompt Formula:**
`{Style Prefix} {User's Core Description}. {Quality Suffix} {Specificity Boosters} {Technical Quality Tags}`

*Skip enhancement ONLY if the user explicitly says "use my exact prompt".*

### 3. Generate and Deliver

Use the Pollinations.ai text-to-image GET endpoint. No JSON, no polling, no keys.

**URL Format:**
`https://image.pollinations.ai/prompt/{URL_ENCODED_PROMPT}?width={WIDTH}&height={HEIGHT}&nologo=true&enhance=false`

*Note: We set `enhance=false` because YOU are doing the prompt enhancement, which is always better than their automated one.*

**Example:**
For a 1920x1080 cinematic prompt "A cyberpunk city in the rain":
URL: `https://image.pollinations.ai/prompt/Cinematic%20photograph%20of%20a%20cyberpunk%20city%20in%20the%20rain%2C%20neon%20lights%20reflecting%20in%20puddles%2C%20blade%20runner%20style%2C%20volumetric%20fog%2C%208k%20resolution?width=1920&height=1080&nologo=true&enhance=false`

**Delivery:**
Send the image directly to the user in Telegram using Markdown image syntax, and show them the enhanced prompt you used:

```markdown
![{Brief description}]({Pollinations URL})

**Enhanced Prompt Used:**
`{Your enhanced prompt here}`
```

## Batch Generation (Variations)

If the user asks for 3 variations of a logo, generate 3 **different** enhanced prompts (mix up the colors, angles, or sub-styles slightly), and send 3 distinct Markdown image links in the same message. Add a random seed parameter `&seed={RANDOM_NUMBER}` to each URL to ensure they don't cache the exact same image.
