# car.py
from flask import Blueprint, request, jsonify
import librosa
import numpy as np
from werkzeug.utils import secure_filename

detect = Blueprint("detect", __name__)

@detect.route("/upload_car", methods=["POST"])
def upload_car():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith(".wav"):
        return jsonify({"error": "Only .wav files are supported"}), 400

    try:
        y, sr = librosa.load(file, sr=44100)

        # STFT parameters - أصغر علشان دقة أفضل
        n_fft = 4096  # زودنا علشان frequency resolution أحسن
        hop_length = 512
        
        D = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
        DB = librosa.amplitude_to_db(D, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        times = librosa.frames_to_time(np.arange(D.shape[1]), sr=sr, hop_length=hop_length)

        # حدد range معقول للترددات (200Hz - 8000Hz مناسب لصوت عربيات)
        freq_min, freq_max = 200, 8000
        freq_mask = (freqs >= freq_min) & (freqs <= freq_max)
        
        # خد الـ spectrogram في الـ range ده بس
        D_filtered = D[freq_mask, :]
        DB_filtered = DB[freq_mask, :]
        freqs_filtered = freqs[freq_mask]

        # Dominant frequency في كل time frame
        main_freqs = freqs_filtered[np.argmax(D_filtered, axis=0)]

        # Doppler velocity calculation
        f_approach = np.max(main_freqs)
        f_recede = np.min(main_freqs)
        f_source = (f_approach + f_recede) / 2
        
        c = 343.0  # سرعة الصوت
        v = c * (f_approach - f_recede) / (f_approach + f_recede)
        
        # حساب السرعة لكل frame
        velocities = c * (main_freqs - f_source) / f_source

        return jsonify({
            "times": times.tolist(),
            "frequencies": main_freqs.tolist(),
            "velocities": velocities.tolist(),
            "spectrogram": DB_filtered.tolist(),
            "freq_axis": freqs_filtered.tolist(),
            "estimated_velocity": float(v)
        })
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500