---
name: UI UX Pro Max
description: Design intelligence for building professional UI/UX. Provides style selection, color palettes, typography, layout rules, accessibility guidelines, and 100 industry-specific reasoning rules. Use when building any frontend, UI, landing page, dashboard, or web application.
triggers: ui, ux, design, frontend, landing page, dashboard, website, web app, styling, css, colors, layout, build, create app
---
# UI/UX Pro Max - Design Intelligence

Comprehensive design guide with 68 UI styles, 100 industry reasoning rules, 96 color palettes, 57 font pairings, 30 landing page patterns, 100 icon imports, UX guidelines, and pre-delivery checklist.
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

## 96 COLOR PALETTES BY PRODUCT TYPE

Exact hex codes: Primary, Secondary, CTA, Background, Text, Border per industry.

| # | Product Type | Primary | Secondary | CTA | Background | Text | Border | Notes |
|---|-------------|---------|-----------|-----|------------|------|--------|-------|
| 1 | SaaS (General) | #2563EB | #3B82F6 | #F97316 | #F8FAFC | #1E293B | #E2E8F0 | Trust blue + orange CTA |
| 2 | Micro SaaS | #6366F1 | #818CF8 | #10B981 | #F5F3FF | #1E1B4B | #E0E7FF | Indigo + emerald CTA |
| 3 | E-commerce | #059669 | #10B981 | #F97316 | #ECFDF5 | #064E3B | #A7F3D0 | Success green + urgency orange |
| 4 | E-commerce Luxury | #1C1917 | #44403C | #CA8A04 | #FAFAF9 | #0C0A09 | #D6D3D1 | Premium dark + gold |
| 5 | Service Landing | #0EA5E9 | #38BDF8 | #F97316 | #F0F9FF | #0C4A6E | #BAE6FD | Sky blue + warm CTA |
| 6 | B2B Service | #0F172A | #334155 | #0369A1 | #F8FAFC | #020617 | #E2E8F0 | Professional navy |
| 7 | Financial Dashboard | #0F172A | #1E293B | #22C55E | #020617 | #F8FAFC | #334155 | Dark + green indicators |
| 8 | Analytics Dashboard | #1E40AF | #3B82F6 | #F59E0B | #F8FAFC | #1E3A8A | #DBEAFE | Blue + amber highlights |
| 9 | Healthcare App | #0891B2 | #22D3EE | #059669 | #ECFEFF | #164E63 | #A5F3FC | Calm cyan + health green |
| 10 | Educational App | #4F46E5 | #818CF8 | #F97316 | #EEF2FF | #1E1B4B | #C7D2FE | Playful indigo + orange |
| 11 | Creative Agency | #EC4899 | #F472B6 | #06B6D4 | #FDF2F8 | #831843 | #FBCFE8 | Bold pink + cyan |
| 12 | Portfolio/Personal | #18181B | #3F3F46 | #2563EB | #FAFAFA | #09090B | #E4E4E7 | Mono + blue accent |
| 13 | Gaming | #7C3AED | #A78BFA | #F43F5E | #0F0F23 | #E2E8F0 | #4C1D95 | Neon purple + rose |
| 14 | Government/Public | #0F172A | #334155 | #0369A1 | #F8FAFC | #020617 | #E2E8F0 | High contrast navy |
| 15 | Fintech/Crypto | #F59E0B | #FBBF24 | #8B5CF6 | #0F172A | #F8FAFC | #334155 | Gold + purple tech |
| 16 | Social Media | #E11D48 | #FB7185 | #2563EB | #FFF1F2 | #881337 | #FECDD3 | Rose + blue |
| 17 | Productivity Tool | #0D9488 | #14B8A6 | #F97316 | #F0FDFA | #134E4A | #99F6E4 | Teal + action orange |
| 18 | Design System | #4F46E5 | #6366F1 | #F97316 | #EEF2FF | #312E81 | #C7D2FE | Indigo + doc hierarchy |
| 19 | AI/Chatbot | #7C3AED | #A78BFA | #06B6D4 | #FAF5FF | #1E1B4B | #DDD6FE | AI purple + cyan |
| 20 | NFT/Web3 | #8B5CF6 | #A78BFA | #FBBF24 | #0F0F23 | #F8FAFC | #4C1D95 | Purple + gold |
| 21 | Creator Economy | #EC4899 | #F472B6 | #F97316 | #FDF2F8 | #831843 | #FBCFE8 | Pink + orange |
| 22 | Sustainability/ESG | #059669 | #10B981 | #0891B2 | #ECFDF5 | #064E3B | #A7F3D0 | Nature green + ocean |
| 23 | Remote Work | #6366F1 | #818CF8 | #10B981 | #F5F3FF | #312E81 | #E0E7FF | Calm indigo + green |
| 24 | Mental Health | #8B5CF6 | #C4B5FD | #10B981 | #FAF5FF | #4C1D95 | #EDE9FE | Calming lavender |
| 25 | Pet Tech | #F97316 | #FB923C | #2563EB | #FFF7ED | #9A3412 | #FED7AA | Playful orange |
| 26 | Smart Home/IoT | #1E293B | #334155 | #22C55E | #0F172A | #F8FAFC | #475569 | Dark tech + green |
| 27 | EV/Charging | #0891B2 | #22D3EE | #22C55E | #ECFEFF | #164E63 | #A5F3FC | Electric cyan |
| 28 | Subscription Box | #D946EF | #E879F9 | #F97316 | #FDF4FF | #86198F | #F5D0FE | Excitement purple |
| 29 | Podcast | #1E1B4B | #312E81 | #F97316 | #0F0F23 | #F8FAFC | #4338CA | Dark audio |
| 30 | Dating App | #E11D48 | #FB7185 | #F97316 | #FFF1F2 | #881337 | #FECDD3 | Romantic rose |
| 31 | Micro-Credentials | #0369A1 | #0EA5E9 | #CA8A04 | #F0F9FF | #0C4A6E | #BAE6FD | Trust blue + gold |
| 32 | Knowledge Base | #475569 | #64748B | #2563EB | #F8FAFC | #1E293B | #E2E8F0 | Neutral grey |
| 33 | Hyperlocal Services | #059669 | #10B981 | #F97316 | #ECFDF5 | #064E3B | #A7F3D0 | Location green |
| 34 | Beauty/Spa | #EC4899 | #F9A8D4 | #8B5CF6 | #FDF2F8 | #831843 | #FBCFE8 | Soft pink + lavender |
| 35 | Luxury/Premium | #1C1917 | #44403C | #CA8A04 | #FAFAF9 | #0C0A09 | #D6D3D1 | Black + gold |
| 36 | Restaurant/Food | #DC2626 | #F87171 | #CA8A04 | #FEF2F2 | #450A0A | #FECACA | Red + warm gold |
| 37 | Fitness/Gym | #F97316 | #FB923C | #22C55E | #1F2937 | #F8FAFC | #374151 | Energy orange + green |
| 38 | Real Estate | #0F766E | #14B8A6 | #0369A1 | #F0FDFA | #134E4A | #99F6E4 | Trust teal + blue |
| 39 | Travel/Tourism | #0EA5E9 | #38BDF8 | #F97316 | #F0F9FF | #0C4A6E | #BAE6FD | Sky blue + adventure |
| 40 | Hotel/Hospitality | #1E3A8A | #3B82F6 | #CA8A04 | #F8FAFC | #1E40AF | #BFDBFE | Luxury navy + gold |
| 41 | Wedding/Event | #DB2777 | #F472B6 | #CA8A04 | #FDF2F8 | #831843 | #FBCFE8 | Romantic pink + gold |
| 42 | Legal Services | #1E3A8A | #1E40AF | #B45309 | #F8FAFC | #0F172A | #CBD5E1 | Authority navy |
| 43 | Insurance | #0369A1 | #0EA5E9 | #22C55E | #F0F9FF | #0C4A6E | #BAE6FD | Security blue + green |
| 44 | Banking | #0F172A | #1E3A8A | #CA8A04 | #F8FAFC | #020617 | #E2E8F0 | Trust navy + gold |
| 45 | Online Course | #0D9488 | #2DD4BF | #F97316 | #F0FDFA | #134E4A | #5EEAD4 | Progress teal |
| 46 | Non-profit | #0891B2 | #22D3EE | #F97316 | #ECFEFF | #164E63 | #A5F3FC | Compassion blue |
| 47 | Music Streaming | #1E1B4B | #4338CA | #22C55E | #0F0F23 | #F8FAFC | #312E81 | Dark audio + green |
| 48 | Video Streaming | #0F0F23 | #1E1B4B | #E11D48 | #000000 | #F8FAFC | #312E81 | Cinema dark + red |
| 49 | Job Board | #0369A1 | #0EA5E9 | #22C55E | #F0F9FF | #0C4A6E | #BAE6FD | Professional blue |
| 50 | Marketplace (P2P) | #7C3AED | #A78BFA | #22C55E | #FAF5FF | #4C1D95 | #DDD6FE | Trust purple + green |
| 51 | Logistics/Delivery | #2563EB | #3B82F6 | #F97316 | #EFF6FF | #1E40AF | #BFDBFE | Tracking blue + orange |
| 52 | Agriculture | #15803D | #22C55E | #CA8A04 | #F0FDF4 | #14532D | #BBF7D0 | Earth green + gold |
| 53 | Construction | #64748B | #94A3B8 | #F97316 | #F8FAFC | #334155 | #E2E8F0 | Industrial grey |
| 54 | Automotive | #1E293B | #334155 | #DC2626 | #F8FAFC | #0F172A | #E2E8F0 | Premium dark + red |
| 55 | Photography | #18181B | #27272A | #F8FAFC | #000000 | #FAFAFA | #3F3F46 | Pure black + white |
| 56 | Coworking | #F59E0B | #FBBF24 | #2563EB | #FFFBEB | #78350F | #FDE68A | Amber + booking blue |
| 57 | Cleaning Service | #0891B2 | #22D3EE | #22C55E | #ECFEFF | #164E63 | #A5F3FC | Fresh cyan + clean |
| 58 | Home Services | #1E40AF | #3B82F6 | #F97316 | #EFF6FF | #1E3A8A | #BFDBFE | Professional blue |
| 59 | Childcare | #F472B6 | #FBCFE8 | #22C55E | #FDF2F8 | #9D174D | #FCE7F3 | Soft pink + safe green |
| 60 | Senior Care | #0369A1 | #38BDF8 | #22C55E | #F0F9FF | #0C4A6E | #E0F2FE | Calm blue + reassuring |
| 61 | Medical Clinic | #0891B2 | #22D3EE | #22C55E | #F0FDFA | #134E4A | #CCFBF1 | Medical teal |
| 62 | Pharmacy | #15803D | #22C55E | #0369A1 | #F0FDF4 | #14532D | #BBF7D0 | Pharmacy green |
| 63 | Dental Practice | #0EA5E9 | #38BDF8 | #FBBF24 | #F0F9FF | #0C4A6E | #BAE6FD | Fresh blue + yellow |
| 64 | Veterinary | #0D9488 | #14B8A6 | #F97316 | #F0FDFA | #134E4A | #99F6E4 | Caring teal |
| 65 | Florist/Plants | #15803D | #22C55E | #EC4899 | #F0FDF4 | #14532D | #BBF7D0 | Green + floral pink |
| 66 | Bakery/Cafe | #92400E | #B45309 | #F8FAFC | #FEF3C7 | #78350F | #FDE68A | Warm brown + cream |
| 67 | Coffee Shop | #78350F | #92400E | #FBBF24 | #FEF3C7 | #451A03 | #FDE68A | Coffee brown + gold |
| 68 | Brewery/Winery | #7C2D12 | #B91C1C | #CA8A04 | #FEF2F2 | #450A0A | #FECACA | Burgundy + craft gold |
| 69 | Airline | #1E3A8A | #3B82F6 | #F97316 | #EFF6FF | #1E40AF | #BFDBFE | Sky blue + booking |
| 70 | News/Media | #DC2626 | #EF4444 | #1E40AF | #FEF2F2 | #450A0A | #FECACA | Breaking red + blue |
| 71 | Magazine/Blog | #18181B | #3F3F46 | #EC4899 | #FAFAFA | #09090B | #E4E4E7 | Editorial black + pink |
| 72 | Freelancer | #6366F1 | #818CF8 | #22C55E | #EEF2FF | #312E81 | #C7D2FE | Creative indigo |
| 73 | Consulting | #0F172A | #334155 | #CA8A04 | #F8FAFC | #020617 | #E2E8F0 | Authority navy + gold |
| 74 | Marketing Agency | #EC4899 | #F472B6 | #06B6D4 | #FDF2F8 | #831843 | #FBCFE8 | Bold pink + cyan |
| 75 | Event Management | #7C3AED | #A78BFA | #F97316 | #FAF5FF | #4C1D95 | #DDD6FE | Excitement purple |
| 76 | Conference | #1E40AF | #3B82F6 | #22C55E | #EFF6FF | #1E3A8A | #BFDBFE | Professional blue |
| 77 | Membership/Community | #7C3AED | #A78BFA | #22C55E | #FAF5FF | #4C1D95 | #DDD6FE | Community purple |
| 78 | Newsletter | #0369A1 | #0EA5E9 | #F97316 | #F0F9FF | #0C4A6E | #BAE6FD | Trust blue + subscribe |
| 79 | Digital Products | #6366F1 | #818CF8 | #22C55E | #EEF2FF | #312E81 | #C7D2FE | Digital indigo |
| 80 | Church/Religious | #7C3AED | #A78BFA | #CA8A04 | #FAF5FF | #4C1D95 | #DDD6FE | Spiritual purple + gold |
| 81 | Sports Team | #DC2626 | #EF4444 | #FBBF24 | #FEF2F2 | #7F1D1D | #FECACA | Team red + gold |
| 82 | Museum/Gallery | #18181B | #27272A | #F8FAFC | #FAFAFA | #09090B | #E4E4E7 | Gallery black + white |
| 83 | Theater/Cinema | #1E1B4B | #312E81 | #CA8A04 | #0F0F23 | #F8FAFC | #4338CA | Dark + spotlight gold |
| 84 | Language Learning | #4F46E5 | #818CF8 | #22C55E | #EEF2FF | #312E81 | #C7D2FE | Learning indigo |
| 85 | Coding Bootcamp | #0F172A | #1E293B | #22C55E | #020617 | #F8FAFC | #334155 | Terminal dark + green |
| 86 | Cybersecurity | #00FF41 | #0D0D0D | #FF3333 | #000000 | #E0E0E0 | #1F1F1F | Matrix green + red |
| 87 | Developer Tool | #1E293B | #334155 | #22C55E | #0F172A | #F8FAFC | #475569 | Code dark + green |
| 88 | Biotech | #0EA5E9 | #0284C7 | #10B981 | #F0F9FF | #0C4A6E | #BAE6FD | DNA blue + life green |
| 89 | Space Tech | #F8FAFC | #94A3B8 | #3B82F6 | #0B0B10 | #F8FAFC | #1E293B | Star white + launch blue |
| 90 | Architecture | #171717 | #404040 | #D4AF37 | #FFFFFF | #171717 | #E5E5E5 | Minimal black + gold |
| 91 | Quantum Computing | #00FFFF | #7B61FF | #FF00FF | #050510 | #E0E0FF | #333344 | Quantum cyan + purple |
| 92 | Biohacking | #FF4D4D | #4D94FF | #00E676 | #F5F5F7 | #1C1C1E | #E5E5EA | Bio red/blue + green |
| 93 | Autonomous Systems | #00FF41 | #008F11 | #FF3333 | #0D1117 | #E6EDF3 | #30363D | Terminal green + red |
| 94 | Generative AI Art | #18181B | #3F3F46 | #EC4899 | #FAFAFA | #09090B | #E4E4E7 | Canvas neutral + pink |
| 95 | Spatial/VisionOS | #FFFFFF | #E5E5E5 | #007AFF | #888888 | #000000 | #CCCCCC | Glass white + system blue |
| 96 | Climate Tech | #059669 | #10B981 | #FBBF24 | #ECFDF5 | #064E3B | #A7F3D0 | Nature green + solar gold |

