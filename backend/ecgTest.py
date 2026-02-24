import numpy as np
import pandas as pd
from keras.models import load_model

model = load_model("model.hdf5", compile=False)

def preprocess_ecg_csv(csv_input, target_length=4096):
    """
    Accepts either:
    - a path to CSV file (str)
    - a pandas DataFrame (already loaded)
    - or a file-like object
    """
    
    if isinstance(csv_input, pd.DataFrame):
        df = csv_input.copy()
    else:
        df = pd.read_csv(csv_input)

    #delete time column if present
    if df.columns[0].lower() in ["time", "t","Time"]:
        df = df.iloc[:, 1:]

    signals = df.values
    orig_leads = list(df.columns)

    mapping = {
        'I': 'DI', 'II': 'DII', 'III': 'DIII',
        'AVR': 'AVR', 'AVL': 'AVL', 'AVF': 'AVF',
        'V1': 'V1', 'V2': 'V2', 'V3': 'V3',
        'V4': 'V4', 'V5': 'V5', 'V6': 'V6'
    }

    mapped_leads = [mapping.get(lead, None) for lead in orig_leads]
    model_leads = ['DI', 'DII', 'DIII', 'AVR', 'AVL', 'AVF',
                   'V1', 'V2', 'V3', 'V4', 'V5', 'V6']

    indices = []
    for lead in model_leads:
        if lead in mapped_leads:
            indices.append(mapped_leads.index(lead))

    if not indices:
        raise ValueError("No matching ECG leads found between CSV and model mapping")

    signals_selected = signals[:, indices]
    curr_len = signals_selected.shape[0]

    # adjust length
    if curr_len > target_length:
        signals_selected = signals_selected[:target_length, :]
    elif curr_len < target_length:
        padding = np.zeros((target_length - curr_len, signals_selected.shape[1]))
        signals_selected = np.vstack([signals_selected, padding])

    # normalize
    signals_norm = (signals_selected - np.mean(signals_selected, axis=0)) / (np.std(signals_selected, axis=0) + 1e-8)
    return np.expand_dims(signals_norm, axis=0)


def ecg_prediction(csv_input):
    """Predict ECG abnormality from CSV or DataFrame"""
    ecg_input = preprocess_ecg_csv(csv_input)
    prediction = model.predict(ecg_input)
    threshold=0.3

    abnormalities = ["1dAVb", "RBBB", "LBBB", "SB", "AF", "ST"]

    max_prob = float(np.max(prediction))
    max_class = abnormalities[int(np.argmax(prediction))]

    if max_prob < threshold:
        result = "Normal"
    else:
        result = max_class

    return result



