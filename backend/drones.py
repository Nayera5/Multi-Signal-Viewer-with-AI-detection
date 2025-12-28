# from flask import Blueprint, request, jsonify
# import tensorflow as tf
# import tensorflow_hub as hub
# import librosa
# import numpy as np
# import os

# drones_bp = Blueprint('drones', __name__)

# print("Starting drones blueprint...")

# # Model upload
# print("Loading YAMNet...")
# yamnet = hub.KerasLayer('https://tfhub.dev/google/yamnet/1', trainable=False)
# print("YAMNet loaded successfully")

# print("Loading drone_classifier_new.h5...")
# try:
#     model = tf.keras.models.load_model('drone_classifier_new.h5')
#     print("Model loaded successfully: drone_classifier_new.h5")
# except Exception as e:
#     print(f"Error loading model: {e}")
#     exit()

# #Features extraction
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

# @drones_bp.route('/predict', methods=['POST'])
# def predict():
#     print("Received request at /predict")
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file uploaded'}), 400
    
#     file = request.files['file']
#     if not file.filename.endswith('.wav'):
#         return jsonify({'error': 'File must be WAV'}), 400
    
#     try:
#         temp_path = 'temp.wav'
#         file.save(temp_path)
        
#         # Audio uploading
#         audio, sr = librosa.load(temp_path, sr=16000)
        
#         features = extract_features(audio)
#         if features is None:
#             os.remove(temp_path)
#             return jsonify({'error': 'Invalid audio: silent or near-silent'}), 400
        
#         # prediction
#         features = features.reshape(1, -1)
#         prediction = model.predict(features)[0][0]
#         pred_label = 'Drone' if prediction > 0.5 else 'No Drone'
#         confidence = prediction if prediction > 0.5 else 1 - prediction
        
#         os.remove(temp_path)
        
#         return jsonify({
#             'prediction': pred_label,
#             'confidence': float(confidence)
#         })
#     except Exception as e:
#         if os.path.exists(temp_path):
#             os.remove(temp_path)
#         return jsonify({'error': str(e)}), 500