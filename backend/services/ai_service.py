import urllib.parse
from typing import List
from duckduckgo_search import DDGS
import requests

def enhance_prompt_with_web_search(prompt: str, gender: str = "women") -> str:
    """
    Searches the web for trends related to the prompt and uses an LLM to enhance it.
    """
    try:
        # 1. Search the web specifically on fashion/design websites
        if gender == "men":
            query = f"{prompt} men's fashion design trends site:gq.com OR site:esquire.com OR site:vogue.com"
        elif gender == "unisex":
            query = f"{prompt} unisex fashion design trends site:vogue.com OR site:hypebeast.com OR site:wmagazine.com"
        else:
            query = f"{prompt} women's fashion design trends site:vogue.com OR site:harpersbazaar.com OR site:elle.com"
        results = DDGS().text(query, max_results=5)
        context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
        
        # 2. Use Text Pollinations AI to enhance the prompt
        system_prompt = "You are a world-class fashion designer and photographer. Your job is to write a highly detailed, single-paragraph image generation prompt based on the user's idea and the provided web search context. ONLY return the prompt text. No conversational text."
        user_prompt = f"Idea: {prompt}\n\nRecent web context:\n{context}\n\nWrite the enhanced image generation prompt:"
        
        response = requests.post(
            "https://text.pollinations.ai/openai",
            json={
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
        )
        if response.status_code == 200:
            data = response.json()
            # Extract just the text from the OpenAI-compatible JSON response
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Error enhancing prompt: {e}")
        
    # Fallback to original if anything fails
    return prompt

def _generate_pollinations_fallback(enhanced_prompt: str, prompt_extensions: List[str], gender: str = "women", person_context: str = "") -> List[str]:
    """
    Returns direct image URLs from Pollinations.ai for the 4 prompt extensions.
    This avoids sequential backend downloads, prevents 429 rate limits, and provides instant responses.
    """
    import urllib.parse
    import re
    import random

    base_seed = random.randint(1, 1000000)
    clean_prompt = enhanced_prompt.replace("\n", " ").strip()
    clean_prompt = re.sub(r'[^\x00-\x7F]+', ' ', clean_prompt)
    short_prompt = clean_prompt[:220]
    
    models = ["flux", "flux", "flux", "flux"]
    image_urls = []
    
    if person_context:
        gender_prefix = f"bespoke fashion design worn by person model ({person_context})"
    else:
        gender_prefix = "men's fashion design on a male model" if gender == "men" else ("unisex fashion design" if gender == "unisex" else "women's fashion design on a female model")
    
    for idx, ext in enumerate(prompt_extensions[:4]):
        model = models[idx]
        clean_ext = ext.replace("\n", " ").strip()
        clean_ext = re.sub(r'[^\x00-\x7F]+', ' ', clean_ext)
        short_ext = clean_ext[:150]
        
        # Combine prompt and variation extension to force distinct visual layouts
        encoded_prompt = urllib.parse.quote(f"{gender_prefix}, {short_prompt}, {short_ext}, fashion design, high quality, highly detailed, vogue aesthetic, fashion photography")
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=600&height=800&nologo=true&seed={base_seed + idx}&model={model}"
        image_urls.append(url)
        
    return image_urls

def _generate_gemini_images(enhanced_prompt: str, prompt_extensions: List[str], api_key: str, gender: str = "women") -> List[str]:
    """
    Calls Gemini Imagen 3 sequentially for the 4 prompt extensions.
    Saves the images locally in backend/static/ and returns their localhost URLs.
    """
    from google import genai
    from google.genai import types
    import uuid
    import os

    client = genai.Client(api_key=api_key)
    image_urls = []
    
    gender_prefix = "men's fashion design on a male model" if gender == "men" else ("unisex fashion design" if gender == "unisex" else "women's fashion design on a female model")
    
    for idx, ext in enumerate(prompt_extensions[:4]):
        full_image_prompt = f"{gender_prefix}, {enhanced_prompt}, {ext}, fashion design concept presentation, high resolution studio photography, vogue aesthetic, 3:4 portrait view"
        print(f"Generating image {idx + 1}/4 with Gemini...")
        result = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=full_image_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="3:4",
                person_generation="ALLOW_ADULT"
            )
        )
        
        filename = f"design_{uuid.uuid4().hex}_{idx + 1}.jpg"
        filepath = os.path.join("static", filename)
        with open(filepath, "wb") as f:
            f.write(result.generated_images[0].image.image_bytes)
        
        image_urls.append(f"http://localhost:8000/static/{filename}")
        
    return image_urls

