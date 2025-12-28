<div align="center">

# **Multi Signal Viewer with AI Detection and Adaptive Sampling**

</div>

> ## **Overview**

The **Multi Signal Viewer** is an integrated web-based application for **multi-domain signal visualization, processing, and AI-assisted analysis**.
It now includes a **unified adaptive sampling framework** applied across all supported domains — allowing users to control and analyze signal behavior under different sampling frequencies, while ensuring accuracy through built-in **anti-aliasing filters**.

The system supports real-time exploration, AI detection, and classification for **🫀 Medical**, **🔊 Acoustic and Speech Signals Viewer**, and **📡 Radiofrequency** signals, with newly added support for **human speech signals** and adaptive preprocessing.

## Downsampling control:

Added a **downsampling feature** that lets the user change the sampling frequency of the displayed signal using a slider. The slider accepts any target sampling frequency **less than the original sampling rate**.

---

### 🏠 Home Page Preview

<img width="1876" height="860" alt="Screenshot 2025-10-11 022524" src="https://github.com/user-attachments/assets/1053632c-122e-443c-be33-453c36f16971" />

---

# 1) Medical Signals Viewer

### Key features

* Support for multi or single-channel ECG/EEG recordings.
* Automatic abnormality detection.
* Real-time adaptive `downsampling` with visual and AI-based feedback.
* pause and play the signal.
* Four viewer modes:

  * `Continuous-time viewer`  |  `XOR graph`  |  `Polar graph`  |  `Reoccurrence graph` 
---

## **Behavior and UI**
* When the user moves the slider, the viewer uses `scipy.signal` to automatically **resample** the signal to the selected frequency.
    🔹*In simple terms:* this step removes the high-frequency parts of the signal and then reduces the number of samples so the new version looks the same but is smoother and slower.
* The new signal is then used both for display and for processing.
* A small readout next to the slider shows the current target sampling frequency and the original sampling frequency.

## ECG
https://github.com/user-attachments/assets/72720ea9-107b-4303-9d10-904569dfa5c2

## EEG


https://github.com/user-attachments/assets/abb05cc4-ef02-4806-8a70-7ce30fc265aa

---
## Known issue: AI detection mismatch after downsampling

**Symptom:** After using the downsampling slider to reduce the displayed sampling frequency, running the integrated AI detection model sometimes produces an **incorrect / false result** (for example: an abnormal signal is labeled as "normal", misclassification of rhythm, or wrong event timing).

**Observed effects**

* Temporal features (peaks, QRS onset) may shift slightly due to filtering and resampling, affecting detectors that rely on precise timing.
* Spectral features are altered (loss of high-frequency content) which can degrade classifiers trained on higher-bandwidth inputs.

## ECG
### after downsampling detects normal although the signal is for atrial fibrillation
<img width="1907" height="876" alt="Screenshot 2025-10-26 205258" src="https://github.com/user-attachments/assets/86a2e8fd-0f50-40fb-916e-af62199ca164" />

## EEG
### after downsampling detects another type of disease
<img width="1886" height="889" alt="Screenshot 2025-10-26 205725" src="https://github.com/user-attachments/assets/ea7f14a9-820b-494c-92e1-fe411055ef6d" />

---

 
# 2) 🗣️ Speech Signals Viewer
* Interactive human speech feature:
  * allowing users to listen to voice recordings and use an AI classifier to detect whether the speaker is male or female.
  * When users apply downsampling, the voice naturally changes — causes noticeable **aliasing and distortion** in high-frequency components such as `s` or `sh` sounds.
  * To handle this, we introduced the **Speech Anti-Aliasing Model** 

Speech samples are played, then downsampled using a slider that controls the sampling rate. The audio before and after downsampling reveal how lowering the sampling frequency affects speech clarity and introduces noise, showing the impact of sampling rate on human voice perception.


https://github.com/user-attachments/assets/e09a10ea-5f7f-4e27-a444-dc9f81b4cd9a

---
# 3) Acoustic Signals Viewer

## 🚗 Car Sound Detection

This part focuses on detecting the frequency and speed of car sounds. The audio signals are downsampled to observe how reducing the sampling rate affects the sound characteristics. The spectrogram and the audio playback are displayed before and after downsampling to visualize and hear the changes in frequency content and clarity.

https://github.com/user-attachments/assets/4103c3a5-1a06-4a0e-9e3a-e31e8b3e8367

---
## 🚗 Car Sound Generation

Car sounds are generated and played to demonstrate how downsampling impacts the quality of the audio. A slider is used to adjust the sampling rate, allowing users to notice how the sound becomes noisier or distorted at lower rates.


https://github.com/user-attachments/assets/a07983a8-afff-48c0-88cc-ee5cef667ed5

---
## Drone Audio Classification
This module uses an AI model to detect whether an audio input belongs to a drone or non-drone source.
Users can upload or record a sound, and the system analyzes its acoustic features to predict the class in real time.

### New feature: Downsampling control 
An interactive downsampling slider allows users to reduce the sampling rate of the audio. When downsampling is applied, important high-frequency features of the drone sound are lost — causing the model to misclassify the sound as non-drone.

https://github.com/user-attachments/assets/3cab414f-03bc-4bac-b10a-2f9b2a8e4bbf

---
## SAR 
<img width="816" height="896" alt="Screenshot 2025-10-10 185152" src="https://github.com/user-attachments/assets/3a44a824-a287-46bb-bdb5-191393626fdf" />

---
## SAR - after downsampling (less pixles)
<img width="1817" height="839" alt="Screenshot 2025-10-26 205804" src="https://github.com/user-attachments/assets/c137f6d5-8408-4818-b8ae-0e005f2004bb" />
<img width="1429" height="778" alt="Screenshot 2025-10-26 205815" src="https://github.com/user-attachments/assets/797e0f6f-3c0d-4bd7-92c5-34573b975de4" />

---

### Technologies Used

| Layer | Tools & Frameworks | Description | Data / Model Source |
|:------|:-------------------|:-------------|:--------------------|
| **Frontend** | React.js, react-plotly.js | Interactive UI for real-time signal visualization and user controls. | — |
| **Backend** | Flask (Python) | Handles signal processing, AI model inference, and data communication with the frontend. | — |
| **AI / ML Models** | TensorFlow | Pretrained models for abnormality detection (ECG/EEG), Doppler parameter estimation, and sound classification. | [ECG model](https://zenodo.org/records/3765717),  [Drone Model](https://github.com/tensorflow/models/tree/master/research/audioset/yamnet), EEG model using `CSP` and `classifier`,[Gender_classification_model](https://huggingface.co/JaesungHuh/voice-gender-classifier)
| **Sampling** | Scipy.Signals | — | — |
| **Anti-Aliasing** | VoiceFixer lib | — |— |
| **Data** | CSV , .wav | Supported formats for signal input/output. | [PhysioNet_ecg dataset](https://physionet.org/content/ptb-xl/1.0.3/), [Drones dataset](https://github.com/saraalemadi/DroneAudioDataset), [Car_sound dataset](https://slobodan.ucg.ac.me/science/vse/),EEG_dataset from brainlat |




## 👥 Contributors
| [Nayera Sherif](https://github.com/Nayera5) | [Nada Hesham](https://github.com/Nada-Hesham249) | [Shahd Ayman](https://github.com/Shahd-Ayman5) | [Nada Hassan](https://github.com/Nadahassan147) |
|-------------------------------|---------------------------|-----------------------------------|-------------------------------|


