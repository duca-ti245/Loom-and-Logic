import os
import uuid
from PIL import Image, ImageOps, ImageDraw, ImageFont
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
            
            # Extract dominant colors
            import io
            buf = io.BytesIO()
            rgb_img.save(buf, format="JPEG")
            dominant_hexes = extract_palette(buf.getvalue(), num_colors=3)
            
            # Estimate brightness
            grayscale = rgb_img.convert("L").resize((50, 50))
            avg_brightness = np.array(grayscale).mean()
            lighting = "bright natural studio lighting" if avg_brightness > 128 else "dramatic moody studio lighting"
            
            aspect = "portrait view" if height >= width else "wide view"
            
            return {
                "lighting": lighting,
                "aspect": aspect,
                "palette": dominant_hexes,
                "width": width,
                "height": height
            }
    except Exception as e:
        print(f"Error analyzing person image: {e}")
        return {
            "lighting": "studio lighting",
            "aspect": "portrait view",
            "palette": ["#111111", "#FAFAFA"],
            "width": 600,
            "height": 800
        }

def create_tryon_composite(person_img_path: str, garment_img_url_or_path: str, title: str = "Bespoke Fitting") -> str:
    """
    Creates an editorial-grade split presentation canvas combining the user's uploaded
    photo with the generated garment design.
    Saves to backend/static/ and returns the local static URL.
    """
    os.makedirs("static", exist_ok=True)
    out_filename = f"tryon_{uuid.uuid4().hex}.jpg"
    out_path = os.path.join("static", out_filename)
    
    try:
        # Load user photo
        person_img = Image.open(person_img_path).convert("RGB")
        
        # Load garment image
        if garment_img_url_or_path.startswith("http://localhost:8000/static/"):
            local_name = garment_img_url_or_path.split("/static/")[1]
            garment_img = Image.open(os.path.join("static", local_name)).convert("RGB")
        elif garment_img_url_or_path.startswith("http"):
            import requests
            resp = requests.get(garment_img_url_or_path, timeout=10)
            import io
            garment_img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        else:
            garment_img = Image.open(garment_img_url_or_path).convert("RGB")
            
        target_h = 750
        target_w = 560
        
        # Crop & resize both images to matching portrait ratios
        p_fitted = ImageOps.fit(person_img, (target_w, target_h), method=Image.Resampling.LANCZOS)
        g_fitted = ImageOps.fit(garment_img, (target_w, target_h), method=Image.Resampling.LANCZOS)
        
        # Canvas dimensions: 2 columns + padding + header bar
        canvas_w = target_w * 2 + 60
        canvas_h = target_h + 120
        canvas = Image.new("RGB", (canvas_w, canvas_h), color=(14, 14, 16))
        
        # Paste photos
        canvas.paste(p_fitted, (20, 90))
        canvas.paste(g_fitted, (target_w + 40, 90))
        
        draw = ImageDraw.Draw(canvas)
        
        # Header branding
        header_text = "LOOM & LOGIC — BESPOKE VIRTUAL TRY-ON"
        draw.text((24, 25), header_text, fill=(212, 175, 55)) # Gold accent
        sub_text = f"FITTING: {title.upper()}"
        draw.text((24, 52), sub_text, fill=(180, 180, 180))
        
        # Labels over photos
        draw.rectangle([20, 90, 200, 122], fill=(0, 0, 0, 180))
        draw.text((30, 98), "ORIGINAL MODEL", fill=(255, 255, 255))
        
        draw.rectangle([target_w + 40, 90, target_w + 240, 122], fill=(0, 0, 0, 180))
        draw.text((target_w + 50, 98), "TAILORED GARMENT", fill=(212, 175, 55))
        
        canvas.save(out_path, format="JPEG", quality=90)
        return f"http://localhost:8000/static/{out_filename}"
        
    except Exception as e:
        print(f"Error generating try-on composite: {e}")
        # Fallback to the garment image URL if composite fails
        return garment_img_url_or_path
