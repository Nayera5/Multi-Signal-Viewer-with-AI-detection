import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaPlay, FaPlayCircle, FaHome } from 'react-icons/fa';
import './CSS_files/drones.css';

function Drone() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setPrediction(null);
    setError(null);

    if (selectedFile && selectedFile.name.endsWith('.wav')) {
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(selectedFile);
      }
    }
  };

  const predictDrone = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    if (!file.name.endsWith('.wav')) {
      setError('File must be WAV');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/drones/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPrediction(response.data.prediction);
      setError(null);
    } catch (err) {
      console.error('Error details:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Error processing file'
      );
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        setError('Error playing audio');
        console.error('Error details:', err);
      });
    } else {
      setError('No audio file loaded');
    }
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
        <input
          id="file-input"
          type="file"
          accept=".wav"
          onChange={handleFileChange}
          className="file-input"
          style={{ display: 'none' }}
        />
        <audio ref={audioRef} style={{ display: 'none' }} />
        {file && (
          <div className="file-info-drone">
            <p>📄 {file.name}</p>
            <div className="record-bar" onClick={playAudio}>
              <FaPlayCircle className="record-icon" />
              <span style={{ color: '#e790f6', marginLeft: '10px', fontSize: '14px', fontWeight: '500' }}>Play Audio</span>
            </div>
          </div>
        )}
      </div>
      {prediction && (
        <div className="result">
          <p>🎯 Prediction: {prediction}</p>
        </div>
      )}
      {error && <p className="error">⚠️ Error: {error}</p>}
    </div>
  );
}

export default Drone;