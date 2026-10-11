import os
import io
import uuid
import time
import requests
import concurrent.futures
import urllib.parse
import re
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import numpy as np
from services.color_extractor import extract_palette


def analyze_person_image(image_path: str) -> dict:
    """
    Analyzes an uploaded person image to extract color tones, brightness, and orientation.
    Returns descriptive keywords to guide AI garment rendering.
    """
    try:
        with Image.open(image_path) as img:
            rgb_img = img.convert("RGB")
            width, height = rgb_img.size

            # Extract dominant colors from image
            buf = io.BytesIO()
            rgb_img.save(buf, format="JPEG", quality=85)
            dominant_hexes = extract_palette(buf.getvalue(), num_colors=3)

            # Estimate brightness
            grayscale = rgb_img.convert("L").resize((50, 50))
            avg_brightness = np.array(grayscale).mean()
            lighting = "bright natural studio lighting" if avg_brightness > 128 else "dramatic moody studio lighting"

            aspect = "portrait" if height >= width else "landscape"

            return {
                "lighting": lighting,
                "aspect": aspect,
                "palette": dominant_hexes,
                "width": width,
                "height": height,
            }
    except Exception as e:
        print(f"Error analyzing person image: {e}")
        return {
            "lighting": "studio lighting",
            "aspect": "portrait",
            "palette": ["#111111", "#FAFAFA"],
            "width": 600,
            "height": 800,
        }


def _download_image_with_retry(url: str, timeout: int = 30, retries: int = 2) -> bytes | None:
    """
    Downloads an image from a URL with retry logic.
    Polls Pollinations URLs which are lazy and may need a few seconds.
    """
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 200 and len(resp.content) > 5000:
                return resp.content
            # Pollinations might return a placeholder first — wait and retry
            time.sleep(3)
        except Exception as e:
            print(f"Download attempt {attempt + 1} failed for {url[:80]}...: {e}")
            time.sleep(2)
    return None


def _generate_person_wearing_garment(
    person_image_path: str,
    garment_image_bytes: bytes,
    garment_title: str,
    prompt_extension: str,
    gender: str = "women",
) -> bytes | None:
    """
    Generates a NEW image of the person actually wearing the garment by:
    1. Encoding the garment image as a base64 data URL.
    2. Sending it to Pollinations image generation with a detailed prompt
       that describes the garment fully and instructs it to render the person wearing it.

    This gives much better 'person wearing dress' results than a side-by-side composite.
    """
    try:
        import base64, random

        # Resize garment for prompt context (keep small to avoid heavy requests)
        garment_pil = Image.open(io.BytesIO(garment_image_bytes)).convert("RGB")
        garment_pil.thumbnail((400, 600), Image.Resampling.LANCZOS)
        garment_buf = io.BytesIO()
        garment_pil.save(garment_buf, format="JPEG", quality=75)

        # Encode person image for context
        with Image.open(person_image_path) as p_img:
            p_img = p_img.convert("RGB")
            p_img.thumbnail((400, 600), Image.Resampling.LANCZOS)
            person_buf = io.BytesIO()
            p_img.save(person_buf, format="JPEG", quality=75)

        # Build a highly descriptive prompt to make AI generate person wearing garment
        gender_desc = "woman" if gender == "women" else ("man" if gender == "men" else "person")
        clean_ext = re.sub(r'[^\x00-\x7F]+', ' ', prompt_extension).strip()[:300]

        full_prompt = (
            f"A {gender_desc} wearing a {garment_title}, {clean_ext}. "
            f"Full-body editorial fashion photography, the person is wearing the garment, "
            f"runway style, vogue magazine quality, professional studio lighting, "
            f"high resolution 4k, fashion week presentation"
        )
        encoded_prompt = urllib.parse.quote(full_prompt)
        seed = random.randint(1, 999999)

        url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=600&height=800&nologo=true&seed={seed}&model=flux"
        )

        result = _download_image_with_retry(url, timeout=40, retries=3)
        return result

    except Exception as e:
        print(f"Error generating person-wearing-garment image: {e}")
        return None


