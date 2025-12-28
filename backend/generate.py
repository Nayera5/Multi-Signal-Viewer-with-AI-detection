from flask import Blueprint, request, jsonify
import librosa
import numpy as np
import io
from scipy.io import wavfile
import traceback  # added for detailed error trace
import wave  # built-in for reading WAV
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError

generate = Blueprint("generate", __name__)


@generate.route("/analyze_generated_audio", methods=["POST"])
def analyze_generated_audio():
    print("=== Request received at endpoint ===")
    
    if "file" not in request.files:
        print("Error: No file uploaded")
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        print("Error: No file selected")
        return jsonify({"error": "No file selected"}), 400
    
    try:
        audio_bytes = file.read()
        print(f"File received: name={file.filename}, size={len(audio_bytes)} bytes")
        
        if len(audio_bytes) == 0:
            print("Error: Empty file")
            return jsonify({"error": "Empty audio file"}), 400
        
        # Try reading audio with librosa first
        print("Trying to read audio using librosa (with FFmpeg)...")
        try:
            y, sr = librosa.load(io.BytesIO(audio_bytes), sr=None)
            print(f"Success with librosa! Audio length={len(y)}, sample rate={sr}")
        except Exception as librosa_err:
            print(f"Librosa failed: {librosa_err} – trying pydub...")
            try:
                audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
                if audio.channels > 1:
                    audio = audio.set_channels(1)
                samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
                y = samples / (2 ** (8 * audio.sample_width - 1))
                sr = audio.frame_rate
                print(f"Success with pydub! Audio length={len(y)}, sample rate={sr}")
            except CouldntDecodeError as pydub_err:
                print(f"Pydub failed: {pydub_err}")
                raise Exception("Unable to read the audio file – please check FFmpeg installation")
        
        # Continue with STFT and analysis
        print("Performing STFT...")
        D = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
        print(f"STFT shape: {D.shape}")
        
        print("Converting to dB scale...")
        DB = librosa.amplitude_to_db(D, ref=np.max)
        
        print("Calculating frequency and time axes...")
        freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
        times = librosa.frames_to_time(np.arange(D.shape[1]), sr=sr, hop_length=512)
        
        print("Estimating dominant frequencies...")
        main_freqs = freqs[np.argmax(D, axis=0)]
        
        f_approach = np.max(main_freqs)
        f_recede = np.min(main_freqs)
        f_source = (f_approach + f_recede) / 2
        
        c = 343.0  # speed of sound in air (m/s)
        v = c * (f_approach - f_recede) / (f_approach + f_recede)
        velocities = c * (main_freqs - f_source) / f_source
        
        max_freq_idx = np.where(freqs <= 300)[0][-1] if np.any(freqs <= 300) else len(freqs)
        DB_trimmed = DB[:max_freq_idx, :].tolist()
        freqs_trimmed = freqs[:max_freq_idx].tolist()
        
        print("Analysis successful! f_source=", f_source)
        
        return jsonify({
            "times": times.tolist(),
            "frequencies": main_freqs.tolist(),
            "velocities": velocities.tolist(),
            "spectrogram": DB_trimmed,
            "freq_axis": freqs_trimmed,
            "estimated_velocity": float(v),
            "f_approach": float(f_approach),
            "f_recede": float(f_recede),
            "f_source": float(f_source),
            "sample_rate": int(sr)
        })
        
    except Exception as e:
        print("=== Error during analysis ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error processing audio: {str(e)}"}), 500
