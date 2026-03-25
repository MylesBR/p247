# P247 Coach: Image Support & Prompt Rewrite

**Date:** 25 March 2026  
**Author:** James (via Myles Bruggeling)  
**Status:** Backend complete ✅ — iOS changes pending  
**Priority:** High (current coach responses to workout images are completely fabricated)

---

## 1. The Problem

When an athlete uploads a workout image (whiteboard photo, Apple Watch screenshot, gym programming board), the coach ignores it entirely and hallucinates a plausible workout based on the athlete's profile context. The response sounds confident but describes exercises that weren't in the session at all.

**Root cause:** `POST /agent/messages` only accepts `{"content": "string"}`. There is no mechanism to pass image data to the LLM. The image is either discarded by the iOS app or never sent. The coach then generates coaching based on profile context alone (knows about Hyrox prep, knee issues, etc.) and invents a workout to match.

**Example failure (25 March 2026):**
- **Actual workout (from whiteboard image):** Block A: 600m Row, 600m Ski, 1200m Bike Erg (every 3 min x 27 min). Block B: 400m Run, 400m Ski (every 2 min x 16 min). Block C: 200m Run / 10 Burpee to Plate (EMOM x 12 min).
- **Coach's response:** Praised a "6km run in 36:48 at 6:08/km pace" followed by "deadlifts, squats, and farmers walks." None of this happened.

This is a trust destroyer. One hallucinated response and the athlete stops using the coach.

---

## 2. API Changes

### 2.1 Update `SendMessageRequest` Schema

**Current:**
```python
class SendMessageRequest(BaseModel):
    content: str
```

**New:**
```python
class ImageAttachment(BaseModel):
    data: str          # base64-encoded image data (no data: prefix)
    mime_type: str     # "image/jpeg", "image/png", "image/webp", "image/heic"
    filename: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str
    images: Optional[list[ImageAttachment]] = None  # max 4 images per message
```

**Request example:**
```json
{
  "content": "Here's today's workout",
  "images": [
    {
      "data": "/9j/4AAQSkZJRg...",
      "mime_type": "image/jpeg",
      "filename": "workout.jpg"
    }
  ]
}
```

### 2.2 iOS App Changes

When the athlete attaches a photo in the Coach tab:

1. Compress the image to max 1024px on the longest edge (keeps payload reasonable, still readable)
2. Convert HEIC to JPEG (LLM compatibility)
3. Base64 encode the result
4. Include in the `images` array of the request body

### 2.3 Backend: Passing Images to the LLM

When `images` is present in the request, construct a multimodal message for the LLM call.

**For Claude (Anthropic):**
```python
user_message = {
    "role": "user",
    "content": [
        # Images first so the model sees them before the text
        *[
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": img.mime_type,
                    "data": img.data,
                }
            }
            for img in request.images
        ],
        {
            "type": "text",
            "text": request.content
        }
    ]
}
```

**For OpenAI (GPT-4o / GPT-4.1):**
```python
user_message = {
    "role": "user",
    "content": [
        *[
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{img.mime_type};base64,{img.data}",
                    "detail": "high"
                }
            }
            for img in request.images
        ],
        {
            "type": "text",
            "text": request.content
        }
    ]
}
```

**Important:** Use `detail: "high"` (OpenAI) or full resolution (Claude) for workout images. Low resolution modes can't read whiteboard text or small watch screens.

### 2.4 Store Image References

Don't store base64 in the message history database. Instead:

1. Save the image to object storage (S3/R2/local disk) with a unique key
2. Store the URL/path in the message record
3. When reconstructing conversation history for context, only include images from the current message (not the full history), unless the conversation is actively referencing a previous image

```python
# Message storage schema addition
class StoredMessage:
    # ... existing fields ...
    image_urls: Optional[list[str]] = None  # URLs to stored images
```

---

## 3. System Prompt Rewrite

The current coaching responses are too long, too flattering, and ungrounded. The prompt needs to enforce image reading, brevity, and honesty.

### 3.1 Image Handling Instructions (add to system prompt)

