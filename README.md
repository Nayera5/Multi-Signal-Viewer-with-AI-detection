
<div align="center">

# **Multi Signal Viewer with AI detection**

</div>

> ## **Overview**

An integrated web-based application for **multi-domain signal visualization and analysis**, supporting **medical**, **acoustic**, and **radiofrequency** signals.
The viewer integrates multiple AI models and interactive visualization modes for real-time exploration, detection, and classification.

---

## **Included Modules**

#### 🫀 Medical Signals Viewer

- Visualize multi or single-channel `ECG/EEG` signals and detect abnormalities using a pretrained `AI model`.

#### 🔊 Acoustic Signals Viewer

- Vehicle-Passing Doppler Effect: simulate car sounds with controllable `velocity (v)` and `frequency (f)`; estimate both using an AI model from real recordings.
- Drone Detection: detect the presence of drones or submarines among background sounds using an AI classifier.

#### 📡 Radiofrequency Signals Viewer

- Visualize real `SAR` signals and estimate some features.

---
### 🏠 Home Page Preview

Here’s how the main interface of the Signal Viewer looks:

<img width="1876" height="860" alt="Screenshot 2025-10-11 022524" src="https://github.com/user-attachments/assets/1053632c-122e-443c-be33-453c36f16971" />

 

---

##  1) Medical Signals Viewer:
### Key features
- Support for multi or single-channel ECG/EEG recordings.

- Automatic abnormality detection.
- Four viewer modes:

  - `Continuous-time viewer` — scrolling viewport with navigate, zoom, and pan controls.

  - `XOR graph` — divide the signal into chunks and overlay them using XOR: identical chunks cancel out.

  - `Polar graph`

  - `Reoccurrence graph` — cumulative scatter plot of channel pairs (chx vs chy) to reveal recurring patterns.
---
## ECG demo:
https://github.com/user-attachments/assets/1f8cae3d-d468-4c2f-a2fd-790cdaea2af0

### another abnormal signal: LVH 
<img width="1891" height="879" alt="Screenshot 2025-10-11 173936" src="https://github.com/user-attachments/assets/a91ccbcb-f20a-4951-b42b-4d1be1d1d545" />

---

## EEG demo:
<img width="1882" height="913" alt="Screenshot 2025-10-11 173622" src="https://github.com/user-attachments/assets/072f3820-1d16-419d-a1d2-ca37d40e791b" />
<img width="1893" height="883" alt="Screenshot 2025-10-11 173807" src="https://github.com/user-attachments/assets/2f7b88b4-fa0d-4197-af05-d06706c2e09f" />

---
##  2) Acoustic Signals Viewer:
### 🚗 Doppler Effect Detection
- Uses spectrogram analysis (STFT) to track frequency changes over time and detect peaks:  
  - fₐₚₚ → approaching frequency  
  - fᵣₑc → receding frequency  
- Estimates car speed in m/s or km/h using:  
  v = c × (fₐₚₚ - fᵣₑc) / (fₐₚₚ + fᵣₑc)

  

https://github.com/user-attachments/assets/0c624394-fd13-47d5-a047-c15473fbe8d7


---

### 🚗 Doppler Car Sound Generator

- This project simulates the Doppler effect by generating the sound of a car passing by with `velocity v` and `horn frequency f`.
- The user can control both parameters, and a spectrogram is displayed to visualize the frequency shift as the car approaches and moves away.


https://github.com/user-attachments/assets/821903a0-b514-41f8-a358-9ce49b9b1b24


---

### Drone

This module detects drones from `WAV audio files` using `YAMNet` for feature extraction and a custom classifier, it enables users to upload audio and view predictions


https://github.com/user-attachments/assets/6ac30b0b-c72d-4ced-aeac-317559399c1e


---
## 3)SAR
<img width="816" height="896" alt="Screenshot 2025-10-10 185152" src="https://github.com/user-attachments/assets/c3867432-e5c8-4bd2-95ee-56c904ab44f3" />

<img width="812" height="507" alt="Screenshot 2025-10-10 185158" src="https://github.com/user-attachments/assets/eb6c8a3b-68f4-4104-b1d4-0e1266e8d606" />


---
   
### Technologies Used

| Layer | Tools & Frameworks | Description | Data / Model Source |
|:------|:-------------------|:-------------|:--------------------|
| **Frontend** | React.js, react-plotly.js | Interactive UI for real-time signal visualization and user controls. | — |
| **Backend** | Flask (Python) | Handles signal processing, AI model inference, and data communication with the frontend. | — |
| **AI / ML Models** | TensorFlow | Pretrained models for abnormality detection (ECG/EEG), Doppler parameter estimation, and sound classification. | [ECG model](https://github.com/Edoar-do/HuBERT-ECG),  [Drone Model](https://github.com/tensorflow/models/tree/master/research/audioset/yamnet), EEG model using `CSP` and `classifier`|
| **Data Formats** | CSV | Supported formats for signal input/output. | [PhysioNet_ecg dataset](https://physionet.org/content/ptb-xl/1.0.3/), [Drones dataset](https://github.com/saraalemadi/DroneAudioDataset), [Car_sound dataset](https://slobodan.ucg.ac.me/science/vse/),EEG_dataset from brainlat |

---

## 👥 Contributors
| [Nayera Sherif](https://github.com/Nayera5) | [Nada Hesham](https://github.com/Nada-Hesham249) | [Shahd Ayman](https://github.com/Shahd-Ayman5) | [Nada Hassan](https://github.com/Nadahassan147) |
|-------------------------------|---------------------------|-----------------------------------|-------------------------------|





---