---

## 57 TYPOGRAPHY PAIRINGS

Font pairings with Google Fonts URLs and CSS imports, organized by mood/industry.

| # | Name | Category | Heading | Body | Best For | CSS Import |
|---|------|----------|---------|------|----------|------------|
| 1 | Classic Elegant | Serif+Sans | Playfair Display | Inter | Luxury, fashion, spa, editorial | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap')` |
| 2 | Modern Professional | Sans+Sans | Poppins | Open Sans | SaaS, corporate, startups | `@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap')` |
| 3 | Tech Startup | Sans+Sans | Space Grotesk | DM Sans | Tech, SaaS, developer tools, AI | `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap')` |
| 4 | Editorial Classic | Serif+Serif | Cormorant Garamond | Libre Baskerville | Publishing, blogs, news, literary | `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap')` |
| 5 | Minimal Swiss | Sans+Sans | Inter | Inter | Dashboards, admin, documentation | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap')` |
| 6 | Playful Creative | Display+Sans | Fredoka | Nunito | Children's, educational, gaming | `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap')` |
| 7 | Bold Statement | Display+Sans | Bebas Neue | Source Sans 3 | Marketing, portfolios, agencies, sports | `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@300;400;500;600;700&display=swap')` |
| 8 | Wellness Calm | Serif+Sans | Lora | Raleway | Health, wellness, spa, meditation | `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap')` |
| 9 | Developer Mono | Mono+Sans | JetBrains Mono | IBM Plex Sans | Dev tools, code editors, tech blogs | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap')` |
| 10 | Retro Vintage | Display+Serif | Abril Fatface | Merriweather | Vintage brands, breweries, restaurants | `@import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Merriweather:wght@300;400;700&display=swap')` |
| 11 | Geometric Modern | Sans+Sans | Outfit | Work Sans | Portfolios, agencies, modern brands | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap')` |
| 12 | Luxury Serif | Serif+Sans | Cormorant | Montserrat | Fashion, luxury, jewelry | `@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap')` |
| 13 | Friendly SaaS | Sans+Sans | Plus Jakarta Sans | Plus Jakarta Sans | SaaS, web apps, dashboards, B2B | `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap')` |
| 14 | News Editorial | Serif+Sans | Newsreader | Roboto | News sites, blogs, journalism | `@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap')` |
| 15 | Handwritten Charm | Script+Sans | Caveat | Quicksand | Personal blogs, invitations, lifestyle | `@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap')` |
| 16 | Corporate Trust | Sans+Sans | Lexend | Source Sans 3 | Enterprise, government, healthcare | `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap')` |
| 17 | Brutalist Raw | Mono+Mono | Space Mono | Space Mono | Brutalist, developer portfolios | `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap')` |
| 18 | Fashion Forward | Sans+Sans | Syne | Manrope | Fashion, creative agencies, galleries | `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700&display=swap')` |
| 19 | Soft Rounded | Sans+Sans | Varela Round | Nunito Sans | Children's, pet apps, wellness | `@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap')` |
| 20 | Premium Sans | Sans+Sans | DM Sans | DM Sans | Premium brands, agencies, startups | `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap')` |
| 21 | Vietnamese | Sans+Sans | Be Vietnam Pro | Noto Sans | Vietnamese sites, multilingual | `@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap')` |
| 22 | Japanese | Serif+Sans | Noto Serif JP | Noto Sans JP | Japanese sites, cultural content | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@400;500;600;700&display=swap')` |
| 23 | Korean | Sans+Sans | Noto Sans KR | Noto Sans KR | Korean sites, K-beauty, K-pop | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap')` |
| 24 | Chinese Traditional | Serif+Sans | Noto Serif TC | Noto Sans TC | Taiwan/HK markets | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap')` |
| 25 | Chinese Simplified | Sans+Sans | Noto Sans SC | Noto Sans SC | Mainland China | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap')` |
| 26 | Arabic | Serif+Sans | Noto Naskh Arabic | Noto Sans Arabic | Arabic/Middle East (RTL) | `@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;700&display=swap')` |
| 27 | Thai | Sans+Sans | Noto Sans Thai | Noto Sans Thai | Thai sites, SE Asia | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;700&display=swap')` |
| 28 | Hebrew | Sans+Sans | Noto Sans Hebrew | Noto Sans Hebrew | Hebrew/Israeli (RTL) | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;700&display=swap')` |
| 29 | Legal Professional | Serif+Sans | EB Garamond | Lato | Law firms, contracts, government | `@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap')` |
| 30 | Medical Clean | Sans+Sans | Figtree | Noto Sans | Healthcare, pharma, clinics | `@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&display=swap')` |
| 31 | Financial Trust | Sans+Sans | IBM Plex Sans | IBM Plex Sans | Banks, finance, insurance | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap')` |
| 32 | Real Estate Luxury | Serif+Sans | Cinzel | Josefin Sans | Real estate, architecture, luxury | `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&display=swap')` |
| 33 | Restaurant Menu | Serif+Sans | Playfair Display SC | Karla | Restaurants, cafes, hospitality | `@import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&display=swap')` |
| 34 | Art Deco | Display+Sans | Poiret One | Didact Gothic | Vintage events, 1920s themes | `@import url('https://fonts.googleapis.com/css2?family=Didact+Gothic&family=Poiret+One&display=swap')` |
| 35 | Magazine Style | Serif+Sans | Libre Bodoni | Public Sans | Magazines, editorial, journalism | `@import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600;700&display=swap')` |
| 36 | Crypto/Web3 | Sans+Sans | Orbitron | Exo 2 | Crypto, NFT, blockchain, web3 | `@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap')` |
| 37 | Gaming Bold | Display+Sans | Russo One | Chakra Petch | Gaming, esports, action | `@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Russo+One&display=swap')` |
| 38 | Indie/Craft | Display+Sans | Amatic SC | Cabin | Craft brands, artisan, organic | `@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Cabin:wght@400;500;600;700&display=swap')` |
| 39 | Startup Bold | Sans+Sans | Outfit | Rubik | Startups, pitch decks, launches | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap')` |
| 40 | E-commerce Clean | Sans+Sans | Rubik | Nunito Sans | E-commerce, online stores, retail | `@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap')` |
| 41 | Academic/Research | Serif+Sans | Crimson Pro | Atkinson Hyperlegible | Universities, research, academic | `@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Crimson+Pro:wght@400;500;600;700&display=swap')` |
| 42 | Dashboard Data | Mono+Sans | Fira Code | Fira Sans | Dashboards, analytics, admin | `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap')` |
| 43 | Music/Entertainment | Display+Sans | Righteous | Poppins | Music, entertainment, festivals | `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Righteous&display=swap')` |
| 44 | Minimalist Portfolio | Sans+Sans | Space Grotesk | Archivo | Design portfolios, creatives | `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap')` |
| 45 | Kids/Education | Display+Sans | Baloo 2 | Comic Neue | Children's apps, educational games | `@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Comic+Neue:wght@300;400;700&display=swap')` |
| 46 | Wedding/Romance | Script+Serif | Great Vibes | Cormorant Infant | Weddings, invitations, bridal | `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Infant:wght@300;400;500;600;700&family=Great+Vibes&display=swap')` |
| 47 | Science/Tech | Sans+Mono | Exo | Roboto Mono | Science, research, data-heavy | `@import url('https://fonts.googleapis.com/css2?family=Exo:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500;700&display=swap')` |
| 48 | Accessibility First | Sans+Sans | Atkinson Hyperlegible | Atkinson Hyperlegible | Government, healthcare, inclusive | `@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap')` |
| 49 | Sports/Fitness | Sans+Sans | Barlow Condensed | Barlow | Sports, fitness, athletic | `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap')` |
| 50 | Luxury Minimalist | Serif+Sans | Bodoni Moda | Jost | Luxury minimalist, high-end fashion | `@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap')` |
| 51 | Tech/HUD Mono | Mono+Mono | Share Tech Mono | Fira Code | Sci-fi UI, cybersecurity, dashboards | `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap')` |
| 52 | Pixel Retro | Display+Sans | Press Start 2P | VT323 | Pixel art games, retro websites | `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap')` |
| 53 | Neubrutalist Bold | Display+Sans | Lexend Mega | Public Sans | Gen Z brands, bold marketing | `@import url('https://fonts.googleapis.com/css2?family=Lexend+Mega:wght@100..900&family=Public+Sans:wght@100..900&display=swap')` |
| 54 | Spatial Clear | Sans+Sans | Inter | Inter | Spatial computing, AR/VR, glass UI | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap')` |
| 55 | Kinetic Motion | Display+Mono | Syncopate | Space Mono | Music festivals, automotive | `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syncopate:wght@400;700&display=swap')` |
| 56 | Gen Z Brutal | Display+Sans | Anton | Epilogue | Gen Z marketing, streetwear | `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Epilogue:wght@400;500;600;700&display=swap')` |
| 57 | Academic/Archival | Serif+Serif | EB Garamond | Crimson Text | University, archives, research | `@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=EB+Garamond:wght@400;500;600;700;800&display=swap')` |

