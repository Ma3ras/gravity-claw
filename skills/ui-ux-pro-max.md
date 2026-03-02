---
name: UI UX Pro Max
description: Design intelligence for building professional UI/UX. Provides style selection, color palettes, typography, layout rules, accessibility guidelines, and 100 industry-specific reasoning rules. Use when building any frontend, UI, landing page, dashboard, or web application.
triggers: ui, ux, design, frontend, landing page, dashboard, website, web app, styling, css, colors, layout, build, create app
---
# UI/UX Pro Max - Design Intelligence

Comprehensive design guide with 68 UI styles, 100 industry reasoning rules, UX guidelines, and pre-delivery checklist.
Apply these rules when building ANY user-facing interface via `create_antigravity_task`.

## When to Apply
- Building new UI components or pages
- Choosing color palettes and typography
- Creating landing pages, dashboards, or web apps
- Any task that produces visual output

## WORKFLOW: Design System Generation

When creating a `create_antigravity_task` prompt for ANY frontend work:

### Step 1: Analyze User Requirements
Extract from the user's request:
- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, game, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, etc.
- **Stack**: React, Vue, Next.js, or default to HTML + Tailwind

### Step 2: Match Industry → Design System (REQUIRED)
Look up the product type in the **100 Industry Reasoning Rules** below.
This gives you: recommended pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Look up Style Details
Find the matched style in the **68 UI Styles Database** below for:
- Exact CSS keywords and implementation checklist
- Design system variables
- Primary/secondary colors with hex codes
- Effects and animations
- Framework compatibility

### Step 4: Generate Complete Design System Output
Include this structured block in the `create_antigravity_task` prompt:

```
DESIGN SYSTEM FOR [Project Name]:

PATTERN: [From reasoning rules - e.g., Hero-Centric + Social Proof]
STYLE: [From reasoning rules - e.g., Soft UI Evolution]
COLORS:
  Primary: [hex] ([name])
  Secondary: [hex] ([name])
  CTA: [hex] ([name])
  Background: [hex] ([name])
  Text: [hex] ([name])
TYPOGRAPHY: [Heading font] / [Body font]
  Google Fonts: https://fonts.google.com/share?selection.family=...
KEY EFFECTS: [From reasoning rules]
ANTI-PATTERNS (AVOID): [From reasoning rules]

PRE-DELIVERY CHECKLIST:
[Include full checklist from end of this document]
```

---

## 100 INDUSTRY-SPECIFIC REASONING RULES

Each rule maps: Industry → Pattern, Style, Colors, Typography, Effects, Decision Rules, Anti-Patterns