```
## Image Analysis Rules

When the athlete sends an image:
1. LOOK AT THE IMAGE FIRST. Identify exactly what it shows before generating any response.
2. State what you see: "I can see [workout type/whiteboard/watch screenshot/etc.]"
3. If it's a workout: list the actual exercises, sets, reps, distances, and time domains FROM THE IMAGE.
4. Only then provide coaching based on what's ACTUALLY in the image.
5. If you cannot read the image clearly, say so: "The image is hard to read — can you type out the workout or take a clearer photo?"

NEVER guess or invent exercises. If the image shows a rowing/ski/bike session, do not respond about running and deadlifts. Your coaching must match the actual workout shown.

If the athlete sends a message referencing a workout but no image or workout data is available from today's sync, ask: "Can you share a photo of the session or describe what you did? I want to make sure my feedback matches your actual workout."
```

### 3.2 Coaching Tone and Style (replace current coaching prompt section)

```
## Coaching Style

You are a performance coach, not a cheerleader. Your job is to give useful, specific feedback that helps the athlete improve.

Rules:
- Be specific. Reference actual numbers, exercises, and time domains from the workout.
- Be concise. Say what matters in 3-5 sentences for a quick response, 2-3 short paragraphs max for a detailed analysis. No walls of text.
- Be honest. If something is average, say it's average. If something is genuinely good, say why it's good with a specific reason.
- Ask ONE targeted question, not an open-ended "how did you feel?"
- No empty praise. "Brilliant session!" and "Quality work!" without specific reasoning are banned.
- No stacked compliments. One genuine observation beats five generic ones.
- Don't repeat back everything the athlete already knows. They did the workout. They know what exercises they did. Add value by connecting it to their goals, trends, or training phase.

Bad example (too long, too generic, hallucinated):
"Brilliant session! That 6km run in 36:48 is exactly where you want to be for Hyrox prep — that's 6:08/km pace, which is right in that sweet spot for your aerobic base work..."

Good example (specific, grounded, concise):
"Mixed modal cardio session — row, ski, bike erg rotations with a running/burpee finisher. That's textbook Hyrox prep: multiple energy systems under fatigue with short transitions. The EMOM burpees at the end when you're already gassed is where the real conditioning happens. How were the ski erg intervals feeling by round 4? That's usually where pacing falls apart."
```

### 3.3 Workout Image Response Template

When the coach successfully reads a workout image, the response should follow this structure:

```
1. What I see (1 sentence identifying the workout type/structure)
2. Why this matters for your goals (1-2 sentences connecting to Hyrox/half-marathon/current phase)
3. One specific coaching insight (what went well OR what to watch)
4. One targeted question (to drive the conversation forward)
```

Total length: 4-6 sentences. Not 4-6 paragraphs.

---

## 4. Edge Cases to Handle

| Scenario | Response |
|---|---|
| Image is blurry/unreadable | "Can't make out the details — can you type out the workout or retake the photo?" |
| Image is not a workout (food, selfie, etc.) | Process normally based on what it shows (nutrition photo, progress photo, etc.) |
| Image + text contradict each other | Trust the image. "Your photo shows [X] but you mentioned [Y] — which one was today's session?" |
| Multiple images | Process all of them. "Photo 1 shows the programmed workout, photo 2 looks like your watch summary..." |
| Image with no text message | Still analyse it: "Looks like a [workout type]. Here's what stands out..." |
| Workout data from HealthKit sync + image | Cross-reference both: "Your watch recorded 55 min at avg HR 152. The whiteboard programming looks like it would take about that long, so the pacing was solid." |

---

## 5. Validation Rules (Backend)

```python
# In the POST /agent/messages handler:

MAX_IMAGES = 4
MAX_IMAGE_SIZE_MB = 5
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

if request.images:
    if len(request.images) > MAX_IMAGES:
        raise HTTPException(400, f"Maximum {MAX_IMAGES} images per message")
    
    for img in request.images:
        # Validate mime type
        if img.mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(400, f"Unsupported image type: {img.mime_type}")
        
        # Validate size (base64 is ~33% larger than binary)
        size_bytes = len(img.data) * 3 / 4
        if size_bytes > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(400, f"Image exceeds {MAX_IMAGE_SIZE_MB}MB limit")
        
        # Convert HEIC to JPEG if needed (use Pillow)
        if img.mime_type == "image/heic":
            img.data = convert_heic_to_jpeg(img.data)
            img.mime_type = "image/jpeg"
```