---

## 30 LANDING PAGE PATTERNS

Section-by-section blueprints for landing pages. Match with reasoning rules.

| # | Pattern | Section Order | CTA Placement | Key Effects | Conversion Tips |
|---|---------|--------------|---------------|-------------|-----------------|
| 1 | Hero + Features + CTA | Hero → Value prop → Features (3-5) → CTA → Footer | Hero (sticky) + Bottom | Parallax, card hover lift, CTA glow | Deep CTA, contrasting color 7:1, sticky navbar CTA |
| 2 | Hero + Testimonials | Hero → Problem → Solution → Testimonials → CTA | Hero (sticky) + Post-testimonials | Carousel slide, quote marks, avatar fade | Social proof before CTA, 3-5 testimonials with photo+name |
| 3 | Product Demo + Features | Hero → Video/mockup → Feature breakdown → Comparison → CTA | Video center + Bottom | Play button pulse, scroll reveals, demo highlights | Embedded demo increases engagement, auto-play muted |
| 4 | Minimal Single Column | Hero headline → Description → Benefits (3 max) → CTA → Footer | Center large CTA | Minimal hover, smooth scroll, CTA scale | Single CTA focus, large typography, lots of whitespace |
| 5 | Funnel (3-Step) | Hero → Step 1 (problem) → Step 2 (solution) → Step 3 (action) → CTA | Each step mini-CTA + Final main CTA | Step number anim, progress bar, smooth scroll | Progressive disclosure, show only essential per step |
| 6 | Comparison Table | Hero → Problem → Comparison table → Pricing → CTA | Table right column + Below table | Row hover highlight, price toggle, checkmark anim | Highlight your product row, include free trial |
| 7 | Lead Magnet + Form | Hero (benefit) → Lead magnet preview → Form (≤3 fields) → CTA submit | Form submit button | Form focus anim, validation anim, success confetti | ≤3 fields for best conversion, show preview |
| 8 | Pricing Page | Hero → Price cards → Feature comparison → FAQ → Final CTA | Each card + Sticky nav + Bottom | Toggle monthly/yearly, card hover, accordion | Recommend mid-tier, annual discount 20-30% |
| 9 | Video-First Hero | Hero with video bg → Features overlay → Benefits → CTA | Overlay on video + Bottom | Video autoplay muted, parallax, text fade-in | 86% higher engagement, add captions, compress |
| 10 | Scroll Storytelling | Intro hook → Chapter 1 (problem) → Chapter 2 (journey) → Chapter 3 (solution) → CTA | End of chapters + Final climax | ScrollTrigger, parallax layers, progressive disclosure | 3x time-on-page, progress indicator, simplify mobile |
| 11 | AI Personalization | Dynamic hero → Relevant features → Tailored testimonials → Smart CTA | Context-aware placement | Dynamic content swap, fade transitions | 20%+ conversion, requires analytics, fallback for new users |
| 12 | Waitlist/Coming Soon | Hero + countdown → Product teaser → Email capture → Social proof (count) | Email form prominent + Sticky | Countdown timer, email validation, confetti | Scarcity + exclusivity, show waitlist count |
| 13 | Comparison Focus | Hero (problem) → Comparison matrix → Feature deep-dive → Winner CTA | After comparison + Bottom | Row hover, checkmark anim, sticky header | 35% higher conversion, be factual |
| 14 | Pricing-Focused | Hero (value prop) → Pricing cards (3 tiers) → Features → FAQ → CTA | Each card + Sticky nav + Bottom | Price toggle, card hover, FAQ accordion | Annual discount, popular badge on mid-tier |
| 15 | App Store Style | Hero + device mockup → Screenshots → Features → Reviews → Download CTAs | Download buttons throughout | Device rotation, screenshot slider, star rating | Real screenshots, 4.5+ stars, QR code |
| 16 | FAQ/Documentation | Hero + search bar → Categories → FAQ accordion → Contact CTA | Search bar + Contact for unresolved | Search autocomplete, accordion, helpful feedback | Reduce support tickets, track search analytics |
| 17 | Immersive/Interactive | Full-screen interactive → Guided tour → Benefits → CTA after completion | After interaction + Skip option | WebGL, 3D, gamification, progress, reward anim | 40% higher engagement, provide skip, mobile fallback |
| 18 | Event/Conference | Hero (date/location/countdown) → Speakers → Agenda → Sponsors → Register | Register sticky + After speakers + Bottom | Countdown, speaker hover cards, early bird | Early bird pricing, social proof, speaker credibility |
| 19 | Product Reviews | Hero (product + rating) → Rating breakdown → Reviews → Buy CTA | After reviews + Buy alongside | Star fill anim, review filter, photo lightbox | User-generated content, verified purchases, respond to negative |
| 20 | Community/Forum | Hero (value prop) → Popular topics → Active members → Join CTA | Join button + After members | Avatars anim, activity feed, topic previews | Show active community, preview content, easy onboarding |
| 21 | Before-After | Hero (problem) → Transformation slider → How it works → Results CTA | After transformation + Bottom | Slider comparison, before/after reveal, counters | Visual proof, 45% higher conversion, real results |
| 22 | Marketplace/Directory | Hero (search) → Categories → Featured listings → Trust → CTA | Hero search bar + Navbar list | Search autocomplete, map hover, card carousel | Search bar IS the CTA, reduce friction |
| 23 | Newsletter/Content | Hero (value + form) → Recent issues → Social proof → About author | Hero inline form + Sticky header | Text highlight, typewriter, subtle fade | Single field email, show "Join X,000 readers" |
| 24 | Webinar Registration | Hero (topic + timer + form) → What you'll learn → Speaker → Urgency → Form | Hero right form + Bottom anchor | Countdown, speaker float, urgent ticker | Limited seats, "Live" indicator, auto-timezone |
| 25 | Enterprise Gateway | Hero (video/mission) → Solutions by Industry → By Role → Logos → Contact | Contact Sales + Login secondary | Slow video bg, logo carousel, tab switching | Path selection "I am a...", mega menu, trust signals |
| 26 | Portfolio Grid | Hero (name/role) → Project grid (masonry) → About → Contact | Project card hover + Footer contact | Image lazy reveal, hover overlay, lightbox | Visuals first, filter by category, fast loading |
| 27 | Horizontal Scroll | Intro (vertical) → Journey (horizontal track) → Detail → Vertical footer | Floating sticky or end of track | Scroll-jacking, parallax, progress indicator | Immersive discovery, keep nav visible |
| 28 | Bento Grid Showcase | Hero → Bento grid features → Detail cards → Tech specs → CTA | Floating action or bottom of grid | Hover scale 1.02, video in cards, tilt, staggered | Scannable value props, high density, mobile stack |
| 29 | 3D Configurator | Hero (configurator) → Features (synced) → Price/specs → Purchase | Inside configurator + Sticky bottom | Real-time render, material swap, rotate/zoom | Ownership feeling, 360 view, direct add-to-cart |
| 30 | AI Dynamic Landing | Prompt/input hero → Generated result → How it works → Value prop | Input field hero + "Try it" | Typing effects, shimmer loaders, morphing | Immediate value, "show don't tell", low friction |