def generate_design_concept(prompt: str, gender: str = "women", person_image_path: str = None) -> dict:
    """
    1. Enhances the fashion design prompt using web context and queries LLM to get a structured JSON of 4 variations.
    2. Incorporates person model specifications if person_image_path is provided.
    3. Generates distinct images for each variation and creates virtual try-on fitting composites.
    4. Saves the images locally and returns the complete structured concept dataset.
    """
    import urllib.parse
    import re
    import random
    import uuid
    import os
    import time
    import json
    import requests
    from services.tryon_service import analyze_person_image, process_single_variation
    import concurrent.futures

    # 1. Search the web for fashion trends context
    context = ""
    try:
        if gender == "men":
            query = f"{prompt} men's fashion trends site:gq.com OR site:esquire.com OR site:vogue.com"
        elif gender == "unisex":
            query = f"{prompt} unisex fashion trends site:vogue.com OR site:hypebeast.com OR site:wmagazine.com"
        else:
            query = f"{prompt} women's fashion trends site:vogue.com OR site:harpersbazaar.com OR site:elle.com"
            
        results = DDGS().text(query, max_results=5)
        context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
    except Exception as e:
        print(f"Error fetching trends: {e}")

    # 2. Call Text AI to generate structured collection details
    gender_desc = "unisex" if gender == "unisex" else f"{gender}'s"
    system_prompt = (
        f"You are a world-class fashion designer specializing in {gender_desc} fashion. Your job is to create a detailed fashion collection specs JSON "
        f"for {gender_desc} wear based on the user's design/garment idea and recent web search context. "
        "You MUST respond ONLY with a raw JSON object of the structure shown below, with NO markdown code block wrapper, "
        "and NO other conversational text.\n"
        "To ensure the collection is compelling and satisfies the designer, each of the 4 variations MUST represent a completely distinct style direction/theme:\n"
        "- Variation 1: Elegant & Classic (timeless silhouettes, flowing drapes, luxurious traditional fabrics, classic styling).\n"
        "- Variation 2: Avant-Garde & Dramatic (experimental/sculptural shapes, voluminous layouts, futuristic or unusual textures, bold statement styling).\n"
        "- Variation 3: Minimalist & Contemporary (clean architectural lines, sleek form, quiet luxury, minimal embellishments).\n"
        "- Variation 4: Bohemian/Artistic or Modern Streetwear-inspired (tiered layers, relaxed fits, patterns, embroidered or casual-chic details).\n\n"
        "For each variation, write a highly descriptive, unique `prompt_extension` specifying details like layout, cuts, color palettes, and visual features to force the image generator to create visually distinct designs. Do not use generic names or colors.\n"
        f"Make sure all variations are explicitly designed as {gender_desc} garments, adhering to {gender_desc} style cuts and sizing aesthetics.\n\n"
        "JSON Structure:\n"
        "{\n"
        "  \"enhanced_prompt\": \"A high-level detailed description of the design language...\",\n"
        "  \"variations\": [\n"
        "    {\n"
        "      \"prompt_extension\": \"Detailed visual descriptors to append to prompt for image generation, including specific colors, silhouette shapes, fabric textures, lighting, and layout features...\",\n"
        "      \"title\": \"Name of this design option\",\n"
        "      \"fabric\": \"Material details\",\n"
        "      \"silhouette\": \"Cut and silhouette\",\n"
        "      \"details\": \"Intricate details/embroidery specs\",\n"
        "      \"styling\": \"Styling/accessories suggestions\"\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Provide exactly 4 variations."
    )
    
    user_prompt = f"User Idea: {prompt}\n\nWeb Trends Context:\n{context}"
    
    enhanced_prompt = prompt
    variations_data = []
    
    try:
        response = requests.post(
            "https://text.pollinations.ai/openai",
            json={
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
        )
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"].strip()
            
            # Robust JSON extraction: find first '{' and last '}'
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1:
                content_clean = content[start_idx:end_idx+1]
            else:
                content_clean = content
                
            parsed = json.loads(content_clean)
            enhanced_prompt = parsed.get("enhanced_prompt", prompt)
            variations_data = parsed.get("variations", [])
    except Exception as e:
        print(f"Error parsing structured generation from Text AI: {e}")
        
    # If the text generation fails or doesn't return 4 variations, create default variations structure
    if len(variations_data) < 4:
        # Determine garment type for a more generic/adaptive fallback matching the prompt
        garment = "garment"
        prompt_lower = prompt.lower()
        if "dress" in prompt_lower or "gown" in prompt_lower:
            garment = "dress"
        elif "coat" in prompt_lower:
            garment = "coat"
        elif "jacket" in prompt_lower:
            garment = "jacket"
        elif "suit" in prompt_lower or "blazer" in prompt_lower:
            garment = "suit"
        elif "pant" in prompt_lower or "trousers" in prompt_lower:
            garment = "trousers"
        elif "skirt" in prompt_lower:
            garment = "skirt"
        elif "top" in prompt_lower or "shirt" in prompt_lower or "blouse" in prompt_lower:
            garment = "top"
            
        # Adjust default garment based on gender if generic
        if garment == "garment":
            if gender == "men":
                garment = "suit"
            elif gender == "women":
                garment = "dress"
            else:
                garment = "jacket"
            
        variations_data = [
            {
                "prompt_extension": f"elegant classic style, timeless tailored {garment} silhouette, clean lines, luxurious fabric, high-quality fashion presentation, themed around {prompt}",
                "title": f"Classic Elegance - {prompt.title()}",
                "fabric": "Premium Quality Textured Fabric",
                "silhouette": f"Timeless Tailored {garment.title()}",
                "details": "Soft drapes, structural seams, and hand-finished borders",
                "styling": "Paired with minimal classic accessories"
            },
            {
                "prompt_extension": f"avant-garde dramatic design, voluminous or architectural shape, bold structured details, experimental fabric texture, futuristic fashion look, themed around {prompt}",
                "title": f"Avant-Garde Drama - {prompt.title()}",
                "fabric": "Structured Architectural Blend",
                "silhouette": f"Voluminous & Sculptural {garment.title()}",
                "details": "Bold sculptural elements, high-contrast paneling, and unique borders",
                "styling": "Paired with statement styling and bold accessories"
            },
            {
                "prompt_extension": f"minimalist modern look, clean lines, sleek tailored silhouette, quiet luxury aesthetic, simple minimalist details, themed around {prompt}",
                "title": f"Modern Minimalist - {prompt.title()}",
                "fabric": "Heavy Matte Crepe or Fine Cashmere",
                "silhouette": f"Sleek & Minimalist {garment.title()}",
                "details": "Hidden closures, minimal clean seams, and precise tailoring",
                "styling": "Paired with minimal geometric jewelry"
            },
            {
                "prompt_extension": f"bohemian artistic style, relaxed layered silhouette, rich patterns and embroidery, fluid linen or lace fabric, creative style themed around {prompt}",
                "title": f"Artistic Bohemian - {prompt.title()}",
                "fabric": "Organic Linen & Cotton Lace",
                "silhouette": f"Relaxed & Layered {garment.title()}",
                "details": "Floral embroidery, delicate lace inserts, or textured detail layers",
                "styling": "Paired with artisan jewelry and woven slides"
            }
        ]

    prompt_extensions = [var.get("prompt_extension", "") for var in variations_data]

    # Analyze person image if provided
    person_context = ""
    if person_image_path and os.path.exists(person_image_path):
        p_info = analyze_person_image(person_image_path)
        palette_str = ", ".join(p_info.get("palette", []))
        person_context = f"proportioned for model in portrait, {p_info.get('lighting')}, harmonizing with palette {palette_str}"

    # 3. Generate distinct images for each variation
    api_key = os.getenv("GEMINI_API_KEY")
    use_gemini = api_key and "your_gemini_api_key_here" not in api_key
    
    image_urls = []
    if use_gemini:
        try:
            image_urls = _generate_gemini_images(enhanced_prompt, prompt_extensions, api_key, gender)
        except Exception as e:
            print(f"Gemini image generation failed, falling back to Pollinations: {e}")
            use_gemini = False
            
    if not use_gemini:
        image_urls = _generate_pollinations_fallback(enhanced_prompt, prompt_extensions, gender, person_context=person_context)

    # 4. Merge image URLs and specs.
    # If a person image is uploaded, process all 4 variations in PARALLEL:
    #   - Download garment image (Pollinations is lazy, needs retries)
    #   - Generate AI image of PERSON WEARING the garment
    #   - Create premium presentation composite
    paired_vars = list(zip(range(len(variations_data[:4])), variations_data[:4]))
    garment_urls = [image_urls[i] if i < len(image_urls) else image_urls[-1] for i in range(len(paired_vars))]

    if person_image_path and os.path.exists(person_image_path):
        print(f"Processing {len(paired_vars)} try-on variations in parallel...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(
                    process_single_variation,
                    idx, var, garment_urls[idx], person_image_path, gender
                )
                for idx, var in paired_vars
            ]
            output_variations = [f.result() for f in concurrent.futures.as_completed(futures)]
        # Re-sort by index since as_completed doesn't preserve order
        output_variations.sort(key=lambda v: next(
            (i for i, var in paired_vars if var.get('title', f'Variation {i+1}') == v['details']['title']), 0
        ))
    else:
        output_variations = [
            {
                "image": garment_urls[idx],
                "tryon_image": None,
                "details": {
                    "title": var.get("title", f"Variation {idx + 1}"),
                    "fabric": var.get("fabric", ""),
                    "silhouette": var.get("silhouette", ""),
                    "details": var.get("details", ""),
                    "styling": var.get("styling", ""),
                }
            }
            for idx, var in paired_vars
        ]

    return {
        "variations": output_variations,
        "enhanced_prompt": enhanced_prompt
    }