---

## 6. Testing Checklist

Before shipping, test these scenarios:

- [ ] Whiteboard photo with handwritten workout (common at CrossFit/F45/group classes)
- [ ] Apple Watch workout summary screenshot
- [ ] Strava activity screenshot
- [ ] Garmin Connect screenshot
- [ ] Blurry/dark gym photo
- [ ] Photo of a printed workout program
- [ ] Multiple images in one message
- [ ] Image with no accompanying text
- [ ] Text message with no image (should still work as before)
- [ ] HEIC image from iPhone (default camera format)
- [ ] Large image (>5MB, should reject with helpful error)

For each: verify the coach's response references ONLY what's actually in the image.

---

## 7. Cost Impact

Vision model calls cost more than text-only:

| Model | Text-only call | With 1 image (1024px) | With 4 images |
|---|---|---|---|
| Claude Sonnet | ~$0.005 | ~$0.01 | ~$0.025 |
| GPT-4o | ~$0.005 | ~$0.01 | ~$0.03 |

At current scale (beta), this is negligible. At 1,000 users, even if 30% of messages include images, the additional cost is ~$50-100/month.

---

## 8. Implementation Order

1. ✅ **Backend: Update `SendMessageRequest` schema** to accept `images` — Done 25 Mar 2026
2. ✅ **Backend: Pass images to LLM as vision input** — Done 25 Mar 2026 (Claude multimodal blocks, 60s timeout for vision calls)
3. ✅ **Backend: Update system prompt** with image handling rules and coaching tone — Done 25 Mar 2026
4. ✅ **Backend: Image storage** to local disk `/opt/p247-backend/data/images/` (S3/R2 migration later) — Done 25 Mar 2026
5. ✅ **Backend: Validation** (size, mime type, count limits, HEIC conversion) — Done 25 Mar 2026
6. ⬜ **iOS: Image picker** in Coach tab message composer (1-2 days)
7. ⬜ **iOS: Image compression + HEIC conversion** before upload (2-4 hours) — Note: backend also converts HEIC as a safety net
8. ⬜ **iOS: Display image thumbnails** in conversation history (1 day)
9. ⬜ **Test all edge cases** from Section 6 checklist

**Dependencies installed:** Pillow 12.1.1, pillow-heif 1.3.0

Backend changes (steps 1-5) are live on production. The iOS app currently silently drops images, so even making the backend accept and process them means images sent via API testing will work immediately.

---

## 9. Plan Item Auto-Generation (Added 25 March 2026)

When the coach suggests a workout (whether from an image analysis or a text conversation), it now automatically generates a structured plan item that appears in the athlete's Plan tab.

**How it works:**

1. The system prompt instructs the coach to append a `<plan_item>` JSON block to any response where it prescribes exercises
2. The backend extracts this block from the response using regex (`<plan_item>...</plan_item>`)
3. The JSON is parsed and a `PlanItem` record is created in the database
4. The `<plan_item>` block is stripped from the visible chat message (the athlete never sees it)
5. The API response includes a `plan_item` reference so the iOS app can badge the Plan tab

**System prompt addition (appended to existing prompt):**
```
When you suggest exercises, include a <plan_item> JSON block at the end of your response with:
- title, subtitle, coach_note, time, estimated_duration_min
- exercises array with name, sets, reps, rest, muscle_group per exercise
The athlete never sees this block. Only emit it when prescribing specific exercises.
```

**Extraction code:** `_extract_plan_item()` in `agent.py` uses `re.compile(r"<plan_item>\s*(\{.*?\})\s*</plan_item>", re.DOTALL)` to find and parse the block. Handles malformed JSON gracefully (strips the block, doesn't create a plan item).

**Agent response now includes:**
```json
{
  "user_message": {...},
  "agent_message": {...},
  "plan_item": {
    "id": "plan_2",
    "type": "coach_suggestion",
    "title": "PM Session: Pull + Mobility"
  }
}
```

See `P247-Plan-Tab-iOS-Brief.md` for the full Plan tab iOS implementation spec and `P247-Backend-API-Development-Brief.md` section 3.15 for all Plan endpoints.
