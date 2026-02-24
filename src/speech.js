import React, { useState, useRef } from "react";
import "./CSS_files/speech.css";
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowCircleUp, FaArrowLeft } from 'react-icons/fa';
import { RiRobot2Line } from "react-icons/ri";
import { processAudioToWav, decodeAudioFile } from './Sound_Downsampling.js';

function Speech() {
  const [sampleRate, setSampleRate] = useState(48000); 
  const [originalRate, setOriginalRate] = useState(48000); 
  const [fileName, setFileName] = useState('');
  const [processedAudio, setProcessedAudio] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;


  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const themeColor = '#6ac1e4';

//file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setAiResult(null);
    setProcessedAudio(null);

    try {
      const rate = await decodeAudioFile(file);
      setOriginalRate(rate);
      setSampleRate(rate);

      const wavBlob = await processAudioToWav(file, rate);
      setProcessedAudio(wavBlob);
      audioRef.current.src = URL.createObjectURL(wavBlob);
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };

  const handleSampleRateChange = async (e) => {
    const newRate = parseInt(e.target.value);
    setSampleRate(newRate);

    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      try {
        const wavBlob = await processAudioToWav(file, newRate);
        setProcessedAudio(wavBlob);
        audioRef.current.src = URL.createObjectURL(wavBlob);
      } catch (err) {
        console.error('Error resampling:', err);
      }
    }
  };

  //  (gender detection)
  const analyzeGender = async () => {
    if (!processedAudio) return alert(`'Upload an audio file first'`);
    setLoading(true);
    setAiResult(null);
    
    const fd = new FormData();
    fd.append('file', processedAudio, `speech_${sampleRate}.wav`);

    try {
      const res = await fetch(`${apiBaseUrl}${process.env.REACT_APP_GENDER}`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.status === 'success') setAiResult(json.prediction);
      else setAiResult(json.message || 'Prediction failed');
    } catch {
      setAiResult('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

const handleRestoreAudio = async () => {
  if (!processedAudio) {
    alert("Please select an audio file first 🎧");
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("file", processedAudio);

    const response = await fetch(`${apiBaseUrl}${process.env.REACT_APP_RESTORE}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to restore audio");
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    audioRef.current.src = audioUrl;
    audioRef.current.play();
  } catch (error) {
    console.error(" Error:", error);
    alert("An error occurred while restoring the audio.");
  } finally {
    setLoading(false);
  }
};

const downloadAudio = () => {
    if (!processedAudio) return alert('No processed audio to download');
    const url = URL.createObjectURL(processedAudio);
    const a = document.createElement('a');
    a.href = url;
    a.download = `downsampled_${sampleRate}Hz.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  return (
    <div className="speech">
      <div className="icons-wrapper">
        <div className="icon-btn" role="button" tabIndex={0} aria-label="Go back" onClick={() => navigate(-1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(-1); } }}>
           <FaArrowLeft size={22} color={themeColor} />
         </div>

         <div className="icon-btn" role="button" tabIndex={0} aria-label="Home" onClick={() => navigate('/')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/'); } }}>
           <FaHome size={22} color={themeColor} />
         </div>
         <div className="icon-btn" role="button" tabIndex={0} aria-label="Home" onClick={(analyzeGender)  }>
           <RiRobot2Line size={22} color={themeColor} />
         </div>
        <div className="icon-btn upload-icon-container" onClick={() => fileInputRef.current.click()}>
          <FaArrowCircleUp size={22} color={themeColor} />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="audio/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="card">
        <h2>Downsampling & Gender Detection</h2>

        <p style={{ color: '#cfc6ff' }}>
          Uploaded File: <strong>{fileName || 'None'}</strong>
        </p>

        {loading ? (
          <p>Analyzing...</p>
        ) : (
          aiResult && <p>Prediction: <strong>{aiResult}</strong></p>
        )}

        {/* Slider for Sample Rate */}
        {fileName && (
          <div className="range-container">
            <input
              type="range"
              min="3000"
              max={originalRate || 48000} 
              step="5"
              value={sampleRate}
              onChange={handleSampleRateChange}
            />
            <p>Sample Rate: <strong>{sampleRate} Hz</strong></p>
          </div>
        )}
        {processedAudio && (
          <div className="button-container">
            <button onClick={downloadAudio} className="button">
              ⬇️ Download Audio
            </button>
            <button
              onClick={handleRestoreAudio}
              disabled={loading}
              className="button"
            >
              {loading ? "Restoring..." : "🔊 Restore Audio"}
            </button>
          </div>
        )}


        <audio 
          ref={audioRef} 
          controls 
          controlsList="nodownload"
          style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }} 
        />
      </div>
    </div>
  );
}

export default Speech;