| # | Industry | Pattern | Style | Colors | Typography | Key Effects | Anti-Patterns |
|---|----------|---------|-------|--------|------------|-------------|---------------|
| 1 | SaaS (General) | Hero + Features + CTA | Glassmorphism + Flat | Trust blue + Accent contrast | Professional + Hierarchy | Subtle hover 200-250ms | Excessive animation, Dark mode default |
| 2 | Micro SaaS | Minimal & Direct + Demo | Flat + Vibrant Block | Vibrant primary + White space | Bold + Clean | Large CTA hover 300ms | Complex onboarding, Cluttered layout |
| 3 | E-commerce | Feature-Rich Showcase | Vibrant Block-based | Brand primary + Success green | Engaging + Clear hierarchy | Card hover lift 200ms | Flat without depth, Text-heavy pages |
| 4 | E-commerce Luxury | Feature-Rich Showcase | Liquid Glass + Glassmorphism | Premium + Minimal accent | Elegant + Refined | Chromatic aberration, Fluid 400-600ms | Vibrant Block, Playful colors |
| 5 | Healthcare App | Social Proof-Focused | Neumorphism + Accessible | Calm blue + Health green | Readable + Large 16px+ | Soft box-shadow, Smooth press 150ms | Bright neon, Motion-heavy, AI purple/pink |
| 6 | Fintech/Crypto | Conversion-Optimized | Glassmorphism + Dark OLED | Dark tech + Vibrant accents | Modern + Confident | Real-time charts, Alert pulse/glow | Light backgrounds, No security indicators |
| 7 | Education | Feature-Rich Showcase | Claymorphism + Micro-interact | Playful + Clear hierarchy | Friendly + Engaging | Soft press 200ms, Fluffy elements | Dark modes, Complex jargon |
| 8 | Portfolio/Personal | Storytelling-Driven | Motion-Driven + Minimalism | Brand primary + Artistic | Expressive + Variable | Parallax 3-5 layers, Scroll reveals | Corporate templates, Generic layouts |
| 9 | Government/Public | Minimal & Direct | Accessible + Minimalism | Professional blue + High contrast | Clear + Large | Focus rings 3-4px, Skip links | Ornate design, Low contrast, Motion |
| 10 | Fintech (Banking) | Trust & Authority | Minimalism + Accessible | Navy + Trust Blue + Gold | Professional + Trustworthy | Smooth transitions, Number animations | Playful design, Unclear fees |
| 11 | Social Media App | Feature-Rich Showcase | Vibrant Block + Motion | Vibrant + Engagement colors | Modern + Bold | Large scroll animations | Heavy skeuomorphism |
| 12 | Startup Landing | Hero-Centric + Trust | Motion-Driven + Vibrant Block | Bold primaries + Accent contrast | Modern + Energetic | Scroll-triggered, Parallax | Static design, No video, Poor mobile |
| 13 | Gaming | Feature-Rich Showcase | 3D Hyperrealism + Retro-Futurism | Vibrant + Neon + Immersive | Bold + Impactful | WebGL 3D, Glitch effects | Minimalist design, Static assets |
| 14 | Creative Agency | Storytelling-Driven | Brutalism + Motion-Driven | Bold primaries + Artistic | Bold + Expressive | CRT scanlines, Neon glow, Glitch | Corporate minimalism |
| 15 | Wellness/Mental Health | Social Proof-Focused | Neumorphism + Accessible | Calm Pastels + Trust colors | Calming + Readable | Soft press, Breathing animations | Bright neon, Motion overload |
| 16 | Restaurant/Food | Hero-Centric + Conversion | Vibrant Block + Motion | Warm (Orange Red Brown) | Appetizing + Clear | Food image reveal, Menu hover | Low-quality imagery |
| 17 | Real Estate | Hero-Centric + Feature-Rich | Glassmorphism + Minimalism | Trust Blue + Gold + White | Professional + Confident | 3D property tour, Map hover | Poor photos, No virtual tours |
| 18 | Travel/Tourism | Storytelling + Hero | Aurora UI + Motion | Vibrant destination + Sky Blue | Inspirational + Engaging | Destination parallax, Itinerary anim | Generic photos, Complex booking |
| 19 | SaaS Dashboard | Data-Dense Dashboard | Data-Dense + Heat Map | Cool→Hot gradients + Neutral grey | Clear + Readable | Hover tooltips, Chart zoom, Pulse | Ornate design, Slow rendering |
| 20 | B2B SaaS Enterprise | Feature-Rich Showcase | Trust & Authority + Minimal | Professional blue + Neutral grey | Formal + Clear | Subtle transitions, Feature reveals | Playful design, AI purple/pink |
| 21 | Music/Entertainment | Feature-Rich Showcase | Dark OLED + Vibrant Block | Dark #121212 + Vibrant accents | Modern + Bold | Waveform viz, Playlist animations | Cluttered layout |
| 22 | Video Streaming/OTT | Hero-Centric + Feature-Rich | Dark OLED + Motion | Dark bg + Poster colors | Bold + Engaging | Video player anim, Content carousel | Static layout, Slow player |
| 23 | Job Board/Recruitment | Conversion + Feature-Rich | Flat + Minimalism | Professional Blue + Success Green | Clear + Professional | Search/filter animations | Outdated forms, Hidden filters |
| 24 | Marketplace (P2P) | Feature-Rich + Social Proof | Vibrant Block + Flat | Trust + Category colors + Green | Modern + Engaging | Review star anim, Listing hover | Low trust signals |
| 25 | Logistics/Delivery | Feature-Rich + Real-Time | Minimalism + Flat | Blue #2563EB + Orange + Green | Clear + Functional | Real-time tracking, Status pulse | Static tracking, No map |
| 26 | Agriculture/Farm Tech | Feature-Rich | Organic Biophilic + Flat | Earth Green #4A7C23 + Brown + Sky | Clear + Informative | Data viz, Weather animations | Generic design |
| 27 | Construction/Architecture | Hero-Centric + Feature-Rich | Minimalism + 3D Hyperrealism | Grey + Orange safety + Blueprint Blue | Professional + Bold | 3D model viewer, Timeline anim | 2D-only, Poor image quality |
| 28 | Automotive/Car Dealership | Hero-Centric + Feature-Rich | Motion + 3D Hyperrealism | Brand + Metallic + Dark/Light | Bold + Confident | 360 product view, Configurator anim | Static product pages |
| 29 | Photography Studio | Storytelling + Hero-Centric | Motion + Minimalism | Black + White + Minimal accent | Elegant + Minimal | Full-bleed gallery, Before/after | Heavy text |
| 30 | Coworking Space | Hero-Centric + Feature-Rich | Vibrant Block + Glassmorphism | Energetic + Wood tones + Brand | Modern + Engaging | Space tour video, Amenity reveals | Outdated photos |
| 31 | Cleaning Service | Conversion + Trust | Soft UI + Flat | Fresh Blue #00B4D8 + White + Green | Friendly + Clear | Before/after gallery | Hidden pricing |
| 32 | Home Services | Conversion + Trust | Flat + Trust & Authority | Trust Blue + Safety Orange + Grey | Professional + Clear | Emergency contact highlight | Hidden contact info |
| 33 | Childcare/Daycare | Social Proof + Trust | Claymorphism + Vibrant Block | Playful pastels + Safe + Warm | Friendly + Playful | Activity gallery reveal | Hidden safety info |
| 34 | Senior Care/Elderly | Trust & Authority + Accessible | Accessible + Soft UI | Calm Blue + Warm neutrals + Large | Large + Clear 18px+ | Large touch targets, Clear nav | Small text, Complex nav |
| 35 | Medical Clinic | Trust & Authority + Conversion | Accessible + Minimalism | Medical Blue #0077B6 + Trust White | Professional + Readable | Online booking, Doctor profiles | Outdated interface |
| 36 | Pharmacy/Drug Store | Conversion + Trust | Flat + Accessible | Pharmacy Green + Trust Blue + White | Clear + Functional | Prescription upload flow | Privacy concerns |
| 37 | Dental Practice | Social Proof + Conversion | Soft UI + Minimalism | Fresh Blue + White + Smile Yellow | Friendly + Professional | Before/after gallery | No testimonials |
| 38 | Veterinary Clinic | Social Proof + Trust | Claymorphism + Accessible | Caring Blue + Pet colors + Warm | Friendly + Welcoming | Pet profile, Service animations | Generic design |
| 39 | News/Media Platform | Hero-Centric + Feature-Rich | Minimalism + Flat | Brand + High contrast | Clear + Readable | Breaking news badge, Article reveals | Cluttered layout, Slow loading |
| 40 | Legal Services | Trust & Authority + Minimal | Trust & Authority + Minimalism | Navy #1E3A5F + Gold + White | Professional + Authoritative | Practice area reveal | Outdated design |
| 41 | Beauty/Spa/Wellness | Hero-Centric + Social Proof | Soft UI + Neumorphism | Soft Pink/Sage/Cream + Gold | Elegant + Calming | Soft shadows, Transitions 200-300ms | Bright neon, Harsh animations |
| 42 | Service Landing Page | Hero-Centric + Trust | Minimalism + Social Proof | Brand primary + Trust colors | Professional + Clear | Testimonial carousel, CTA hover | Complex nav, Hidden contact |
| 43 | B2B Service | Feature-Rich + Trust | Trust & Authority + Minimalism | Professional blue + Neutral grey | Formal + Clear | Section transitions, Feature reveals | Playful design |
| 44 | Financial Dashboard | Data-Dense Dashboard | Dark OLED + Data-Dense | Dark bg + Red/Green alerts + Blue | Clear + Readable | Real-time numbers, Alert pulse | Light mode default, Slow rendering |
| 45 | Analytics Dashboard | Data-Dense + Drill-Down | Data-Dense + Heat Map | Cool→Hot gradients + Neutral grey | Clear + Functional | Hover tooltips, Chart zoom, Filters | Ornate design, No filtering |
| 46 | Productivity Tool | Interactive Demo + Feature-Rich | Flat + Micro-interactions | Clear hierarchy + Functional | Clean + Efficient | Quick actions 150ms, Task animations | Complex onboarding, Slow perf |
| 47 | Design System/Component Lib | Feature-Rich + Documentation | Minimalism + Accessible | Clear hierarchy + Code-like | Monospace + Clear | Code copy, Component previews | Poor docs, No live preview |
| 48 | AI/Chatbot Platform | Interactive Demo + Minimal | AI-Native UI + Minimalism | Neutral + AI Purple #6366F1 | Modern + Clear | Streaming text, Typing indicators | Heavy chrome, Slow response |
| 49 | NFT/Web3 Platform | Feature-Rich Showcase | Cyberpunk UI + Glassmorphism | Dark + Neon + Gold #FFD700 | Bold + Modern | Wallet connect, Transaction feedback | Light mode, No transaction status |
| 50 | Creator Economy | Social Proof + Feature-Rich | Vibrant Block + Bento Box | Vibrant + Brand colors | Modern + Bold | Engagement counter, Profile reveals | Generic layout |
| 51 | Sustainability/ESG | Trust & Authority + Data | Organic Biophilic + Minimalism | Green #228B22 + Earth tones | Clear + Informative | Progress indicators, Impact anim | Greenwashing, No data |
| 52 | Remote Work/Collaboration | Feature-Rich + Real-Time | Soft UI + Minimalism | Calm Blue + Neutral grey | Clean + Readable | Real-time presence, Notifications | Cluttered interface |
| 53 | Pet Tech App | Storytelling + Feature-Rich | Claymorphism + Vibrant Block | Playful + Warm colors | Friendly + Playful | Pet profile anim, Health charts | Generic, No personality |
| 54 | Smart Home/IoT Dashboard | Real-Time Monitoring | Glassmorphism + Dark OLED | Dark + Status indicator colors | Clear + Functional | Device status pulse, Quick actions | Slow updates, No automation |
| 55 | EV/Charging Ecosystem | Hero-Centric + Feature-Rich | Minimalism + Aurora UI | Electric Blue #009CD1 + Green | Modern + Clear | Range estimation, Map interactions | Poor map UX, Hidden costs |
| 56 | Subscription Box | Feature-Rich + Conversion | Vibrant Block + Motion | Brand + Excitement colors | Engaging + Clear | Unboxing reveal, Product carousel | Confusing pricing |
| 57 | Podcast Platform | Storytelling + Feature-Rich | Dark OLED + Minimalism | Dark + Audio waveform accents | Modern + Clear | Waveform viz, Episode transitions | Poor audio player |
| 58 | Dating App | Social Proof + Feature-Rich | Vibrant Block + Motion | Warm + Romantic Pink/Red gradients | Modern + Friendly | Profile card swipe, Match animations | Generic profiles, No safety |
| 59 | Micro-Credentials/Badges | Trust & Authority + Feature | Minimalism + Flat | Trust Blue + Gold #FFD700 | Professional + Clear | Badge reveal, Progress tracking | No verification |
| 60 | Knowledge Base/Docs | FAQ + Minimal | Minimalism + Accessible | Clean hierarchy + Minimal color | Clear + Readable | Search highlight, Smooth scrolling | Poor nav, No search |
| 61 | Hyperlocal Services | Conversion + Feature-Rich | Minimalism + Vibrant Block | Location markers + Trust colors | Clear + Functional | Map hover, Provider card reveals | No map, Hidden reviews |
| 62 | Luxury/Premium Brand | Storytelling + Feature-Rich | Liquid Glass + Glassmorphism | Black + Gold #FFD700 + White | Elegant + Refined | Slow parallax, Premium reveals 400-600ms | Cheap visuals |
| 63 | Fitness/Gym App | Feature-Rich + Data | Vibrant Block + Dark OLED | Energetic Orange #FF6B35 + Dark | Bold + Motivational | Progress ring, Achievement unlocks | Static, No gamification |
| 64 | Hotel/Hospitality | Hero-Centric + Social Proof | Liquid Glass + Minimalism | Warm neutrals + Gold #D4AF37 | Elegant + Welcoming | Room gallery, Amenity reveals | Poor photos, Complex booking |
| 65 | Wedding/Event Planning | Storytelling + Social Proof | Soft UI + Aurora UI | Soft Pink #FFD6E0 + Gold + Cream | Elegant + Romantic | Gallery reveals, Timeline anim | Generic templates |
| 66 | Insurance Platform | Conversion + Trust | Trust & Authority + Flat | Trust Blue #0066CC + Green + Neutral | Clear + Professional | Quote calculator, Policy comparison | Confusing pricing |
| 67 | Banking/Traditional Finance | Trust & Authority + Feature | Minimalism + Accessible | Navy #0A1628 + Trust Blue + Gold | Professional + Trustworthy | Smooth number anim, Security indicators | Playful design |
| 68 | Online Course/E-learning | Feature-Rich + Social Proof | Claymorphism + Vibrant Block | Vibrant learning + Progress green | Friendly + Engaging | Progress bar, Certificate reveals | Boring, No gamification |
| 69 | Non-profit/Charity | Storytelling + Trust | Accessible + Organic Biophilic | Cause-related + Trust + Warm | Heartfelt + Readable | Impact counter, Story reveals | No impact data |
| 70 | Florist/Plant Shop | Hero-Centric + Conversion | Organic Biophilic + Vibrant Block | Natural Green + Floral pinks | Elegant + Natural | Product reveal, Seasonal transitions | Poor imagery |
| 71 | Bakery/Cafe | Hero-Centric + Conversion | Vibrant Block + Soft UI | Warm Brown + Cream + Appetizing | Warm + Inviting | Menu hover, Order animations | Poor food photos |
| 72 | Coffee Shop | Hero-Centric + Minimal | Minimalism + Organic Biophilic | Coffee Brown #6F4E37 + Cream | Cozy + Clean | Menu transitions, Loyalty anim | No atmosphere |
| 73 | Brewery/Winery | Storytelling + Hero | Motion + Storytelling | Deep amber/burgundy + Gold + Craft | Artisanal + Heritage | Tasting note reveals, Heritage timeline | Generic, No story |
| 74 | Airline | Conversion + Feature-Rich | Minimalism + Glassmorphism | Sky Blue + Brand + Trust | Clear + Professional | Flight search anim, Boarding pass | Complex booking, Poor mobile |
| 75 | Magazine/Blog | Storytelling + Hero | Swiss Modernism 2.0 + Motion | Editorial + Brand + Clean white | Editorial + Elegant | Article transitions, Category reveals | Poor typography, Slow loading |
| 76 | Freelancer Platform | Feature-Rich + Conversion | Flat + Minimalism | Professional Blue + Success Green | Clear + Professional | Skill match anim, Review reveals | Poor profiles |
| 77 | Consulting Firm | Trust & Authority + Minimal | Trust & Authority + Minimalism | Navy + Gold + Professional grey | Authoritative + Clear | Case study reveals, Team profiles | Generic content |
| 78 | Marketing Agency | Storytelling + Feature-Rich | Brutalism + Motion | Bold brand + Creative freedom | Bold + Expressive | Portfolio reveals, Results animations | Boring design |
| 79 | Event Management | Hero-Centric + Feature-Rich | Vibrant Block + Motion | Event theme + Excitement accents | Bold + Engaging | Countdown timer, Registration flow | No countdown |
| 80 | Conference/Webinar | Feature-Rich + Conversion | Glassmorphism + Minimalism | Professional Blue + Video accent | Professional + Clear | Live stream, Agenda transitions | Poor video UX |
| 81 | Membership/Community | Social Proof + Conversion | Vibrant Block + Soft UI | Community brand + Engagement | Friendly + Engaging | Member counter, Benefit reveals | Hidden benefits |
| 82 | Newsletter Platform | Minimal + Conversion | Minimalism + Flat | Brand primary + Clean white + CTA | Clean + Readable | Subscribe form, Archive reveals | Complex signup |
| 83 | Digital Products/Downloads | Feature-Rich + Conversion | Vibrant Block + Motion | Product + Brand + Success green | Modern + Clear | Product preview, Instant delivery anim | No preview |
| 84 | Church/Religious Org | Hero-Centric + Social Proof | Accessible + Soft UI | Warm Gold + Deep Purple/Blue | Welcoming + Clear | Service time highlights, Events | Outdated design |
| 85 | Sports Team/Club | Hero-Centric + Feature-Rich | Vibrant Block + Motion | Team colors + Energetic accents | Bold + Impactful | Score animations, Schedule reveals | Static content |
| 86 | Museum/Gallery | Storytelling + Feature-Rich | Minimalism + Motion | Art-appropriate neutrals + Exhibition | Elegant + Minimal | Virtual tour, Collection reveals | Cluttered layout |
| 87 | Theater/Cinema | Hero-Centric + Conversion | Dark OLED + Motion | Dark + Spotlight accents + Gold | Dramatic + Bold | Seat selection, Trailer reveals | Poor booking UX |
| 88 | Language Learning | Feature-Rich + Social Proof | Claymorphism + Vibrant Block | Playful + Progress indicators | Friendly + Clear | Progress anim, Achievement unlocks | Boring, No motivation |
| 89 | Coding Bootcamp | Feature-Rich + Social Proof | Dark OLED + Minimalism | Code editor + Brand + Success | Technical + Clear | Terminal anim, Career outcome reveals | Light mode only |
| 90 | Cybersecurity Platform | Trust & Authority + Real-Time | Cyberpunk UI + Dark OLED | Matrix Green #00FF00 + Deep Black | Technical + Clear | Threat viz, Alert animations | Light mode |
| 91 | Developer Tool/IDE | Minimal + Documentation | Dark OLED + Minimalism | Dark syntax theme + Blue focus | Monospace + Functional | Syntax highlighting, Command palette | Light mode default, Slow perf |
| 92 | Biotech/Life Sciences | Storytelling + Data | Glassmorphism + Clean Science | Sterile White + DNA Blue + Life Green | Scientific + Clear | Data viz, Research reveals | Cluttered data |
| 93 | Space Tech/Aerospace | Immersive + Feature-Rich | Holographic/HUD + Dark Mode | Deep Space Black + Star White + Metal | Futuristic + Precise | Telemetry anim, 3D renders | Generic design |
| 94 | Architecture/Interior | Portfolio + Hero-Centric | Exaggerated Minimalism + High Imagery | Monochrome + Gold + High Imagery | Architectural + Elegant | Project gallery, Blueprint reveals | Poor imagery |
| 95 | Quantum Computing | Immersive + Interactive | Holographic/HUD + Dark Mode | Quantum Blue #00FFFF + Deep Black | Futuristic + Scientific | Probability viz, Qubit state anim | Generic tech |
| 96 | Biohacking/Longevity | Data-Dense + Storytelling | Biomimetic/Organic 2.0 + Minimal | Cellular Pink/Red + DNA Blue + White | Scientific + Clear | Biological data viz, Progress anim | No privacy |
| 97 | Autonomous Drone Fleet | Real-Time + Feature-Rich | HUD/Sci-Fi + Real-Time | Tactical Green + Alert Red + Map Dark | Technical + Functional | Telemetry anim, 3D spatial | Slow updates |
| 98 | Generative Art Platform | Showcase + Feature-Rich | Minimalism + Gen Z Chaos | Neutral #F5F5F5 + User Content | Minimal + Content-focused | Gallery masonry, Minting anim | Heavy chrome, Slow loading |
| 99 | Spatial Computing OS | Immersive + Interactive | Spatial UI (VisionOS) + Glassmorphism | Frosted Glass + System Colors + Depth | Spatial + Readable | Depth hierarchy, Gaze interactions | 2D design |
| 100 | Sustainable Energy/Climate | Data + Trust | Organic Biophilic + E-Ink/Paper | Earth Green + Sky Blue + Solar Yellow | Clear + Informative | Impact viz, Progress animations | Greenwashing |

