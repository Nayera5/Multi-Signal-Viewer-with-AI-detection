# from flask import Blueprint, request, jsonify
# import tensorflow as tf
# import tensorflow_hub as hub
# import librosa
# import numpy as np
# import os
# from werkzeug.utils import secure_filename

# drones = Blueprint('drones', __name__)

# # Load YAMNet and the trained model
# yamnet = hub.KerasLayer('https://tfhub.dev/google/yamnet/1', trainable=False)
# model = tf.keras.models.load_model('drone_classifier_new.h5')

# def extract_features(audio, sr=16000):
#     target_length = 15600
#     if len(audio) > target_length:
#         audio = audio[:target_length]
#     else:
#         audio = np.pad(audio, (0, target_length - len(audio)))
    
#     if np.max(np.abs(audio)) < 1e-6:
#         return None
    
#     audio = audio / np.max(np.abs(audio))
#     scores, embeddings, _ = yamnet(audio)
#     return tf.reduce_mean(embeddings, axis=0).numpy()

# @drones.route('/predict', methods=['POST'])
# def predict():
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file provided'}), 400
    
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({'error': 'No file selected'}), 400
    
#     if not file.filename.endswith('.wav'):
#         return jsonify({'error': 'File must be WAV'}), 400

#     try:
#         # Save the file temporarily
#         filename = secure_filename(file.filename)
#         temp_path = os.path.join('temp', filename)
#         os.makedirs('temp', exist_ok=True)
#         file.save(temp_path)

#         # Load audio
#         audio, sr = librosa.load(temp_path, sr=16000)
#         features = extract_features(audio, sr)
        
#         if features is None:
#             os.remove(temp_path)
#             return jsonify({'error': 'Invalid audio data'}), 400

#         # Predict
#         features = features.reshape(1, -1)
#         prediction = model.predict(features)[0][0]
#         pred_label = 'Drone' if prediction > 0.5 else 'No Drone'

#         # Clean up
#         os.remove(temp_path)

#         return jsonify({'prediction': pred_label})
#     except Exception as e:
#         if os.path.exists(temp_path):
#             os.remove(temp_path)
#         return jsonify({'error': str(e)}), 500
from flask import Blueprint, request, jsonify
import tensorflow as tf
import tensorflow_hub as hub
import librosa
import numpy as np
import os
from werkzeug.utils import secure_filename

drones = Blueprint('drones', __name__)

# Load YAMNet and the trained model
yamnet = hub.KerasLayer('https://tfhub.dev/google/yamnet/1', trainable=False)
model = tf.keras.models.load_model('drone_classifier_new.h5')

def extract_features(audio, sr):
    target_length = int(sr * 0.975)  # نفس المدة الزمنية تقريبًا بغض النظر عن الـ SR
    if len(audio) > target_length:
        audio = audio[:target_length]
    else:
        audio = np.pad(audio, (0, target_length - len(audio)))

    if np.max(np.abs(audio)) < 1e-6:
        return None

    # Normalize
    audio = audio / np.max(np.abs(audio))

    # ✅ Resample manually to 16k ONLY if higher than 16000
    # (to keep YAMNet stable but still reflect aliasing at lower SR)
    if sr > 16000:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
        sr = 16000

    # Extract embeddings
    scores, embeddings, _ = yamnet(audio)
    return tf.reduce_mean(embeddings, axis=0).numpy()

@drones.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.endswith('.wav'):
        return jsonify({'error': 'File must be WAV'}), 400

    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join('temp', filename)
        os.makedirs('temp', exist_ok=True)
        file.save(temp_path)

        # ✅ Load with original sampling rate (no fixed 16k)
        audio, sr = librosa.load(temp_path, sr=None)  

        features = extract_features(audio, sr)
        if features is None:
            os.remove(temp_path)
            return jsonify({'error': 'Invalid audio data'}), 400

        # Predict
        features = features.reshape(1, -1)
        prediction = model.predict(features)[0][0]
        pred_label = 'Drone' if prediction > 0.5 else 'No Drone'

        os.remove(temp_path)
        return jsonify({
            'prediction': pred_label,
            'sampling_rate': sr,
            'aliasing_expected': sr < 14000  # مجرد تنبيه إضافي
        })

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': str(e)}), 500
