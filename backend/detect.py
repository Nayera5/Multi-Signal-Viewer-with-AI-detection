from flask import Blueprint, request, jsonify
import librosa
import numpy as np
from scipy.signal import medfilt, find_peaks
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

        # STFT parameters 
        n_fft = 8192  # best accuracy of frequency
        hop_length = 256  # high time accuracy{small time} 
        
        D = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
        DB = librosa.amplitude_to_db(D, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        times = librosa.frames_to_time(np.arange(D.shape[1]), sr=sr, hop_length=hop_length)

        
        freq_min, freq_max = 100, 10000
        freq_mask = (freqs >= freq_min) & (freqs <= freq_max)
        
        D_filtered = D[freq_mask, :]
        DB_filtered = DB[freq_mask, :]
        freqs_filtered = freqs[freq_mask]

        main_freqs = []
        for i in range(D_filtered.shape[1]):
            col = D_filtered[:, i]
            
            # search for peaks
            peaks, properties = find_peaks(col, height=np.max(col) * 0.3, distance=10)
            
            if len(peaks) > 0:

                strongest_peak = peaks[np.argmax(col[peaks])]

                #using parabolic interpolation 
                if strongest_peak > 0 and strongest_peak < len(col) - 1:
                    y0, y1, y2 = col[strongest_peak-1], col[strongest_peak], col[strongest_peak+1]
                    offset = 0.5 * (y0 - y2) / (y0 - 2*y1 + y2) if (y0 - 2*y1 + y2) != 0 else 0
                    peak_freq = freqs_filtered[strongest_peak] + offset * (freqs_filtered[1] - freqs_filtered[0])
                    main_freqs.append(peak_freq)
                else:
                    main_freqs.append(freqs_filtered[strongest_peak])
            else:
                # fallback
                main_freqs.append(freqs_filtered[np.argmax(col)])
        
        main_freqs = np.array(main_freqs)
        
        # median filter 
        kernel_size = min(11, len(main_freqs) if len(main_freqs) % 2 == 1 else len(main_freqs) - 1)
        if kernel_size >= 3:
            main_freqs = medfilt(main_freqs, kernel_size=kernel_size)
        

        valid_start = int(len(main_freqs) * 0.15)
        valid_end = int(len(main_freqs) * 0.85)
        valid_freqs = main_freqs[valid_start:valid_end]
        
        f_approach = np.percentile(valid_freqs, 98)  # أعلى 2%
        f_recede = np.percentile(valid_freqs, 2)     # أقل 2%
        
        f_source = np.sqrt(f_approach * f_recede)
        
        c = 343.0 

        v = c * (f_approach - f_recede) / (f_approach + f_recede)
        
        velocities = c * (main_freqs - f_source) / f_source

        return jsonify({
            "times": times.tolist(),
            "frequencies": main_freqs.tolist(),
            "velocities": velocities.tolist(),
            "spectrogram": DB_filtered.tolist(),
            "freq_axis": freqs_filtered.tolist(),
            "estimated_velocity": float(v),
            "f_approach": float(f_approach),
            "f_recede": float(f_recede),
            "f_source": float(f_source)
        })
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500