---

## 68 UI STYLES - QUICK REFERENCE

| # | Style | Best For | Primary Colors | Key Effects | Performance |
|---|-------|----------|---------------|-------------|-------------|
| 1 | Minimalism & Swiss | Enterprise, dashboards, SaaS | Black #000, White #FFF | Subtle hover 200-250ms | ⚡ Excellent |
| 2 | Neumorphism | Wellness, meditation, fitness | Soft Blue #C8E0F4, Soft Pink #F5E0E8 | Soft box-shadow multi-layer | ⚡ Good |
| 3 | Glassmorphism | Modern SaaS, financial, lifestyle | Translucent rgba(255,255,255,0.1-0.3) | Backdrop blur 10-20px | ⚠ Good |
| 4 | Brutalism | Design portfolios, artistic, tech blogs | Red #FF0000, Blue #0000FF, Yellow #FFFF00 | No transitions, sharp corners | ⚡ Excellent |
| 5 | 3D & Hyperrealism | Gaming, product showcase, VR/AR | Deep Navy #001F3F, Gold #FFD700 | WebGL 3D, parallax 3-5 layers | ❌ Poor |
| 6 | Vibrant & Block-based | Startups, gaming, social media | Neon Green #39FF14, Electric Purple #BF00FF | Large sections 48px+ gaps | ⚡ Good |
| 7 | Dark Mode (OLED) | Night-mode, coding, entertainment | Deep Black #000000, Dark Grey #121212 | Minimal glow text-shadow | ⚡ Excellent |
| 8 | Accessible & Ethical | Government, healthcare, education | WCAG AA/AAA 4.5:1+ | Focus rings 3-4px, ARIA | ⚡ Excellent |
| 9 | Claymorphism | Educational, children's, creative | Soft Peach #FDBCB4, Baby Blue #ADD8E6 | Inner+outer shadows, soft press | ⚡ Good |
| 10 | Aurora UI | Modern SaaS, creative, music | Electric Blue #0080FF, Magenta #FF1493 | Flowing gradients 8-12s loops | ⚠ Good |
| 11 | Retro-Futurism | Gaming, entertainment, cyberpunk | Neon Blue #0080FF, Hot Pink #FF006E | CRT scanlines, neon glow, glitch | ⚠ Moderate |
| 12 | Flat Design | Web apps, mobile, startup MVPs | Solid bright: Red, Orange, Blue, Green | No shadows/gradients, 150-200ms | ⚡ Excellent |
| 13 | Skeuomorphism | Legacy, gaming, luxury, premium | Rich realistic: wood, leather, metal | Realistic shadows, textures | ❌ Poor |
| 14 | Liquid Glass | Premium SaaS, high-end e-commerce | Vibrant iridescent, translucent | Morphing SVG 400-600ms | ⚠ Moderate |
| 15 | Motion-Driven | Portfolio, storytelling, interactive | Bold + high contrast | Scroll anim, parallax, page transitions | ⚠ Good |
| 16 | Micro-interactions | Mobile apps, touchscreen, productivity | Subtle color shifts 10-20% | Small hover 50-100ms, haptic | ⚡ Excellent |
| 17 | Inclusive Design | Public services, universal | WCAG AAA 7:1+ contrast | Haptic, voice, focus 4px+, 44x44px targets | ⚡ Excellent |
| 18 | Zero Interface | Voice assistants, AI, smart home | Neutral: Soft white #FAFAFA | Voice recognition, gesture, AI | ⚡ Excellent |
| 19 | Soft UI Evolution | Modern enterprise, SaaS, wellness | Soft Blue #87CEEB, Soft Pink #FFB6C1 | Improved shadows 200-300ms | ⚡ Excellent |
| 20 | Hero-Centric | SaaS landing, product launches | Brand primary + white/light | Scroll reveal, fade-in, CTA glow | ⚡ Good |
| 21 | Conversion-Optimized | E-commerce, free trials, lead gen | High-contrast CTA + urgency | CTA hover scale, form focus anim | ⚡ Excellent |
| 22 | Feature-Rich Showcase | Enterprise SaaS, platforms | Brand + bright secondary | Card hover lift/scale, icon anim | ⚡ Good |
| 23 | Minimal & Direct | Simple services, indie, freelancer | Monochromatic + single accent | Very subtle hover, fast load | ⚡ Excellent |
| 24 | Social Proof-Focused | B2B SaaS, premium, established | Trust blue + success green | Testimonial carousel, stat count-up | ⚡ Good |
| 25 | Interactive Product Demo | SaaS, dev tools, productivity | Product UI colors + highlight | Product animation, step progression | ⚠ Good |
| 26 | Trust & Authority | Healthcare, finance, enterprise | Professional blue/grey + gold | Badge hover, metric pulse | ⚡ Excellent |
| 27 | Storytelling-Driven | Brand stories, mission-driven | Warm/emotional + varied | Section anim, scroll reveals, parallax | ⚠ Moderate |
| 28 | Data-Dense Dashboard | BI, financial analytics, enterprise | Neutral #F5F5F5 + data colors | Hover tooltips, chart zoom | ⚡ Excellent |
| 29 | Heat Map Style | Geographical, performance matrices | Cool blue→Hot red gradient | Color gradient transitions, cell hover | ⚡ Excellent |
| 30 | Executive Dashboard | C-suite, business summary | Brand + professional blue/grey | KPI count-up, trend arrow anim | ⚡ Excellent |
| 31 | Real-Time Monitoring | DevOps, stock market, live events | Alert: red/orange/green/blue | Alert pulse/glow, status blink | ⚡ Good |
| 32 | Drill-Down Analytics | Sales, funnel, multi-dimensional | Brand + breadcrumb + level colors | Expand anim, breadcrumb transitions | ⚡ Good |
| 33 | Comparative Analysis | Period-over-period, A/B tests | Blue primary + orange comparison | Bar grow anim, delta arrows | ⚡ Excellent |
| 34 | Predictive Analytics | Forecasting, anomaly detection | Forecast line + confidence shading | Forecast line draw, anomaly pulse | ⚠ Good |
| 35 | User Behavior Analytics | Funnel, user flow, retention | Stage colors: green→red | Funnel fill-down, flow diagram | ⚡ Good |
| 36 | Financial Dashboard | Revenue, P&L, budget, portfolio | Profit green + Loss red + Dark blue | Number count-up, trend indicators | ⚡ Excellent |
| 37 | Sales Intelligence | Pipeline, quota, leaderboard | Won green + Lost red + In-progress blue | Deal movement, gauge needle | ⚡ Good |
| 38 | Neubrutalism | Gen Z, startups, Figma-style | Yellow #FFEB3B, Red #FF5252, Blue #2196F3 | box-shadow: 4px 4px 0 #000 | ⚡ Excellent |
| 39 | Bento Box Grid | Dashboards, Apple-style, portfolios | Off-white #F5F5F7 + brand accent | Hover scale 1.02, soft shadows | ⚡ Excellent |
| 40 | Y2K Aesthetic | Fashion, music, Gen Z, nostalgia | Hot Pink #FF69B4, Cyan #00FFFF | Metallic gradients, glossy, 3D chrome | ⚠ Good |
| 41 | Cyberpunk UI | Gaming, crypto, sci-fi, dev tools | Matrix Green #00FF00, Magenta #FF00FF | Neon glow, glitch, scanlines | ⚠ Moderate |
| 42 | Organic Biophilic | Wellness, sustainability, eco | Forest Green #228B22, Earth Brown #8B4513 | Rounded 16-24px, organic curves | ⚡ Excellent |
| 43 | AI-Native UI | AI products, chatbots, copilots | Neutral + AI Purple #6366F1 | Typing indicator, streaming text | ⚡ Excellent |
| 44 | Memphis Design | Creative agencies, music, events | Hot Pink #FF71CE, Yellow #FFCE5C | rotate(), clip-path, blend-mode | ⚡ Excellent |
| 45 | Vaporwave | Music, gaming, creative | Pink #FF71CE, Cyan #01CDFE, Purple #B967FF | sunset gradient, glitch, VHS | ⚠ Moderate |
| 46 | Dimensional Layering | Dashboards, modals, navigation | Neutral base + brand accent | z-index stacking, elevation shadows | ⚠ Good |
| 47 | Exaggerated Minimalism | Fashion, architecture, portfolios | Black #000, White #FFF, single accent | font-size: clamp(3rem,10vw,12rem) | ⚡ Excellent |
| 48 | Kinetic Typography | Hero sections, marketing, storytelling | Flexible high contrast | Text animation, typing, morphing | ⚠ Moderate |
| 49 | Parallax Storytelling | Brand stories, product launches | Story-dependent gradients | position: fixed/sticky, scroll-driven | ❌ Poor |
| 50 | Swiss Modernism 2.0 | Corporate, editorial, SaaS | Black, White, single accent | 12-column grid, mathematical spacing | ⚡ Excellent |
| 51 | HUD / Sci-Fi FUI | Sci-fi games, cybersecurity | Neon Cyan #00FFFF, Holo Blue #0080FF | Glow, scanning, ticker text | ⚠ Moderate |
| 52 | Pixel Art | Indie games, retro, nostalgia | NES Palette primary colors | Frame-by-frame sprite, instant transitions | ⚡ Excellent |
| 53 | Bento Grids | Product features, dashboards, Apple-style | Off-white #F5F5F7, White #FFF | Hover scale 1.02, soft shadow | ⚡ Excellent |
| 55 | Spatial UI (VisionOS) | Spatial computing, VR/AR, futuristic | Frosted Glass 15-30% opacity | Parallax depth, gaze-hover, dynamic blur | ⚠ Moderate |
| 56 | E-Ink / Paper | Reading apps, journals, writing | Off-White #FDFBF7, Ink Black #1A1A1A | No animations, grain texture | ⚡ Excellent |
| 57 | Gen Z Chaos / Maximalism | Lifestyle brands, viral marketing | Clashing: #FF00FF, #00FF00, #FFFF00 | Marquee, jitter, sticker layering | ⚠ Poor |
| 58 | Biomimetic / Organic 2.0 | Biotech, health, meditation | Cellular Pink #FF9999, Chlorophyll #00FF41 | Breathing anim, fluid morphing | ⚠ Moderate |
| 59 | Anti-Polish / Raw | Creative portfolios, indie brands | Paper White #FAFAF8, Pencil Grey #4A4A4A | Hand-drawn, paper textures, jitter | ⚡ Excellent |
| 60 | Tactile / Deformable UI | Mobile apps, playful brands, gaming | Chrome Silver, Jelly Pink #FF9ECD | Press deformation, bounce-back, spring | ⚠ Good |
| 61 | Nature Distilled | Wellness, sustainable, artisan | Terracotta #C67B5C, Sand #D4C4A8 | Natural easing, grain effects | ⚡ Excellent |
| 62 | Interactive Cursor | Creative portfolios, agency sites | Brand-dependent | Cursor morph, magnetic pull, trails | ⚡ Good |
| 63 | Voice-First Multimodal | Voice assistants, hands-free, cooking | Soft White #FAFAFA, Muted Blue #6B8FAF | Waveform viz, listening pulse | ⚡ Excellent |
| 64 | 3D Product Preview | E-commerce, furniture, automotive | Neutral Soft Grey #E8E8E8 | 360° rotation, drag-to-spin, AR | ❌ Poor |
| 65 | Gradient Mesh / Aurora Evolved | Hero sections, creative, premium | Multi-stop: Cyan, Magenta, Yellow, Blue | Mesh gradients, color morphing | ⚠ Good |
| 66 | Editorial Grid / Magazine | News, blogs, magazines, publishing | Black #000, White #FFF + brand accent | Smooth scroll, reveal, parallax images | ⚡ Excellent |
| 67 | Chromatic Aberration / RGB Split | Music, gaming, tech, creative | RGB: Red #FF0000, Green #00FF00, Blue #0000FF | RGB offset, glitch, scan lines | ⚠ Good |
| 68 | Vintage Analog / Retro Film | Photography, vinyl, vintage fashion | Faded Cream #F5E6C8, Sepia #D4A574 | Film grain, VHS tracking, light leaks | ⚡ Good |