---

## 100 LUCIDE ICON REFERENCE

Standard icon set for consistent UI. Use Lucide React or Lucide SVG.

### Navigation
| Icon | Import | Usage |
|------|--------|-------|
| Menu | `import { Menu } from 'lucide-react'` | Mobile nav toggle |
| ArrowLeft | `import { ArrowLeft } from 'lucide-react'` | Back button |
| ArrowRight | `import { ArrowRight } from 'lucide-react'` | Forward / Next / CTA |
| ChevronDown | `import { ChevronDown } from 'lucide-react'` | Dropdown / Accordion |
| ChevronUp | `import { ChevronUp } from 'lucide-react'` | Collapse / Minimize |
| Home | `import { Home } from 'lucide-react'` | Home page |
| X | `import { X } from 'lucide-react'` | Close / Dismiss |
| ExternalLink | `import { ExternalLink } from 'lucide-react'` | External link |

### Actions
| Icon | Import | Usage |
|------|--------|-------|
| Plus | `import { Plus } from 'lucide-react'` | Add / Create new |
| Minus | `import { Minus } from 'lucide-react'` | Remove / Decrease |
| Trash2 | `import { Trash2 } from 'lucide-react'` | Delete (destructive) |
| Edit | `import { Edit } from 'lucide-react'` | Edit / Modify |
| Save | `import { Save } from 'lucide-react'` | Save / Persist |
| Download | `import { Download } from 'lucide-react'` | Download / Export |
| Upload | `import { Upload } from 'lucide-react'` | Upload / Import |
| Copy | `import { Copy } from 'lucide-react'` | Copy to clipboard |
| Share | `import { Share } from 'lucide-react'` | Share / Social |
| Search | `import { Search } from 'lucide-react'` | Search / Find |
| Filter | `import { Filter } from 'lucide-react'` | Filter / Sort |
| Settings | `import { Settings } from 'lucide-react'` | Settings / Config |

