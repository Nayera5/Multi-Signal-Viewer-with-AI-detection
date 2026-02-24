import os
import uuid
import traceback
from flask import Blueprint, request, jsonify

import torch
from model import ECAPA_gender

gender_bp = Blueprint('gender', __name__)

# Load model once at import time
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
try:
    model = ECAPA_gender.from_pretrained("JaesungHuh/voice-gender-classifier")
    model.to(device)
    model.eval()
except Exception as e:
    # If pretrained weights are not available, model will remain None and route will return error
    print("Warning: failed to load gender model:", e)


@gender_bp.route('/predict', methods=['POST'])
def predict_gender():
    if model is None:
        return jsonify({"status": "error", "message": "Model not available on server"}), 500

    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No file selected"}), 400

    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)

    # safe unique filename
    ext = os.path.splitext(file.filename)[1] or '.wav'
    filename = f"gender_{uuid.uuid4().hex}{ext}"
    path = os.path.join(uploads_dir, filename)
    try:
        file.save(path)
        # model.predict expects a file path
        with torch.no_grad():
            pred = model.predict(path, device=device)
        return jsonify({"status": "success", "prediction": pred})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