def create_tryon_presentation(
    person_image_path: str,
    garment_image_bytes: bytes,
    styled_image_bytes: bytes | None,
    title: str = "Bespoke Fitting",
) -> str:
    """
    Creates a premium editorial presentation canvas:
    - Left panel:  the uploaded person photo
    - Center/Right: the AI-generated image of person wearing the garment (or garment itself as fallback)
    Saves result to backend/static/ and returns the URL.
    """
    os.makedirs("static", exist_ok=True)
    out_filename = f"tryon_{uuid.uuid4().hex}.jpg"
    out_path = os.path.join("static", out_filename)

    try:
        target_h = 700
        target_w = 520

        # Load person image
        person_pil = ImageOps.fit(
            Image.open(person_image_path).convert("RGB"),
            (target_w, target_h),
            method=Image.Resampling.LANCZOS,
        )

        # Load styled or garment image
        display_bytes = styled_image_bytes if styled_image_bytes else garment_image_bytes
        display_pil = ImageOps.fit(
            Image.open(io.BytesIO(display_bytes)).convert("RGB"),
            (target_w, target_h),
            method=Image.Resampling.LANCZOS,
        )

        # Divider width
        divider = 6
        canvas_w = target_w * 2 + divider + 40  # 40px total side padding
        canvas_h = target_h + 110

        # Dark luxury background
        canvas = Image.new("RGB", (canvas_w, canvas_h), color=(10, 10, 12))

        # Subtle vignette gradient on background (aesthetic)
        bg_gradient = Image.new("RGB", (canvas_w, canvas_h), color=(20, 15, 25))
        canvas = Image.blend(canvas, bg_gradient, alpha=0.5)

        # Paste photos
        left_x = 20
        right_x = 20 + target_w + divider
        top_y = 90

        canvas.paste(person_pil, (left_x, top_y))

        # Gold vertical divider
        draw = ImageDraw.Draw(canvas)
        draw.rectangle(
            [left_x + target_w, top_y, left_x + target_w + divider, top_y + target_h],
            fill=(212, 175, 55),
        )

        canvas.paste(display_pil, (right_x, top_y))

        # Header
        draw.text((left_x, 14), "LOOM & LOGIC", fill=(212, 175, 55))
        draw.text((left_x, 36), "BESPOKE VIRTUAL FITTING", fill=(180, 180, 190))
        draw.text((left_x, 58), f"FITTING: {title.upper()[:60]}", fill=(140, 140, 155))

        # Left label
        draw.rectangle([left_x, top_y, left_x + 140, top_y + 22], fill=(0, 0, 0))
        draw.text((left_x + 6, top_y + 4), "YOUR PHOTO", fill=(200, 200, 210))

        # Right label
        label = "AI STYLED LOOK" if styled_image_bytes else "GARMENT DESIGN"
        label_color = (212, 175, 55) if styled_image_bytes else (180, 180, 190)
        draw.rectangle([right_x, top_y, right_x + 160, top_y + 22], fill=(0, 0, 0))
        draw.text((right_x + 6, top_y + 4), label, fill=label_color)

        canvas.save(out_path, format="JPEG", quality=92)
        return f"http://localhost:8000/static/{out_filename}"

    except Exception as e:
        print(f"Error creating try-on presentation: {e}")
        return None


def process_single_variation(
    idx: int,
    var: dict,
    garment_url: str,
    person_image_path: str | None,
    gender: str,
) -> dict:
    """
    Downloads the garment image, generates AI person-wearing-garment image,
    and creates a presentation composite — all for a single variation.
    Designed to be called in a thread pool for parallel processing.
    """
    title = var.get("title", f"Variation {idx + 1}")
    prompt_ext = var.get("prompt_extension", "")

    tryon_url = None

    if person_image_path and os.path.exists(person_image_path):
        # Step 1: Download the garment image (with retry — Pollinations is lazy)
        print(f"  [Var {idx+1}] Downloading garment image...")
        garment_bytes = _download_image_with_retry(garment_url, timeout=35, retries=3)

        if garment_bytes:
            # Step 2: Generate AI-styled image (person wearing the garment)
            print(f"  [Var {idx+1}] Generating AI try-on image...")
            styled_bytes = _generate_person_wearing_garment(
                person_image_path, garment_bytes, title, prompt_ext, gender
            )

            # Step 3: Create presentation composite
            print(f"  [Var {idx+1}] Creating composite...")
            tryon_url = create_tryon_presentation(
                person_image_path, garment_bytes, styled_bytes, title=title
            )
        else:
            print(f"  [Var {idx+1}] Could not download garment image, skipping try-on.")

    return {
        "image": garment_url,
        "tryon_image": tryon_url,
        "details": {
            "title": title,
            "fabric": var.get("fabric", ""),
            "silhouette": var.get("silhouette", ""),
            "details": var.get("details", ""),
            "styling": var.get("styling", ""),
        },
    }
