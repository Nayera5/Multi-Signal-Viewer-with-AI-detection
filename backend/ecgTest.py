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
    # لو جالك DataFrame جاهز
    if isinstance(csv_input, pd.DataFrame):
        df = csv_input.copy()
    else:
        # لو جالك path أو file-like object
        df = pd.read_csv(csv_input)

    # احذف العمود الأول لو هو time
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



# import os
# os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# import numpy as np
# import torch
# import torch.nn as nn
# from transformers import AutoModel
# from safetensors.torch import load_file
# from scipy import signal
# import pandas as pd

# # تعريف الفئات
# CLASSES = ['NORM', 'MI', 'STTC', 'HYP', 'ASMI', 'LVH', 'ISC_', '2AVB']

# # دالة المعالجة
# def preprocess_ecg(ecg_signal):
#     ecg_signal = ecg_signal[:500, :]  # أول 5 ثواني
#     ecg_flat = ecg_signal.T.flatten()  # shape: (channels * samples,)
#     sos = signal.butter(4, [0.05, 47], btype='band', fs=100, output='sos')
#     ecg_filtered = signal.sosfilt(sos, ecg_flat)
#     ecg_norm = 2 * (ecg_filtered - np.min(ecg_filtered)) / (np.max(ecg_filtered) - np.min(ecg_filtered)) - 1
#     return ecg_norm.astype(np.float32)

# # تعريف الـ device
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# # تحميل الموديل الأساسي
# model = AutoModel.from_pretrained("Edoardo-BS/hubert-ecg-base", trust_remote_code=True)
# model.to(device)

# # تعريف مصنف ECG
# class ECGClassifier(nn.Module):
#     def __init__(self, base_model, num_classes=len(CLASSES)):
#         super().__init__()
#         self.base = base_model
#         self.classifier = nn.Linear(base_model.config.hidden_size, num_classes)
    
#     def forward(self, input_values, labels=None):
#         outputs = self.base(input_values)
#         pooled = outputs.last_hidden_state.mean(dim=1)
#         logits = self.classifier(pooled)
#         loss = None
#         if labels is not None:
#             loss_fct = nn.CrossEntropyLoss()
#             loss = loss_fct(logits.view(-1, self.classifier.out_features), labels.view(-1))
#         return {'loss': loss, 'logits': logits} if loss is not None else {'logits': logits}

# # إنشاء الموديل
# classifier = ECGClassifier(model)
# classifier.to(device)

# # تحميل أوزان الموديل
# state_dict = load_file('D:/dsp1/Signal_Viewer/backend/model.safetensors')
# classifier.load_state_dict(state_dict)
# classifier.eval()


# def predict_from_csv(data):
#     try:
#         import pandas as pd

#         if isinstance(data, str):
#             df = pd.read_csv(data, header=None)
#         elif isinstance(data, pd.DataFrame):
#             df = data.copy()
#         else:
#             raise ValueError("Input must be a file path or a pandas DataFrame")

#         df = df.iloc[1:].reset_index(drop=True)

#         ecg_signal = df.apply(pd.to_numeric, errors='coerce').values

#         # معالجة
#         ecg_processed = preprocess_ecg(ecg_signal)

#         # تجهيز input
#         input_tensor = torch.tensor(ecg_processed, dtype=torch.float32).unsqueeze(0).to(device)

#         # تنبؤ
#         outputs = classifier(input_tensor)
#         pred = torch.argmax(outputs['logits'], dim=1)
#         predicted_class = CLASSES[pred.item()]

#         return predicted_class

#     except Exception as e:
#         print(f"Error in predict_from_csv: {e}")
#         return None


# # predict_from_csv("backend/uploads/21781_lr.csv")
