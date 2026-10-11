import io
from typing import List
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

def extract_palette(image_bytes: bytes, num_colors: int = 5) -> List[str]:
    """
    Extracts the dominant colors from an image using K-Means clustering.
    Returns a list of HEX color strings.
    """
    try:
        # Load image and convert to RGB
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Resize image for faster processing while maintaining reasonable accuracy
        image = image.resize((50, 50))
        
        # Convert image data to numpy array
        np_image = np.array(image)
        
        # Reshape to a list of pixels (2D array: [num_pixels, 3])
        pixels = np_image.reshape(-1, 3)
        
        # Apply K-Means
        kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        # Get the cluster centers (dominant colors)
        colors = kmeans.cluster_centers_
        
        # Convert RGB to HEX
        hex_colors = []
        for color in colors:
            r, g, b = [int(c) for c in color]
            hex_colors.append(f"#{r:02x}{g:02x}{b:02x}".upper())
            
        return hex_colors
    except Exception as e:
        print(f"Error extracting palette: {e}")
        # Return fallback palette in case of failure
        return ["#111111", "#FAFAFA", "#D4AF37", "#4A4A4A", "#8B0000"]

# Ensure this directory is treated as a package
with open(__file__.replace("color_extractor.py", "__init__.py"), "a") as f:
    pass
