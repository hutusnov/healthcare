import os

os.environ.setdefault("DISABLE_MODEL_SOURCE_CHECK", "True")

from paddleocr import TextDetection
import matplotlib.pyplot as plt
from PIL import Image

from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from util import *;

import numpy as np
import cv2
import json
import shutil
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DETECTION_MODEL_DIR = os.path.join(MODELS_DIR, "paddle_det")
RECOGNITION_MODEL_PATH = os.path.join(MODELS_DIR, "vgg_seq2seq.pth")
OUTPUT_DIR = os.path.join("/tmp", "ocr-output")

_recognizer = None
_detector = None

def load_recognizer_model():
    config = Cfg.load_config_from_name('vgg_seq2seq')

    config['weights'] = RECOGNITION_MODEL_PATH
    config['cnn']['pretrained']=False
    config['device'] = 'cpu'

    recognizer = Predictor(config)
    return recognizer

def get_recognizer():
    global _recognizer
    if _recognizer is None:
        _recognizer = load_recognizer_model()
    return _recognizer

def get_detector():
    global _detector
    if _detector is None:
        _detector = TextDetection(
            model_name="PP-OCRv5_mobile_det",
            model_dir=DETECTION_MODEL_DIR
        )
    return _detector



def detect(image: np.ndarray):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model = get_detector()
    output = model.predict(image)
    for res in output:
        res.print()
        res.save_to_img(save_path=OUTPUT_DIR)
        res.save_to_json(save_path=os.path.join(OUTPUT_DIR, "res.json"))





def recog(img_path: str,
          detect_json_path: str,
          output_json_path: str,
          save_path: str = "./temp_crops"):
    
    # 1) Load ảnh + file detect
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    with open(detect_json_path, "r", encoding="utf-8") as f:
        det_res = json.load(f)

    polys = det_res["dt_polys"]           # list 4 điểm
    # det_scores = det_res["dt_scores"]     # cùng chiều dài

    items = []

    for idx, poly in enumerate(polys):
        poly_np = np.array(poly, dtype=np.int32)

        # ===== CROP THEO CÁCH CỦA BẠN =====
        x_min = max(0, np.min(poly_np[:, 0]))
        y_min = max(0, np.min(poly_np[:, 1]))
        x_max = min(w, np.max(poly_np[:, 0]))
        y_max = min(h, np.max(poly_np[:, 1]))

        crop = img[y_min:y_max, x_min:x_max]


        # 3) Nhận dạng text từ crop
        # TODO: thay bằng hàm rec thực tế của bạn
        recognizer = get_recognizer()
        img_crop = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))

        text = recognizer.predict(img_crop)
        

        # 4) Tính tâm box
        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]
        cx = sum(xs) / 4.0
        cy = sum(ys) / 4.0

        items.append({
            "poly": poly,
            "text": text,
            "cx": cx,
            "cy": cy
        })

    # 5) Lưu lại file JSON mới
    full_res = {
        "filename": img_path,
        "items": items
    }

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(full_res, f, ensure_ascii=False, indent=2)
    print(f"Đã lưu JSON đầy đủ vào: {output_json_path}")
    






def run_ocr(img_path: str,
            out_put: str = "out.json"):
    img = cv2.imread(img_path)
    detect(img)
    recog(img_path=img_path,
          detect_json_path=os.path.join(OUTPUT_DIR, "res.json"),
          output_json_path=out_put)
    
    with open(out_put, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = data["items"]

    info = {
        "full_name": "",
        "country": "",
        "gender": "",
        "date_of_birth": "",
        "address": "",
    }

    
    info["full_name"] = extract_full_name(items)
    info["date_of_birth"]       = extract_dob(items)
    info["gender"], info["country"] = extract_gender_country(items)
    info["address"]   = extract_address(items)


    return info, items