---

## UX RULES BY PRIORITY

### 1. Accessibility (CRITICAL)
- Color contrast minimum 4.5:1 ratio for normal text
- Visible focus rings (3-4px) on interactive elements
- Descriptive alt text for meaningful images
- `aria-label` for icon-only buttons
- Tab order matches visual order
- Form inputs use `<label>` with `for` attribute

### 2. Touch & Interaction (CRITICAL)
- Minimum 44x44px touch targets
- Use click/tap for primary interactions
- Disable button during async operations
- Clear error messages near the problem
- Add `cursor-pointer` to ALL clickable elements

### 3. Performance (HIGH)
- Use WebP images, srcset, lazy loading
- Check `prefers-reduced-motion`
- Reserve space for async content (no layout shift)

### 4. Layout & Responsive (HIGH)
- `viewport meta` with width=device-width, initial-scale=1
- Minimum 16px body text on mobile
- No horizontal scroll — content fits viewport width
- Define z-index scale (10, 20, 30, 50)
- Test at: 375px, 768px, 1024px, 1440px

### 5. Typography & Color (MEDIUM)
- Line-height 1.5-1.75 for body text
- Limit to 65-75 characters per line
- Match heading/body font personalities

### 6. Animation (MEDIUM)
- 150-300ms for micro-interactions
- Use transform/opacity, NOT width/height
- Skeleton screens or spinners for loading states