### Status
| Icon | Import | Usage |
|------|--------|-------|
| Check | `import { Check } from 'lucide-react'` | Success / Done |
| CheckCircle | `import { CheckCircle } from 'lucide-react'` | Verified / Approved |
| XCircle | `import { XCircle } from 'lucide-react'` | Error / Failed |
| AlertTriangle | `import { AlertTriangle } from 'lucide-react'` | Warning / Caution |
| AlertCircle | `import { AlertCircle } from 'lucide-react'` | Info / Notice |
| Info | `import { Info } from 'lucide-react'` | Tooltip / Help |
| Loader | `import { Loader } from 'lucide-react'` | Loading (add `className="animate-spin"`) |
| Clock | `import { Clock } from 'lucide-react'` | Time / Pending |

### Communication
| Icon | Import | Usage |
|------|--------|-------|
| Mail | `import { Mail } from 'lucide-react'` | Email / Contact |
| MessageCircle | `import { MessageCircle } from 'lucide-react'` | Chat / Comment |
| Phone | `import { Phone } from 'lucide-react'` | Phone / Call |
| Send | `import { Send } from 'lucide-react'` | Send / Submit |
| Bell | `import { Bell } from 'lucide-react'` | Notification |

### User
| Icon | Import | Usage |
|------|--------|-------|
| User | `import { User } from 'lucide-react'` | Profile / Account |
| Users | `import { Users } from 'lucide-react'` | Team / Group |
| UserPlus | `import { UserPlus } from 'lucide-react'` | Add user / Invite |
| LogIn | `import { LogIn } from 'lucide-react'` | Login |
| LogOut | `import { LogOut } from 'lucide-react'` | Logout |

