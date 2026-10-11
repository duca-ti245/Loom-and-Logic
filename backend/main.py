import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

from services.ai_service import generate_design_concept
from services.color_extractor import extract_palette

# Load environment variables
load_dotenv()

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

app = FastAPI(title="Loom & Logic API", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    gender: str = "women"

class VariationDetails(BaseModel):
    title: str
    fabric: str
    silhouette: str
    details: str
    styling: str

class VariationResponse(BaseModel):
    image: str
    details: VariationDetails

class GenerationResponse(BaseModel):
    variations: List[VariationResponse]
    enhanced_prompt: str
    colors: List[str]

class ColorResponse(BaseModel):
    colors: List[str]

@app.get("/")
def read_root():
    return {"status": "Loom & Logic API is running."}

@app.post("/generate", response_model=GenerationResponse)
def generate_designs(request: PromptRequest):
    """
    Accepts a text prompt, enhances it with web search, generates 4 distinct variations
    along with their structured specs/details, and returns them.
    """
    concept = generate_design_concept(request.prompt, request.gender)
    variations = concept.get("variations", [])
    enhanced_prompt = concept.get("enhanced_prompt", "")
    
    colors = ["#111111", "#FAFAFA", "#D4AF37", "#4A4A4A", "#8B0000"]
    if variations:
        try:
            first_image = variations[0]["image"]
            if first_image.startswith("http://localhost:8000/static/"):
                # Load directly from local file to optimize performance
                filename = first_image.split("/static/")[1]
                filepath = os.path.join("static", filename)
                if os.path.exists(filepath):
                    with open(filepath, "rb") as f:
                        colors = extract_palette(f.read())
            else:
                # Fallback to HTTP request if it's an external URL (e.g. Pollinations)
                import requests
                response = requests.get(first_image)
                if response.status_code == 200:
                    colors = extract_palette(response.content)
        except Exception as e:
            print(f"Failed to extract colors: {e}")

    return {"variations": variations, "enhanced_prompt": enhanced_prompt, "colors": colors}

@app.post("/extract-palette", response_model=ColorResponse)
async def get_color_palette(file: UploadFile = File(...)):
    """
    Accepts an image upload and returns the top 5 HEX colors using K-Means.
    """
    contents = await file.read()
    colors = extract_palette(contents)
    return {"colors": colors}

@app.post("/save-project")
def save_project():
    """
    Placeholder endpoint for saving to Supabase.
    """
    return {"status": "success", "message": "Project saved successfully (mock)"}
