import numpy as np
import pandas as pd
import joblib

MODEL_PATH = "EEG_MODEL.pkl"
bundle = joblib.load(MODEL_PATH)
model = bundle["model"]   
labels = bundle["labels"]

def predict_eeg_csv(df):
    if "Time (s)" in df.columns:
        df = df.drop(columns=["Time (s)"])

    data = df.to_numpy().T  

    window_size = 128
    segments = []
    for start in range(0, data.shape[1] - window_size, window_size):
        segments.append(data[:, start:start+window_size])

    if not segments:
        raise ValueError("❌ Data too short for 128-sample windows.")

    X_segments = np.array(segments)
    preds = model.predict(X_segments)
    final_pred = labels[np.bincount(preds).argmax()]

    return final_pred