### Media
| Icon | Import | Usage |
|------|--------|-------|
| Image | `import { Image } from 'lucide-react'` | Photo / Gallery |
| Video | `import { Video } from 'lucide-react'` | Video / Film |
| Play | `import { Play } from 'lucide-react'` | Play button |
| Pause | `import { Pause } from 'lucide-react'` | Pause button |
| Volume2 | `import { Volume2 } from 'lucide-react'` | Audio / Sound |
| Mic | `import { Mic } from 'lucide-react'` | Microphone |
| Camera | `import { Camera } from 'lucide-react'` | Photo capture |

### Commerce
| Icon | Import | Usage |
|------|--------|-------|
| ShoppingCart | `import { ShoppingCart } from 'lucide-react'` | Cart / Checkout |
| ShoppingBag | `import { ShoppingBag } from 'lucide-react'` | Purchase / Bag |
| CreditCard | `import { CreditCard } from 'lucide-react'` | Payment |
| DollarSign | `import { DollarSign } from 'lucide-react'` | Price / Currency |
| Tag | `import { Tag } from 'lucide-react'` | Price tag / Label |
| Gift | `import { Gift } from 'lucide-react'` | Gift / Reward |
| Percent | `import { Percent } from 'lucide-react'` | Discount / Sale |

### Data & Analytics
| Icon | Import | Usage |
|------|--------|-------|
| BarChart | `import { BarChart } from 'lucide-react'` | Analytics / Stats |
| PieChart | `import { PieChart } from 'lucide-react'` | Distribution |
| TrendingUp | `import { TrendingUp } from 'lucide-react'` | Growth / Positive |
| TrendingDown | `import { TrendingDown } from 'lucide-react'` | Decline / Negative |
| Activity | `import { Activity } from 'lucide-react'` | Activity / Pulse |
| Database | `import { Database } from 'lucide-react'` | Storage / Data |

