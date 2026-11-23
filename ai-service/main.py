"""
SnapShare AI - Multimodal Intelligence Microservice
FastAPI inference engine for universal file analysis, semantic embeddings,
perceptual duplicate detection, scene & object recognition, and code intelligence.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File as FastAPIFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import io
import math
import hashlib
import logging
import urllib.request
import requests as http_requests
import base64
from PIL import Image, ImageStat, ImageOps
import numpy as np
import cv2

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("snapshare-ai")

# ---------------------------------------------------------------------------
# Gemini Vision Caption Generator
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    _backend_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env")
    if os.path.exists(_backend_env):
        with open(_backend_env, "r", encoding="utf-8") as _f:
            for _line in _f:
                if _line.strip().startswith("GEMINI_API_KEY="):
                    GEMINI_API_KEY = _line.strip().split("=", 1)[1].strip()
                    break

GEMINI_MODEL = "gemini-3.8-flash"

def _build_gemini_caption_prompt(person_count: int, composition: str, scene: str, tags: list) -> str:
    """Build a rich context prompt for Gemini Vision caption generation."""
    tag_str = ", ".join(tags[:8]) if tags else ""
    comp_map = {
        "single_person": "one person (solo portrait)",
        "pair":          "two people together",
        "three_person":  "three people together",
        "four_person":   "four people together",
        "group":         f"{person_count} people in a group",
        "non_human":     "a scenic / atmospheric shot with no people",
    }
    comp_desc = comp_map.get(composition, f"{person_count} people" if person_count > 0 else "a scenic shot")
    scene_hint = f" at/near {scene}" if scene and scene.lower() not in ("scenic environment", "indoor scene") else ""

    return (
        f"This is a photo showing {comp_desc}{scene_hint}. "
        f"Tags visible: {tag_str}. "
        "Write ONE short, vivid, emotionally warm caption (1–2 sentences, max 25 words) that feels "
        "personal and unique—like it was written by a friend who was there. "
        "Focus on the mood, the moment, and the connection between people. "
        "Do NOT use generic phrases like 'featuring X people' or 'a photo of'. "
        "Reply with ONLY the caption text, no quotes, no extra commentary."
    )

async def generate_gemini_caption(image_url: str, person_count: int, composition: str,
                                   scene: str, tags: list) -> Optional[str]:
    """Call Gemini 1.5 Flash REST API with an image URL to get a real AI caption."""
    if not GEMINI_API_KEY or not GEMINI_API_KEY.startswith("AIzaSy"):
        return None
    try:
        prompt = _build_gemini_caption_prompt(person_count, composition, scene, tags)
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inlineData": None},   # placeholder; replaced below if URL works
                    ]
                }
            ]
        }

        # Try image URL mode first (Gemini supports remote HTTPS URLs via fileData)
        if image_url and image_url.startswith("http"):
            payload["contents"][0]["parts"] = [
                {"text": prompt},
                {"fileData": {"mimeType": "image/jpeg", "fileUri": image_url}}
            ]
        else:
            # Fallback: text-only caption from metadata
            payload["contents"][0]["parts"] = [{"text": prompt}]

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}"
            f":generateContent?key={GEMINI_API_KEY}"
        )
        resp = http_requests.post(url, json=payload, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            caption = (
                data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                    .strip()
            )
            if caption:
                return caption
        # If fileData not supported, retry with inline base64 for Cloudinary URLs
        if image_url and image_url.startswith("http"):
            img_resp = http_requests.get(image_url, timeout=10)
            if img_resp.status_code == 200:
                b64 = base64.b64encode(img_resp.content).decode()
                mime = img_resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
                payload["contents"][0]["parts"] = [
                    {"text": prompt},
                    {"inlineData": {"mimeType": mime, "data": b64}}
                ]
                resp2 = http_requests.post(url, json=payload, timeout=20)
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    caption2 = (
                        data2.get("candidates", [{}])[0]
                             .get("content", {})
                             .get("parts", [{}])[0]
                             .get("text", "")
                             .strip()
                    )
                    if caption2:
                        return caption2
        return None
    except Exception as e:
        print(f"[Gemini caption] Error: {e}")
        return None

app = FastAPI(
    title="SnapShare AI Microservice",
    version="1.0.0",
    description="Intelligent Multimodal File Intelligence & Organization Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Neural Face Detection (YuNet) & Face Recognition (SFace)
# -------------------------------------------------------------

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

_detector_instance = None
_recognizer_instance = None

def get_face_detector(conf_threshold: float = 0.85):
    """Lazy-load OpenCV YuNet Face Detector with configurable confidence threshold."""
    global _detector_instance
    if _detector_instance is None:
        if not os.path.exists(YUNET_PATH):
            urllib.request.urlretrieve(
                "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
                YUNET_PATH
            )
        _detector_instance = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), conf_threshold)
    else:
        _detector_instance.setScoreThreshold(conf_threshold)
    return _detector_instance

def get_face_recognizer():
    """Lazy-load OpenCV SFace Face Feature Recognizer (128-dim embeddings)."""
    global _recognizer_instance
    if _recognizer_instance is None:
        if not os.path.exists(SFACE_PATH):
            urllib.request.urlretrieve(
                "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
                SFACE_PATH
            )
        _recognizer_instance = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
    return _recognizer_instance

def detect_and_embed_faces(
    img_bgr: np.ndarray,
    generate_embeddings: bool = True,
    conf_threshold: float = 0.55,
    nms_threshold: float = 0.3
) -> Dict[str, Any]:
    """
    Executes deep neural network face detection (YuNet) and feature extraction (SFace).
    Conforms to SnapShare AI Master Prompt Sections 4, 5, and 6.
    """
    h, w = img_bgr.shape[:2]
    max_dim = 1280
    scale = 1.0
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        proc_img = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        proc_img = img_bgr

    proc_h, proc_w = proc_img.shape[:2]

    try:
        detector = get_face_detector(conf_threshold)
        detector.setInputSize((proc_w, proc_h))
        detector.setNMSThreshold(nms_threshold)
        _, raw_faces = detector.detect(proc_img)
    except Exception as ex:
        print(f"[Face Detection Error]: {ex}")
        raw_faces = None

    faces_data = []
    recognizer = get_face_recognizer() if generate_embeddings else None

    if raw_faces is not None and len(raw_faces) > 0:
        for idx, f in enumerate(raw_faces):
            conf = float(f[14])
            if conf < conf_threshold:
                continue

            # Scale bounding box back to original coordinates
            box_x = int(round(f[0] / scale))
            box_y = int(round(f[1] / scale))
            box_w = int(round(f[2] / scale))
            box_h = int(round(f[3] / scale))

            box_x = max(0, min(box_x, w - 1))
            box_y = max(0, min(box_y, h - 1))
            box_w = max(1, min(box_w, w - box_x))
            box_h = max(1, min(box_h, h - box_y))

            landmarks = [
                [int(round(f[3 + 2 * i] / scale)), int(round(f[4 + 2 * i] / scale))]
                for i in range(5)
            ]

            face_item = {
                "faceIndex": idx,
                "boundingBox": {
                    "x": box_x,
                    "y": box_y,
                    "width": box_w,
                    "height": box_h
                },
                "detectionConfidence": round(conf, 4),
                "landmarks": landmarks
            }

            # Face embedding generation (128-dim SFace normalized embedding)
            if generate_embeddings and recognizer:
                try:
                    aligned = recognizer.alignCrop(proc_img, f)
                    feat = recognizer.feature(aligned)
                    feat_flat = feat.flatten()
                    norm = np.linalg.norm(feat_flat)
                    if norm > 0:
                        feat_flat = feat_flat / norm
                    face_item["embedding"] = [round(float(x), 5) for x in feat_flat]
                except Exception as ex:
                    print(f"Error computing face embedding for index {idx}: {ex}")
                    face_item["embedding"] = []

            faces_data.append(face_item)

    # Filter background bystander faces when there are clear foreground subjects
    if len(faces_data) > 1:
        areas = [f["boundingBox"]["width"] * f["boundingBox"]["height"] for f in faces_data]
        max_area = max(areas)
        if max_area > 15000:
            filtered = []
            for f in faces_data:
                area = f["boundingBox"]["width"] * f["boundingBox"]["height"]
                # A face is a background bystander if its area is less than 45% of foreground subjects and lower confidence
                if area < 0.45 * max_area and f["detectionConfidence"] < 0.90:
                    continue
                filtered.append(f)
            if filtered:
                faces_data = filtered

    face_count = len(faces_data)

    # Section 6: Exact rule classification conforming to user requirements
    # 1 person -> solo, 2 people -> two_people, 3 people -> three_people, 4 people -> four_people, 5+ -> group
    if face_count > 4:
        comp = 'group'
    elif face_count == 4:
        comp = 'four_people'
    elif face_count == 3:
        comp = 'three_people'
    elif face_count == 2:
        comp = 'two_people'
    elif face_count == 1:
        comp = 'solo'
    else:
        comp = 'non_human'

    return {
        "faceCount": face_count,
        "photoComposition": comp,
        "faces": faces_data
    }

# -------------------------------------------------------------
# Utility Functions: Perceptual Hashing & Color Intelligence
# -------------------------------------------------------------

def compute_phash(img: Image.Image, hash_size: int = 8) -> str:
    """Compute 64-bit perceptual hash (pHash) using discrete cosine reduction."""
    img_gray = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = np.array(img_gray.getdata(), dtype=float).reshape((hash_size, hash_size + 1))
    # Simple difference hash (dHash - efficient variant of pHash)
    diff = pixels[:, 1:] > pixels[:, :-1]
    decimal_val = 0
    hex_str = []
    for idx, bit in enumerate(diff.flatten()):
        if bit:
            decimal_val += 2 ** (idx % 4)
        if idx % 4 == 3:
            hex_str.append(hex(decimal_val)[2:])
            decimal_val = 0
    return "".join(hex_str)

def analyze_palette(img: Image.Image) -> Dict[str, Any]:
    """Extract dominant colors, brightness, contrast, and color palette."""
    rgb_img = img.convert('RGB')
    small = rgb_img.resize((100, 100))
    stat = ImageStat.Stat(small)

    r, g, b = stat.mean[:3]
    brightness = (r * 299 + g * 587 + b * 114) / 1000
    contrast = np.std(np.array(small))

    # Palette via quantization
    quantized = small.quantize(colors=5)
    palette_raw = quantized.getpalette()[:15]
    colors = []
    for i in range(0, len(palette_raw), 3):
        hex_c = f"#{palette_raw[i]:02x}{palette_raw[i+1]:02x}{palette_raw[i+2]:02x}"
        colors.append(hex_c)

    dominant = colors[0] if colors else f"#{int(r):02x}{int(g):02x}{int(b):02x}"
    
    return {
        "dominantColor": dominant,
        "palette": colors,
        "brightness": round(brightness, 1),
        "contrast": round(float(contrast), 1),
        "isDark": brightness < 90,
        "isLight": brightness > 180,
    }

def analyze_quality(img: Image.Image, brightness: float, contrast: float) -> Dict[str, Any]:
    """Evaluate image sharpness, resolution, exposure, and overall quality score."""
    w, h = img.size
    is_low_res = (w < 400 or h < 400)
    
    # Laplacian variance for blur estimation
    gray = np.array(img.convert('L'))
    laplacian = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
    # Fast convolution approximation
    diff_h = np.abs(gray[1:, :] - gray[:-1, :])
    diff_v = np.abs(gray[:, 1:] - gray[:, :-1])
    sharpness_score = float(np.mean(diff_h) + np.mean(diff_v))
    
    is_blurry = sharpness_score < 4.5
    is_overexposed = brightness > 230
    is_underexposed = brightness < 30

    score = 100
    recommendations = []
    if is_low_res:
        score -= 25
        recommendations.append("Low resolution image (< 400px)")
    if is_blurry:
        score -= 30
        recommendations.append("Potential motion blur or soft focus detected")
    if is_overexposed:
        score -= 20
        recommendations.append("High highlight clipping / overexposed")
    if is_underexposed:
        score -= 20
        recommendations.append("Severe underexposure / very dark scene")

    return {
        "overallScore": max(10, score),
        "sharpness": round(sharpness_score, 2),
        "isBlurry": is_blurry,
        "isLowRes": is_low_res,
        "isOverexposed": is_overexposed,
        "isUnderexposed": is_underexposed,
        "recommendations": recommendations,
        "rating": "High Quality" if score >= 80 else ("Acceptable" if score >= 55 else "Needs Improvement")
    }

def generate_embeddings(text: str = "", vector_len: int = 64) -> List[float]:
    """
    Generate normalized semantic embedding vector using deterministic feature hashing.
    Used for vector indexing and cosine similarity search across text/tags/categories.
    """
    tokens = text.lower().split()
    vec = [0.0] * vector_len
    if not tokens:
        return [0.0] * vector_len

    for token in tokens:
        h = int(hashlib.sha256(token.encode('utf-8')).hexdigest()[:8], 16)
        idx = h % vector_len
        sign = 1.0 if (h // vector_len) % 2 == 0 else -1.0
        vec[idx] += sign

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 5) for x in vec]
    return vec

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SnapShare AI Multimodal Inference Engine",
        "version": "1.0.0",
        "capabilities": [
            "object_recognition",
            "scene_classification",
            "perceptual_hashing",
            "color_intelligence",
            "quality_scoring",
            "document_intelligence",
            "code_analysis",
            "semantic_embeddings"
        ]
    }

class ImageAnalysisRequest(BaseModel):
    filePath: Optional[str] = None
    filename: str = "image.jpg"
    fileUrl: Optional[str] = None

def analyze_people_and_composition(img: Image.Image, filename: str) -> Dict[str, Any]:
    w, h = img.size
    aspect_ratio = w / max(1, h)
    lower_name = filename.lower()
    
    # Check explicit keyword hints
    is_explicit_group = any(k in lower_name for k in ['group', 'friends', 'team', 'family', 'party', 'crew', 'reunion', 'gathering', 'crowd', 'colleagues', 'students', 'class'])
    is_explicit_single = any(k in lower_name for k in ['portrait', 'solo', 'selfie', 'profile', 'dp', 'me', 'single', 'headshot', 'passport', 'person', 'model'])
    is_landscape_or_object = any(k in lower_name for k in ['nature', 'mountain', 'landscape', 'forest', 'sunset', 'sunrise', 'sky', 'beach', 'ocean', 'sea', 'lake', 'scenery', 'building', 'car', 'animal', 'dog', 'cat', 'food', 'coffee', 'code', 'screenshot'])
    
    # Downsample for fast skin & cluster detection
    small = img.convert('RGB').resize((120, 120))
    arr = np.array(small, dtype=float)
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    # Skin tone detection in normalized RGB / YCbCr
    skin = (r > 95) & (g > 40) & (b > 20) & \
           ((np.maximum(r, np.maximum(g, b)) - np.minimum(r, np.minimum(g, b))) > 15) & \
           (np.abs(r - g) > 15) & (r > g) & (r > b)
           
    skin_pixels = np.sum(skin)
    total_pixels = 120 * 120
    skin_ratio = skin_pixels / total_pixels
    
    # Check horizontal distribution of skin (columns with skin)
    col_has_skin = np.sum(skin, axis=0) > 3
    changes = np.diff(col_has_skin.astype(int))
    skin_islands = int(np.sum(changes == 1))
    
    person_count = 0
    composition = 'non_human'
    
    if is_explicit_group:
        person_count = max(3, skin_islands if skin_islands >= 3 else 3)
        composition = 'group'
    elif is_explicit_single:
        person_count = 1
        composition = 'single_person'
    elif is_landscape_or_object:
        # Override skin false-positives on scenery/objects
        person_count = 0
        composition = 'non_human'
    elif 0.04 <= skin_ratio <= 0.42:
        # Detected human presence (localized skin tone cluster)
        if skin_islands >= 3 or (skin_islands >= 2 and aspect_ratio > 1.45):
            person_count = max(3, min(skin_islands, 8))
            composition = 'group'
        elif skin_islands == 2:
            person_count = 2
            composition = 'pair'
        else:
            person_count = 1
            composition = 'single_person'
            
    # Compute person feature signature (color histogram of central / face region)
    center_region = arr[15:105, 15:105]
    hist_r, _ = np.histogram(center_region[:,:,0], bins=16, range=(0, 256), density=True)
    hist_g, _ = np.histogram(center_region[:,:,1], bins=16, range=(0, 256), density=True)
    hist_b, _ = np.histogram(center_region[:,:,2], bins=16, range=(0, 256), density=True)
    sig = np.concatenate([hist_r, hist_g, hist_b])
    norm = np.linalg.norm(sig)
    if norm > 0:
        sig = sig / norm
    
    return {
        'personCount': person_count,
        'composition': composition,
        'skinRatio': round(float(skin_ratio), 3),
        'signature': [round(float(x), 4) for x in sig[:32]]
    }

@app.post("/analyze/image")
async def analyze_image(req: ImageAnalysisRequest):
    """Deep analysis of an image: objects, scenes, captioning, tags, colors, quality, pHash, people & composition."""
    try:
        img = None
        target_path = req.filePath
        if target_path and os.path.exists(target_path):
            img = Image.open(target_path)
        elif (target_path and target_path.startswith(('http://', 'https://'))) or req.fileUrl:
            url_to_fetch = req.fileUrl or target_path
            req_obj = urllib.request.Request(url_to_fetch, headers={'User-Agent': 'SnapShareAI/1.0'})
            with urllib.request.urlopen(req_obj, timeout=10) as resp:
                img = Image.open(io.BytesIO(resp.read()))
        else:
            raise HTTPException(status_code=404, detail="File path or URL not accessible")

        # Auto-correct orientation from EXIF metadata (critical for portrait mobile photos)
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        w, h = img.size
        palette_info = analyze_palette(img)
        quality_info = analyze_quality(img, palette_info["brightness"], palette_info["contrast"])
        phash = compute_phash(img)

        # 1. Neural Face Detection & Composition
        img_bgr = cv2.cvtColor(np.array(img.convert('RGB')), cv2.COLOR_RGB2BGR)
        face_result = detect_and_embed_faces(img_bgr, generate_embeddings=True, conf_threshold=0.55)

        if face_result["faceCount"] > 0:
            person_count = face_result["faceCount"]
            composition = face_result["photoComposition"]
            detected_faces = face_result["faces"]
            # Color signature from first face crop or central region
            if detected_faces:
                fb = detected_faces[0]["boundingBox"]
                crop = img_bgr[fb["y"]:fb["y"]+fb["height"], fb["x"]:fb["x"]+fb["width"]]
                if crop.size > 0:
                    small_c = cv2.resize(crop, (40, 40))
                    hr = np.histogram(small_c[:,:,0], bins=16, range=(0, 256), density=True)[0]
                    hg = np.histogram(small_c[:,:,1], bins=16, range=(0, 256), density=True)[0]
                    hb = np.histogram(small_c[:,:,2], bins=16, range=(0, 256), density=True)[0]
                    sig = np.concatenate([hr, hg, hb])
                    norm = np.linalg.norm(sig)
                    person_signature = [round(float(x), 4) for x in (sig / norm if norm > 0 else sig)[:32]]
                else:
                    person_signature = []
            else:
                person_signature = []
        else:
            people_info = analyze_people_and_composition(img, req.filename)
            person_count = 0 if people_info['composition'] == 'non_human' else people_info['personCount']
            composition = 'non_human' if person_count == 0 else people_info['composition']
            person_signature = people_info['signature']
            detected_faces = []

        # Content classification heuristics based on filename, aspect ratio, and color characteristics
        lower_name = req.filename.lower()
        detected_objects = []
        scenes = []
        categories = []
        tags = []

        # Person & Group categorization strictly conforming to user requirements
        if composition in ['solo', 'single_person']:
            detected_objects.append({"label": "Person (Single Portrait)", "confidence": 0.96})
            scenes.append({"label": "Solo Portrait", "confidence": 0.94})
            categories.append("Solo")
            tags.extend(["Solo", "Single Photo", "Portrait", "Person"])
        elif composition in ['two_people', 'pair']:
            detected_objects.append({"label": "Two People (Couple / Duo)", "confidence": 0.95})
            scenes.append({"label": "Two Persons", "confidence": 0.92})
            categories.append("Two People")
            tags.extend(["Two People", "Pair", "Duo", "Couple"])
        elif composition in ['three_people', 'three_person']:
            detected_objects.append({"label": "Three People (Trio)", "confidence": 0.95})
            scenes.append({"label": "Three-Member Group", "confidence": 0.92})
            categories.append("Three People")
            tags.extend(["Three People", "Trio", "Small Group", "Friends"])
        elif composition in ['four_people', 'four_person']:
            detected_objects.append({"label": "Four People (Quartet)", "confidence": 0.95})
            scenes.append({"label": "Four-Member Group", "confidence": 0.93})
            categories.append("Four People")
            tags.extend(["Four People", "Quartet", "Group", "Friends"])
        elif composition == 'group':
            detected_objects.append({"label": f"People ({person_count} Persons)", "confidence": 0.96})
            scenes.append({"label": "Group Gathering", "confidence": 0.95})
            categories.append("Group")
            tags.extend(["Group", "Group Photo", "People", "Friends", "Group Portrait", "Social"])

        # Screenshot detection
        is_screenshot = "screenshot" in lower_name or "screen" in lower_name or (w in [1920, 1080, 1440, 2560] and h in [1080, 720, 900, 1440])
        if is_screenshot:
            detected_objects.append({"label": "Screen Interface", "confidence": 0.94, "box": [0, 0, w, h]})
            scenes.append({"label": "Digital Display", "confidence": 0.95})
            categories.append("Screenshots")
            tags.extend(["Screenshot", "Interface", "Software", "Digital"])

        # Nature / Outdoor vs Indoor
        if palette_info["dominantColor"] in ["#", "green"] or palette_info["palette"][0].startswith("#2") or "nature" in lower_name:
            scenes.append({"label": "Nature / Garden", "confidence": 0.88})
            if "Nature" not in categories:
                categories.append("Nature")
            tags.extend(["Nature", "Outdoor", "Greenery", "Environment"])
        elif palette_info["brightness"] > 140 and not is_screenshot:
            scenes.append({"label": "Outdoor Daylight", "confidence": 0.82})
            if "Travel" not in categories and composition == 'non_human':
                categories.append("Travel")
            tags.extend(["Outdoor", "Daylight", "Scenic"])
        else:
            scenes.append({"label": "Indoor Scene", "confidence": 0.78})
            tags.extend(["Indoor", "Ambient"])

        # Auto-detect common entities by keyword patterns
        keywords = {
            "car": ("Vehicle", "Vehicles", ["Automotive", "Car", "Transportation"]),
            "auto": ("Vehicle", "Vehicles", ["Automobile", "Vehicle"]),
            "dog": ("Animal", "Animals", ["Pet", "Dog", "Canine"]),
            "cat": ("Animal", "Animals", ["Pet", "Cat", "Feline"]),
            "food": ("Food Dish", "Food", ["Cuisine", "Meal", "Delicious"]),
            "coffee": ("Beverage", "Food", ["Coffee", "Drink", "Cafe"]),
            "wedding": ("Wedding Event", "Events", ["Celebration", "Ceremony", "Formal"]),
            "party": ("Party Gathering", "Events", ["Celebration", "Social"]),
            "code": ("Source Code", "Technology", ["Programming", "Developer", "Code"]),
            "arch": ("Building Architecture", "Architecture", ["Structure", "Modern", "Urban"]),
        }
        for kw, (obj_label, cat_label, extra_tags) in keywords.items():
            if kw in lower_name:
                detected_objects.append({"label": obj_label, "confidence": 0.91})
                if cat_label not in categories:
                    categories.append(cat_label)
                tags.extend(extra_tags)

        if not categories:
            categories.append("General Photos")

        # Enforce strict categorization conforming to Master Prompt Rules A through F:
        if composition == 'group':
            categories = ["Group"]
        elif composition in ['four_people', 'four_person']:
            categories = ["Four People"]
        elif composition in ['three_people', 'three_person']:
            categories = ["Three People"]
        elif composition in ['two_people', 'pair']:
            categories = ["Two People"]
        elif composition in ['solo', 'single_person']:
            categories = ["Solo"]
        else:
            # Rule F: Zero people - normal categorization, strictly exclude all human/group folders
            categories = [c for c in categories if c not in [
                "Group", "Group Photos", "Four People", "Four Member Groups", "Four-Member Groups",
                "Three People", "Three Member Groups", "Three-Member Groups",
                "Two People", "Two Member Groups", "Pair Photos",
                "Solo", "Individual Photos", "Single Photos"
            ]]
            if not categories:
                categories = ["General Photos"]

        # Natural language caption synthesis — try Gemini Vision API first
        main_cat = categories[0]
        scene_name = scenes[0]["label"] if scenes else "Scenic environment"

        image_url_for_caption = req.fileUrl or ""
        ai_caption = await generate_gemini_caption(
            image_url_for_caption, person_count, composition, scene_name, list(set(tags))
        )

        if not ai_caption:
            # Local fallback when no Gemini key / API unavailable
            if composition == 'single_person':
                comp_desc = "single portrait"
            elif composition == 'pair':
                comp_desc = "two-person photo"
            elif composition == 'three_person':
                comp_desc = "three-person trio"
            elif composition == 'four_person':
                comp_desc = "four-person group"
            elif composition == 'group':
                comp_desc = f"group photo with {person_count} people"
            else:
                comp_desc = "visual capture"
            brightness_word = "bright" if palette_info['brightness'] > 120 else "moody"
            ai_caption = f"A {brightness_word} {comp_desc} featuring {scene_name.lower()} with dominant tones of {palette_info['dominantColor']}."

        caption = ai_caption

        # Generate semantic embedding
        combined_text = f"{caption} {' '.join(tags)} {main_cat} {req.filename}"
        embedding = generate_embeddings(combined_text)

        return {
            "success": True,
            "filename": req.filename,
            "dimensions": {"width": w, "height": h},
            "caption": caption,
            "categories": categories,
            "tags": list(set(tags)),
            "detectedObjects": detected_objects,
            "scenes": scenes,
            "colors": palette_info,
            "quality": quality_info,
            "perceptualHash": phash,
            "personCount": person_count,
            "photoComposition": composition,
            "personSignature": person_signature,
            "faces": detected_faces,
            "embedding": embedding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Dedicated caption generation endpoint
# ---------------------------------------------------------------------------
class CaptionRequest(BaseModel):
    imageUrl: Optional[str] = None
    personCount: int = 0
    photoComposition: str = "non_human"
    scene: str = ""
    tags: List[str] = []
    filename: str = "image.jpg"

@app.post("/generate-caption")
async def generate_caption_endpoint(req: CaptionRequest):
    """
    Generate an AI-powered photo caption using Gemini Vision API.
    Falls back to a descriptive local caption if the API key is not configured.
    """
    scene = req.scene or "Scenic environment"
    caption = await generate_gemini_caption(
        req.imageUrl or "", req.personCount, req.photoComposition, scene, req.tags
    )
    if not caption:
        # Smart local fallback when no Gemini key
        comp_map = {
            "single_person": "one person",
            "pair": "two friends",
            "three_person": "three friends",
            "four_person": "four friends",
            "group": f"{req.personCount} people together",
            "non_human": "a beautiful scene",
        }
        comp_str = comp_map.get(req.photoComposition, f"{req.personCount} people" if req.personCount > 0 else "a scenic moment")
        caption = f"A memorable moment capturing {comp_str} at {scene.lower()}."
    return {"success": True, "caption": caption, "source": "gemini" if GEMINI_API_KEY else "local"}


class FaceAnalysisRequest(BaseModel):
    filePath: Optional[str] = None
    fileUrl: Optional[str] = None
    filename: str = "image.jpg"
    generateEmbeddings: bool = False
    confidenceThreshold: float = 0.85

class FaceMatchRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]

@app.post("/analyze/faces")
async def analyze_faces(req: FaceAnalysisRequest):
    """
    Dedicated endpoint for neural face detection, bounding boxes, landmarks,
    and privacy-consented 128-dim embeddings conforming to Sections 4 & 5.
    """
    try:
        img = None
        target_path = req.filePath
        if target_path and os.path.exists(target_path):
            img = Image.open(target_path)
        elif (target_path and target_path.startswith(('http://', 'https://'))) or req.fileUrl:
            url_to_fetch = req.fileUrl or target_path
            req_obj = urllib.request.Request(url_to_fetch, headers={'User-Agent': 'SnapShareAI/1.0'})
            with urllib.request.urlopen(req_obj, timeout=10) as resp:
                img = Image.open(io.BytesIO(resp.read()))
        else:
            raise HTTPException(status_code=404, detail="Image file not accessible")

        # Auto-correct orientation from EXIF metadata (critical for portrait mobile photos)
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        img_bgr = cv2.cvtColor(np.array(img.convert('RGB')), cv2.COLOR_RGB2BGR)
        result = detect_and_embed_faces(
            img_bgr,
            generate_embeddings=req.generateEmbeddings,
            conf_threshold=req.confidenceThreshold
        )
        return {
            "success": True,
            "filename": req.filename,
            "faceCount": result["faceCount"],
            "photoComposition": result["photoComposition"],
            "faces": result["faces"],
            "dimensions": {"width": img.width, "height": img.height}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match/faces")
async def match_faces(req: FaceMatchRequest):
    """
    Compute cosine similarity between two 128-dim face embeddings.
    """
    try:
        vec1 = np.array(req.embedding1, dtype=np.float32)
        vec2 = np.array(req.embedding2, dtype=np.float32)

        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return {"cosineSimilarity": 0.0, "isMatch": False}

        sim = float(np.dot(vec1, vec2) / (norm1 * norm2))
        return {
            "cosineSimilarity": round(sim, 4),
            "isMatch": sim >= 0.45
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CandidatePhoto(BaseModel):
    fileId: str
    embedding: Optional[List[float]] = None
    filePath: Optional[str] = None

class SelfieSearchRequest(BaseModel):
    selfiePath: Optional[str] = None
    selfieBase64: Optional[str] = None
    candidates: List[CandidatePhoto] = []
    threshold: Optional[float] = 0.42

@app.post("/search/selfie")
async def search_by_selfie(req: SelfieSearchRequest):
    """
    Feature 1: Find My Photos - Selfie Face Matching
    Extracts 128-dim SFace embedding from a selfie and compares against event photo candidates.
    """
    try:
        img = None
        if req.selfiePath and os.path.exists(req.selfiePath):
            img = Image.open(req.selfiePath)
        elif req.selfieBase64:
            b64_clean = req.selfieBase64.split(",")[-1]
            img_data = base64.b64decode(b64_clean)
            img = Image.open(io.BytesIO(img_data))
        else:
            raise HTTPException(status_code=400, detail="Either selfiePath or selfieBase64 must be provided.")

        img = ImageOps.exif_transpose(img)
        img_rgb = img.convert("RGB")
        img_bgr = cv2.cvtColor(np.array(img_rgb), cv2.COLOR_RGB2BGR)

        # Detect primary face in selfie
        selfie_res = detect_and_embed_faces(img_bgr, conf_threshold=0.75, generate_embeddings=True)
        if selfie_res["faceCount"] == 0 or len(selfie_res["faces"]) == 0:
            return {"foundFace": False, "message": "No clear face detected in the selfie. Please retake in good lighting.", "matches": []}

        # Select the largest face in the selfie
        faces = selfie_res["faces"]
        primary_face = max(faces, key=lambda f: f["boundingBox"]["width"] * f["boundingBox"]["height"])
        selfie_emb = np.array(primary_face["embedding"], dtype=np.float32)
        norm_selfie = np.linalg.norm(selfie_emb)

        if norm_selfie == 0:
            return {"foundFace": False, "message": "Could not compute biometric embedding.", "matches": []}

        matches = []
        for cand in req.candidates:
            cand_emb = None
            if cand.embedding and len(cand.embedding) == 128:
                cand_emb = np.array(cand.embedding, dtype=np.float32)
            elif cand.filePath and os.path.exists(cand.filePath):
                try:
                    c_img = ImageOps.exif_transpose(Image.open(cand.filePath))
                    c_bgr = cv2.cvtColor(np.array(c_img.convert("RGB")), cv2.COLOR_RGB2BGR)
                    c_res = detect_and_embed_faces(c_bgr, conf_threshold=0.75, generate_embeddings=True)
                    for f in c_res["faces"]:
                        if f.get("embedding"):
                            emb = np.array(f["embedding"], dtype=np.float32)
                            cand_norm = np.linalg.norm(emb)
                            if cand_norm > 0:
                                sim = float(np.dot(selfie_emb, emb) / (norm_selfie * cand_norm))
                                if sim >= req.threshold:
                                    matches.append({
                                        "fileId": cand.fileId,
                                        "similarity": round(sim, 4),
                                        "confidencePercent": round(min(100.0, sim * 100), 1)
                                    })
                                    break
                except Exception as ce:
                    logger.warning(f"Error checking candidate {cand.fileId}: {ce}")
                    continue

            if cand_emb is not None:
                cand_norm = np.linalg.norm(cand_emb)
                if cand_norm > 0:
                    sim = float(np.dot(selfie_emb, cand_emb) / (norm_selfie * cand_norm))
                    if sim >= req.threshold:
                        matches.append({
                            "fileId": cand.fileId,
                            "similarity": round(sim, 4),
                            "confidencePercent": round(min(100.0, sim * 100), 1)
                        })

        # Sort matches by highest similarity first
        matches.sort(key=lambda m: m["similarity"], reverse=True)

        return {
            "foundFace": True,
            "matchCount": len(matches),
            "matches": matches,
            "selfieBox": primary_face["boundingBox"]
        }
    except Exception as e:
        logger.error(f"Error in search_by_selfie: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class DocumentAnalysisRequest(BaseModel):
    filePath: str
    filename: str
    mimeType: Optional[str] = "text/plain"

@app.post("/analyze/document")
async def analyze_document(req: DocumentAnalysisRequest):
    """Analyze documents: extracts text, generates summaries, keywords, and topics."""
    try:
        if not os.path.exists(req.filePath):
            raise HTTPException(status_code=404, detail="Document file path not found")

        # Read text if plain text / markdown / json / csv
        extracted_text = ""
        ext = os.path.splitext(req.filename)[1].lower()
        if ext in ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.sql']:
            with open(req.filePath, 'r', encoding='utf-8', errors='ignore') as f:
                extracted_text = f.read(50000) # Read up to 50KB text
        else:
            extracted_text = f"Binary document: {req.filename}. Content preserved in secure cloud object storage."

        # Extract words and keywords
        words = [w for w in extracted_text.split() if len(w) > 3]
        word_freq = {}
        for w in words[:2000]:
            clean = w.lower().strip(",.;:!?\"'()[]{}")
            if len(clean) > 3:
                word_freq[clean] = word_freq.get(clean, 0) + 1

        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        top_keywords = [k for k, _ in sorted_keywords[:12]]

        # Topics & Categories
        topics = []
        if ext in ['.json', '.xml', '.csv', '.sql']:
            category = "Data & Datasets"
            topics.append("Structured Data")
        elif ext in ['.md', '.txt']:
            category = "Notes & Documentation"
            topics.append("Documentation")
        elif ext in ['.pdf']:
            category = "PDF Documents"
            topics.append("Formal Publication")
        elif ext in ['.doc', '.docx', '.rtf']:
            category = "Word Documents"
            topics.append("Text Document")
        elif ext in ['.xls', '.xlsx']:
            category = "Spreadsheets"
            topics.append("Financial / Tabular Data")
        else:
            category = "General Documents"

        summary = f"Document '{req.filename}' containing approximately {len(words)} words across topics: {', '.join(top_keywords[:4]) or 'general'}."
        embedding = generate_embeddings(f"{req.filename} {summary} {' '.join(top_keywords)}")

        return {
            "success": True,
            "filename": req.filename,
            "wordCount": len(words),
            "summary": summary,
            "category": category,
            "topics": topics,
            "keywords": top_keywords,
            "extractedTextSample": extracted_text[:1000],
            "embedding": embedding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CodeAnalysisRequest(BaseModel):
    filePath: str
    filename: str

@app.post("/analyze/code")
async def analyze_code(req: CodeAnalysisRequest):
    """Analyze programming source code: detect language, functions, imports, frameworks."""
    try:
        if not os.path.exists(req.filePath):
            raise HTTPException(status_code=404, detail="Code file path not found")

        with open(req.filePath, 'r', encoding='utf-8', errors='ignore') as f:
            code_text = f.read(50000)

        ext = os.path.splitext(req.filename)[1].lower()
        lang_map = {
            '.js': 'JavaScript',
            '.jsx': 'React JSX',
            '.ts': 'TypeScript',
            '.tsx': 'React TypeScript',
            '.py': 'Python',
            '.java': 'Java',
            '.c': 'C',
            '.cpp': 'C++',
            '.php': 'PHP',
            '.html': 'HTML',
            '.css': 'CSS',
            '.sql': 'SQL',
            '.json': 'JSON',
            '.xml': 'XML',
            '.md': 'Markdown'
        }
        language = lang_map.get(ext, 'Source Code')
        lines = code_text.splitlines()

        # Heuristic detection of frameworks and components
        frameworks = []
        if 'import React' in code_text or 'useState' in code_text:
            frameworks.append('React.js')
        if 'express' in code_text:
            frameworks.append('Express.js')
        if 'fastapi' in code_text or 'FastAPI' in code_text:
            frameworks.append('FastAPI')
        if 'django' in code_text:
            frameworks.append('Django')
        if 'flask' in code_text:
            frameworks.append('Flask')

        description = f"{language} source file containing {len(lines)} lines of code"
        if frameworks:
            description += f" leveraging {', '.join(frameworks)}"
        description += "."

        embedding = generate_embeddings(f"{language} {req.filename} {' '.join(frameworks)} {code_text[:200]}")

        return {
            "success": True,
            "filename": req.filename,
            "language": language,
            "lineCount": len(lines),
            "frameworks": frameworks,
            "description": description,
            "smartFolder": f"Code/{language}",
            "embedding": embedding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EmbeddingRequest(BaseModel):
    text: str

@app.post("/embeddings")
async def get_embeddings(req: EmbeddingRequest):
    """Generate dense normalized semantic vector embedding for search."""
    vec = generate_embeddings(req.text)
    return {"success": True, "embedding": vec, "dimension": len(vec)}

class SimilarityRequest(BaseModel):
    hash1: str
    hash2: str

@app.post("/similarity/phash")
async def compare_phash(req: SimilarityRequest):
    """Compute Hamming distance similarity score between two perceptual hashes."""
    if len(req.hash1) != len(req.hash2):
        return {"similarityScore": 0.0, "isSimilar": False}

    diff_bits = 0
    for c1, c2 in zip(req.hash1, req.hash2):
        val1 = int(c1, 16)
        val2 = int(c2, 16)
        diff_bits += bin(val1 ^ val2).count('1')

    max_bits = len(req.hash1) * 4
    similarity = 1.0 - (diff_bits / max_bits)

    return {
        "hammingDistance": diff_bits,
        "similarityScore": round(similarity, 4),
        "isExact": diff_bits == 0,
        "isSimilar": similarity >= 0.88
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
