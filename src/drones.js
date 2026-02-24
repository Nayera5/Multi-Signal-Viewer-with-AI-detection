import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaPlay, FaPlayCircle, FaHome } from 'react-icons/fa';
import { decodeAudioFile, processAudioToWav } from './Sound_Downsampling';
import './CSS_files/drones.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const DRONE_DETECTION_ENDPOINT = process.env.REACT_APP_DRONE_DETECTION_ENDPOINT;

function Drone() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalSamplingRate, setOriginalSamplingRate] = useState(48000); 
  const [selectedSamplingRate, setSelectedSamplingRate] = useState(48000);
  const [processedAudio, setProcessedAudio] = useState(null);

  const audioRef = useRef(null);

  
  const updateAudioSource = (blob) => {
    if (audioRef.current?.src) {
      URL.revokeObjectURL(audioRef.current.src); 
    }
    const wavUrl = URL.createObjectURL(blob);
    setProcessedAudio(blob);
    audioRef.current.src = wavUrl;
  };

  // upload file
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPrediction(null);
    setError(null);
    setProcessedAudio(null);

    try {
   //original 
      const rate = await decodeAudioFile(selectedFile);
      setOriginalSamplingRate(rate);
      setSelectedSamplingRate(rate);

      // downsampling  
      const wavBlob = await processAudioToWav(selectedFile, rate);
      updateAudioSource(wavBlob);

    } catch (err) {
      console.error(err);
      setError('Error processing file');
    }
  };

  // slider change
  const handleSamplingRateChange = async (event) => {
    const newRate = parseInt(event.target.value);
    setSelectedSamplingRate(newRate);

    if (file) {
      try {
        const wavBlob = await processAudioToWav(file, newRate);
        updateAudioSource(wavBlob);
      } catch (err) {
        setError('Error resampling audio');
        console.error(err);
      }
    }
  };

  // predict
  const predictDrone = async () => {
    if (!processedAudio) {
      setError('Please upload and process a file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', processedAudio, `audio_${selectedSamplingRate}.wav`);

    try {
      const response = await axios.post(`${apiBaseUrl}${DRONE_DETECTION_ENDPOINT}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPrediction(response.data.prediction);
      setError(null);
    } catch (err) {
      setPrediction(null);
      setError(err.response?.data?.error || err.message || 'Error processing file');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    audioRef.current?.play().catch(console.error);
  };

  return (
    <div className="drone-container">
      <div className="icons-wrapper">
        <div className="home-icon-container">
          <FaHome className="icon" size={30} color="#e790f6" onClick={() => navigate('/')} />
        </div>
        <div className="center-icons">
          <div className="icon-container">
            <FaUpload className="icon" size={30} color="#e790f6" onClick={() => document.getElementById('file-input').click()} />
            <span className="icon-label">Upload</span>
          </div>
          <div className="icon-container">
            <FaPlay className="icon detect-icon" size={30} onClick={predictDrone} disabled={loading} />
            <span className="icon-label">{loading ? 'Processing...' : 'Detect'}</span>
          </div>
        </div>
      </div>

      <h1>🛰 Drone Detection</h1>

      <div className="upload-section">
        <input id="file-input" type="file" accept=".wav" onChange={handleFileChange} style={{ display: 'none' }} />
        <audio ref={audioRef} style={{ display: 'none' }} />

        {file && (
          <div className="file-info-drone">
            <p>📄 {file.name}</p>
            <div className="record-bar" onClick={playAudio}>
              <FaPlayCircle className="record-icon" />
              <span style={{ color: '#e790f6', marginLeft: '10px', fontSize: '14px', fontWeight: '500' }}>Play Audio</span>
            </div>

            {/* Slider for Sample Rate */}
            <label style={{ color: '#c9d1d9', fontSize: '15px', fontWeight: '500', marginTop: '15px', display: 'block' }}>
              Sampling Rate: {selectedSamplingRate} Hz
            </label>
            <input
              type="range"
              min="1000"
              max={originalSamplingRate || 48000} 
              step="500"
              value={selectedSamplingRate}
              onChange={handleSamplingRateChange}
              style={{ width: '250px', marginTop: '5px' }}
            />
          </div>
        )}
      </div>

      {prediction && <div className="result"><p>🎯 Prediction: {prediction}</p></div>}
      {error && <p className="error">⚠️ {error}</p>}
    </div>
  );
}

export default Drone;