### Files & Links
| Icon | Import | Usage |
|------|--------|-------|
| File | `import { File } from 'lucide-react'` | Document |
| FileText | `import { FileText } from 'lucide-react'` | Text document |
| Folder | `import { Folder } from 'lucide-react'` | Directory |
| FolderOpen | `import { FolderOpen } from 'lucide-react'` | Open directory |
| Paperclip | `import { Paperclip } from 'lucide-react'` | Attachment |
| Link | `import { Link } from 'lucide-react'` | URL / Hyperlink |
| Clipboard | `import { Clipboard } from 'lucide-react'` | Paste / Notes |

### Layout & Social
| Icon | Import | Usage |
|------|--------|-------|
| Grid | `import { Grid } from 'lucide-react'` | Grid / Gallery |
| List | `import { List } from 'lucide-react'` | List view |
| Columns | `import { Columns } from 'lucide-react'` | Column layout |
| Maximize | `import { Maximize } from 'lucide-react'` | Fullscreen |
| Minimize | `import { Minimize } from 'lucide-react'` | Minimize |
| Sidebar | `import { Sidebar } from 'lucide-react'` | Sidebar panel |
| Heart | `import { Heart } from 'lucide-react'` | Like / Favorite |
| Star | `import { Star } from 'lucide-react'` | Rating / Review |
| ThumbsUp | `import { ThumbsUp } from 'lucide-react'` | Approve / Like |
| ThumbsDown | `import { ThumbsDown } from 'lucide-react'` | Disapprove |
| Bookmark | `import { Bookmark } from 'lucide-react'` | Save for later |
| Flag | `import { Flag } from 'lucide-react'` | Report / Mark |