### 7. Style Selection (MEDIUM)
- Match style to product type
- Consistent style across ALL pages
- NO emoji icons — use SVG icons (Heroicons, Lucide)

---

## COMMON ANTI-PATTERNS (AVOID)

### Icons & Visual
| Do | Don't |
|----|-------|
| SVG icons (Heroicons, Lucide) | Emojis as UI icons (🎨 🚀 ⚙️) |
| Color/opacity transitions on hover | Scale transforms that shift layout |
| Official brand SVGs from Simple Icons | Guessed or incorrect logo paths |
| Fixed viewBox 24x24, consistent w-6 h-6 | Mixed icon sizes |

### Interaction & Cursor
| Do | Don't |
|----|-------|
| `cursor-pointer` on all clickable elements | Default cursor on interactive elements |
| Visual feedback on hover (color, shadow) | No indication element is interactive |
| `transition-colors duration-200` | Instant changes or >500ms |

### Light/Dark Mode
| Do | Don't |
|----|-------|
| Light: `bg-white/80` or higher opacity | `bg-white/10` (too transparent) |
| Text: `#0F172A` (slate-900) | Body text lighter than slate-600 |
| `border-gray-200` in light mode | `border-white/10` (invisible) |

### Layout
| Do | Don't |
|----|-------|
| Floating navbar: `top-4 left-4 right-4` | Stick navbar to `top-0 left-0 right-0` |
| Account for fixed navbar height | Content hidden behind fixed elements |
| Consistent `max-w-6xl` or `max-w-7xl` | Mixed container widths |

---

## PRE-DELIVERY CHECKLIST (Include in EVERY UI task prompt)

```
PRE-DELIVERY CHECKLIST — verify before considering UI complete:
Visual Quality:
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly, not var() wrapper
Interaction:
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Buttons disabled during async operations
Contrast & Mode:
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both light and dark
- [ ] Test both modes before delivery
Layout:
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed navbars
- [ ] Floating elements have proper spacing from edges
Accessibility:
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] prefers-reduced-motion respected
- [ ] 44x44px minimum touch targets
```
