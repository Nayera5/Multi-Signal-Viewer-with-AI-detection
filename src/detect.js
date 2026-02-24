import "./CSS_files/detect.css";
import { useNavigate } from "react-router-dom";
import { FaArrowCircleUp } from "react-icons/fa";
import { HiOutlineLockClosed } from "react-icons/hi2";
import { LuAudioWaveform } from "react-icons/lu";
import { MdSpeed } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import Plot from "react-plotly.js";
import { processAudioToWav, decodeAudioFile } from './Sound_Downsampling.js';

function Detect() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showWave, setShowWave] = useState(false);
  const [currentVelocity, setCurrentVelocity] = useState(0);
  
  const [fApproach, setFApproach] = useState(null);
  const [fRecede, setFRecede] = useState(null);
  const [timeApproach, setTimeApproach] = useState(null);
  const [timeRecede, setTimeRecede] = useState(null);
  
  const [f0Calculated, setF0Calculated] = useState(null);
  const [velocityCalculated, setVelocityCalculated] = useState(null);
  
  // Downsampling states
  const [showDownsampling, setShowDownsampling] = useState(false);
  const [sampleRate, setSampleRate] = useState(48000);
  const [originalRate, setOriginalRate] = useState(48000);
  const [originalFile, setOriginalFile] = useState(null);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioRef = useRef(null);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    setOriginalFile(file);
    setIsProcessing(true);

    try {
      // Get original sample rate
      const rate = await decodeAudioFile(file);
      console.log("Original sample rate:", rate);
      setOriginalRate(rate);
      setSampleRate(rate);

      // Process audio to WAV with original rate
      const wavBlob = await processAudioToWav(file, rate);
      setProcessedAudio(wavBlob);

      // Upload to backend
      await uploadToBackend(wavBlob);

      // Set audio source
      audioRef.current.src = URL.createObjectURL(wavBlob);
      console.log("Audio loaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    console.log("Uploading to backend...");
    const res = await fetch(`${apiBaseUrl}${process.env.REACT_APP_DETECTCAR}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Upload failed with status:", res.status);
      throw new Error("Failed to upload file");
    }

    const json = await res.json();
    console.log("Received data from backend:", json);
    setData(json);
  };

  const handleSampleRateChange = async (e) => {
    const newRate = parseInt(e.target.value);
    setSampleRate(newRate);

    if (originalFile && !isProcessing) {
      setIsProcessing(true);
      try {
        console.log(`Resampling to ${newRate} Hz...`);
        
        // Resample audio
        const wavBlob = await processAudioToWav(originalFile, newRate);
        setProcessedAudio(wavBlob);

        // Upload resampled audio to backend
        await uploadToBackend(wavBlob);

        // Update audio player
        audioRef.current.src = URL.createObjectURL(wavBlob);
        
        console.log(`Successfully resampled to ${newRate} Hz`);
      } catch (err) {
        console.error('Error resampling:', err);
        alert('Failed to resample audio');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleWave = () => {
    if (!data) {
      console.error("No data available to display spectrogram");
      alert("No data available. Please upload a file first.");
      return;
    }
    if (!audioRef.current) {
      console.error("Audio reference is not available");
      return;
    }
    console.log("Attempting to play audio and show spectrogram");
    setShowWave(true);
    audioRef.current.play().catch((error) => {
      console.error("Error playing audio:", error);
      alert("Failed to play audio. Please try playing it manually using the audio controls.");
    });
  };

  const autoDetectFrequencies = () => {
    if (!data || !data.frequencies) {
      alert("No data available for automatic detection!");
      return;
    }

    const frequencies = data.frequencies;
    const times = data.times;
    const totalLength = frequencies.length;

    // ignore first and last 15% of data to avoid noise
    const startIndex = Math.floor(totalLength * 0.15);
    const endIndex = Math.floor(totalLength * 0.85);
    const validFreqs = frequencies.slice(startIndex, endIndex);
    const validTimes = times.slice(startIndex, endIndex);

    // using 2nd and 98th percentiles to avoid outliers
    const sortedFreqs = [...validFreqs].sort((a, b) => a - b);
    const percentile98Index = Math.floor(sortedFreqs.length * 0.98);
    const percentile2Index = Math.floor(sortedFreqs.length * 0.02);
    
    const maxFreq = sortedFreqs[percentile98Index];
    const minFreq = sortedFreqs[percentile2Index];

    
    const maxFreqIndex = validFreqs.findIndex(f => Math.abs(f - maxFreq) < 0.01) + startIndex;
    const minFreqIndex = validFreqs.findIndex(f => Math.abs(f - minFreq) < 0.01) + startIndex;

    // update state
    setFApproach(maxFreq);
    setTimeApproach(times[maxFreqIndex]);
    setFRecede(minFreq);
    setTimeRecede(times[minFreqIndex]);

    console.log(`Auto-detected: Approach = ${maxFreq.toFixed(2)} Hz at ${times[maxFreqIndex].toFixed(2)}s`);
    console.log(`Auto-detected: Recede = ${minFreq.toFixed(2)} Hz at ${times[minFreqIndex].toFixed(2)}s`);

    const c = 343; // m/s
    const f0 = Math.sqrt(maxFreq * minFreq); 
    const v = c * (maxFreq - minFreq) / (maxFreq + minFreq);
    
    setF0Calculated(f0);
    setVelocityCalculated(v);
    
    console.log(`Calculated: f₀ = ${f0.toFixed(2)} Hz, v = ${v.toFixed(2)} m/s`);
    console.log(`Frequency difference: ${(maxFreq - minFreq).toFixed(2)} Hz`);
    console.log(`Ratio: ${(maxFreq / minFreq).toFixed(4)}`);
  };

  const downloadAudio = () => {
    if (!processedAudio) {
      alert('No processed audio to download');
      return;
    }
    const url = URL.createObjectURL(processedAudio);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doppler_downsampled_${sampleRate}Hz.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!audioRef.current || !data) {
      return;
    }

    const updateVelocity = () => {
      const currentTime = audioRef.current.currentTime;
      const { times, velocities } = data;

      let closestIndex = 0;
      let minDiff = Math.abs(times[0] - currentTime);
      for (let i = 1; i < times.length; i++) {
        const diff = Math.abs(times[i] - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }

      setCurrentVelocity(velocities[closestIndex].toFixed(2));
    };

    audioRef.current.addEventListener("timeupdate", updateVelocity);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateVelocity);
      }
    };
  }, [data]);

  return (
    <div className="det">
      <div className="icons">
        <span className="icon">
          <label htmlFor="fileUpload">
            <FaArrowCircleUp size={30} color="purple" style={{ cursor: "pointer" }} />
          </label>
          <input
            id="fileUpload"
            type="file"
            accept=".wav,audio/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </span>
        <span className="icon" onClick={() => navigate("/")}>
          <HiOutlineLockClosed size={30} color="purple" />
        </span>
        <span className="icon" onClick={handleWave}>
          <LuAudioWaveform size={30} color="purple" />
        </span>
        <span 
          className="icon" 
          onClick={() => setShowDownsampling(!showDownsampling)}
          title="Toggle Downsampling Controls"
        >
          <MdSpeed size={30} color="purple" />
        </span>
      </div>

      <h1>Doppler Effect Analysis</h1>
      
      {isProcessing && (
        <div style={{ color: 'purple', padding: '10px', textAlign: 'center' }}>
          ⏳ Processing audio...
        </div>
      )}

      {/* Downsampling Section */}
      {showDownsampling && originalFile && (
        <div className="car-downsampling-section" style={{
          background: 'linear-gradient(135deg, rgba(128, 0, 128, 0.15) 0%, rgba(75, 0, 130, 0.15) 100%)',
          padding: '25px',
          borderRadius: '15px',
          margin: '20px 0',
          border: '2px solid purple',
          boxShadow: '0 4px 15px rgba(128, 0, 128, 0.2)'
        }}>
          <h3 style={{ color: 'purple', marginBottom: '20px', textAlign: 'center' }}>
            🎚️ Audio Downsampling Controls
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px',
            marginBottom: '25px',
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '10px'
          }}>
            <div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Original Sample Rate:
              </p>
              <p style={{ margin: '5px 0', fontSize: '20px', fontWeight: 'bold', color: 'purple' }}>
                {originalRate} Hz
              </p>
            </div>
            <div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Current Sample Rate:
              </p>
              <p style={{ margin: '5px 0', fontSize: '20px', fontWeight: 'bold', color: 'green' }}>
                {sampleRate} Hz
              </p>
            </div>
          </div>
          
          <div style={{ margin: '25px 0' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'purple'
            }}>
              Adjust Sample Rate: {sampleRate} Hz
            </label>
            <input
              type="range"
              min="3000"
              max={originalRate}
              step="1000"
              value={sampleRate}
              onChange={handleSampleRateChange}
              disabled={isProcessing}
              style={{ 
                width: '100%', 
                height: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                accentColor: 'purple'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '5px',
              fontSize: '12px',
              color: '#888'
            }}>
              <span>3000 Hz</span>
              <span>{originalRate} Hz</span>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            marginTop: '20px' 
          }}>
            <button 
              onClick={downloadAudio} 
              disabled={!processedAudio || isProcessing}
              style={{
                background: processedAudio && !isProcessing ? 'purple' : '#ccc',
                color: 'white',
                padding: '12px 25px',
                border: 'none',
                borderRadius: '8px',
                cursor: processedAudio && !isProcessing ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                boxShadow: processedAudio && !isProcessing ? '0 4px 10px rgba(128, 0, 128, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (processedAudio && !isProcessing) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 15px rgba(128, 0, 128, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = processedAudio && !isProcessing ? '0 4px 10px rgba(128, 0, 128, 0.3)' : 'none';
              }}
            >
              ⬇️ Download Downsampled Audio
            </button>
          </div>

          {isProcessing && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: 'rgba(255, 193, 7, 0.2)',
              borderRadius: '5px',
              textAlign: 'center',
              color: 'orange',
              fontWeight: 'bold'
            }}>
              ⏳ Processing audio at {sampleRate} Hz...
            </div>
          )}
        </div>
      )}

      <audio ref={audioRef} controls className="car-audio-player" />
      
      {showWave && data ? (
        <div>
          <div className="car-auto-detect-banner">
            <button onClick={autoDetectFrequencies} className="car-btn-auto-detect">
              Frequency & Velocity
            </button>
          </div>
          
          <Plot className="plot"
            data={[
              {
                z: data.spectrogram,
                x: data.times,
                y: data.freq_axis,
                type: "heatmap",
                colorscale: "Jet",
                colorbar: {
                  title: "dB",
                  titleside: "right"
                }
              },
              ...(fApproach ? [{
                x: [timeApproach],
                y: [fApproach],
                mode: "markers",
                marker: {
                  color: "red",
                  size: 15,
                  symbol: "x"
                },
                name: "Approach",
                showlegend: true
              }] : []),
              ...(fRecede ? [{
                x: [timeRecede],
                y: [fRecede],
                mode: "markers",
                marker: {
                  color: "blue",
                  size: 15,
                  symbol: "x"
                },
                name: "Recede",
                showlegend: true
              }] : []),
            ]}
            layout={{
              title: `Spectrogram - Sample Rate: ${sampleRate} Hz`,
              xaxis: { 
                title: "Time (s)", 
                range: [0, data.times[data.times.length - 1]],
                showgrid: true
              },
              yaxis: { 
                title: "Frequency (Hz)",
                showgrid: true
              },
              autosize: true,
              margin: { t: 50, b: 50, l: 60, r: 60 }
            }}
            style={{ width: "100%", height: "500px" }}
            config={{ responsive: true }}
          />

          <div className="car-calculator-section">
            
            <div className="car-selection-grid">
              <div className={`car-phase-card ${fApproach ? 'car-phase-approach' : ''}`}>
                <h4 className="car-phase-title-red">Approach (Car Coming)</h4>
                {fApproach ? (
                  <>
                    <p><b>f_approach:</b> {fApproach.toFixed(2)} Hz</p>
                    <p><b>Time:</b> {timeApproach.toFixed(2)} s</p>
                  </>
                ) : (
                  <p className="car-phase-placeholder">Click Frequency & Velocity button above</p>
                )}
              </div>

              <div className={`car-phase-card ${fRecede ? 'car-phase-recede' : ''}`}>
                <h4 className="car-phase-title-blue">Recede (Car Leaving)</h4>
                {fRecede ? (
                  <>
                    <p><b>f_recede:</b> {fRecede.toFixed(2)} Hz</p>
                    <p><b>Time:</b> {timeRecede.toFixed(2)} s</p>
                  </>
                ) : (
                  <p className="car-phase-placeholder">Click Frequency & Velocity button above</p>
                )}
              </div>
            </div>

            {f0Calculated !== null && velocityCalculated !== null && (
              <div className="car-results-container">
                <h3 className="car-results-title">Calculation Results</h3>

                <div className="car-result-f0">
                  <h4 className="car-result-heading-green">
                    Source Frequency (f₀)
                  </h4>
                  <p className="car-result-value-green">
                    <b>{f0Calculated.toFixed(2)} Hz</b>
                  </p>
                  <p className="car-result-description">
                    Original frequency of the car's sound
                  </p>
                  <p className="car-result-meta">
                    f_approach: {fApproach.toFixed(2)} Hz | f_recede: {fRecede.toFixed(2)} Hz
                  </p>
                  <p className="car-result-meta">
                    Δf: {(fApproach - fRecede).toFixed(2)} Hz
                  </p>
                </div>

                <div className="car-result-velocity">
                  <h4 className="car-result-heading-orange">
                    Car Velocity
                  </h4>
                  <p className="car-result-value-orange">
                    <b>{velocityCalculated.toFixed(2)} m/s</b>
                  </p>
                  <p className="car-result-value-kmh">
                    = <b>{(velocityCalculated * 3.6).toFixed(2)} km/h</b>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="car-backend-section">
            <h4>Backend Calculations (For Comparison):</h4>
            <p>
              <b>Estimated Avg Velocity:</b> {data.estimated_velocity.toFixed(2)} m/s 
              ({(data.estimated_velocity * 3.6).toFixed(2)} km/h)
            </p>
            <p id="liveVel">
              <b>Live Velocity:</b> {currentVelocity} m/s
            </p>
          </div>
        </div>
      ) : (
        <p className="car-no-data">No spectrogram data available. Please upload a file.</p>
      )}
    </div>
  );
}

export default Detect;