### Security & Location
| Icon | Import | Usage |
|------|--------|-------|
| Lock | `import { Lock } from 'lucide-react'` | Secure / Private |
| Unlock | `import { Unlock } from 'lucide-react'` | Open access |
| Shield | `import { Shield } from 'lucide-react'` | Protection |
| Key | `import { Key } from 'lucide-react'` | Password / Access |
| Eye | `import { Eye } from 'lucide-react'` | Show / View |
| EyeOff | `import { EyeOff } from 'lucide-react'` | Hide / Invisible |
| MapPin | `import { MapPin } from 'lucide-react'` | Location marker |
| Map | `import { Map } from 'lucide-react'` | Map / Directions |
| Navigation | `import { Navigation } from 'lucide-react'` | Compass / Navigate |
| Globe | `import { Globe } from 'lucide-react'` | World / International |

### Time & Dev
| Icon | Import | Usage |
|------|--------|-------|
| Calendar | `import { Calendar } from 'lucide-react'` | Date / Schedule |
| RefreshCw | `import { RefreshCw } from 'lucide-react'` | Refresh / Reload |
| RotateCcw | `import { RotateCcw } from 'lucide-react'` | Undo / Revert |
| RotateCw | `import { RotateCw } from 'lucide-react'` | Redo / Forward |
| Code | `import { Code } from 'lucide-react'` | Code / Dev |
| Terminal | `import { Terminal } from 'lucide-react'` | Console / CLI |
| GitBranch | `import { GitBranch } from 'lucide-react'` | Version control |
| Github | `import { Github } from 'lucide-react'` | GitHub repo |

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
