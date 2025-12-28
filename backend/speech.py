import os
import uuid
import traceback
from flask import Blueprint, request, jsonify,send_file
from voicefixer import VoiceFixer
import torch
from model import ECAPA_gender
from antiAlias import restore_and_stream
vf = VoiceFixer()


speech_bp = Blueprint('speech', __name__)

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



@speech_bp.route('/predict', methods=['POST'])
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
    


@speech_bp.route('/restore', methods=['POST'])
def restore_audio():
    uploaded_file = request.files["file"]

    input_path = "temp_input.wav"
    uploaded_file.save(input_path)

    buffer= restore_and_stream(input_path, mode=0, use_cuda=False)

    os.remove(input_path)

    return send_file(
        buffer,
        mimetype="audio/wav",
        as_attachment=False,
    )
    

