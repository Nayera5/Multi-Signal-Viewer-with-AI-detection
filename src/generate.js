import React, { useState, useRef, useEffect } from "react";
import Plot from "react-plotly.js";
import { GiSoundWaves } from "react-icons/gi";
import { FaPlay, FaStop } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "./CSS_files/home.css";
import "./CSS_files/generate.css"; // استدعاء ملف التنسيقات
import { processAudioToWav } from "./Sound_Downsampling";

function Generate() {
  const [baseFreq, setBaseFreq] = useState(120);
  const [speedKmh, setSpeedKmh] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetRate, setTargetRate] = useState(3000); // slider-controlled downsample rate
  const [error, setError] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;


  const playSound = () => {
    const freq = parseFloat(baseFreq);
    const speed = parseFloat(speedKmh);
    if (isNaN(freq) || isNaN(speed)) {
      setError("Please enter valid numbers for frequency and speed.");
      return;
    }
    if (freq < 50 || freq > 150) {
      setError("Frequency must be between 50 and 150 Hz.");
      return;
    }
    if (speed < 10 || speed > 200) {
      setError("Speed must be between 10 and 200 km/h.");
      return;
    }

    setError("");
    setAnalysisData(null);
    audioChunksRef.current = [];

    setIsPlaying(true);
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioCtx;

    const dest = audioCtx.createMediaStreamDestination();

    try {
      const mediaRecorder = new MediaRecorder(dest.stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // try to downsample to the user-selected targetRate using the shared utility
        try {
          const wavBlob = await processAudioToWav(audioBlob, targetRate);
          await sendToBackend(wavBlob);
        } catch (err) {
          console.warn('Downsampling failed, sending original blob:', err);
          await sendToBackend(audioBlob);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("MediaRecorder error:", err);
    }

    const oscillator1 = audioCtx.createOscillator();
    oscillator1.type = "sine";
    const gainNode1 = audioCtx.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(dest);
    gainNode1.connect(audioCtx.destination);

    const oscillator2 = audioCtx.createOscillator();
    oscillator2.type = "sawtooth";
    const gainNode2 = audioCtx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(dest);
    gainNode2.connect(audioCtx.destination);

    const bufferSize = 4096;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseOscillator = audioCtx.createBufferSource();
    noiseOscillator.buffer = noiseBuffer;
    noiseOscillator.loop = true;
    const noiseGain = audioCtx.createGain();
    noiseOscillator.connect(noiseGain);
    noiseGain.connect(dest);
    noiseGain.connect(audioCtx.destination);

    const v_sound = 343;
    const speedMs = speed / 3.6;
    const r = 3;
    const initialX = -100;
    const endX = 100;
    const totalDistance = endX - initialX;
    const totalTime = totalDistance / speedMs;
    const steps = 400;
    const dt = totalTime / steps;

    oscillator1.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    oscillator2.frequency.setValueAtTime(baseFreq * 1.2, audioCtx.currentTime);
    gainNode1.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode2.gain.setValueAtTime(0.001, audioCtx.currentTime);
    noiseGain.gain.setValueAtTime(0.001, audioCtx.currentTime);

    for (let i = 0; i <= steps; i++) {
      const t = audioCtx.currentTime + i * dt;
      const x = initialX + speedMs * (i * dt);
      const distance = Math.sqrt(x * x + r * r);
      const vs_dot_n = -speedMs * x / distance;
      const shiftedFreq = baseFreq * v_sound / (v_sound - vs_dot_n);
      const gainValue = 1 / (distance * distance * 0.01);

      oscillator1.frequency.setValueAtTime(shiftedFreq, t);
      oscillator2.frequency.setValueAtTime(shiftedFreq * 1.2, t);
      gainNode1.gain.setValueAtTime(Math.min(0.5, gainValue * 1.2), t);
      gainNode2.gain.setValueAtTime(Math.min(0.2, gainValue * 0.4), t);
      noiseGain.gain.setValueAtTime(Math.min(0.1, gainValue * 0.2), t);
    }

    oscillator1.start(audioCtx.currentTime);
    oscillator2.start(audioCtx.currentTime);
    noiseOscillator.start(audioCtx.currentTime);
    oscillator1.stop(audioCtx.currentTime + totalTime + 0.5);
    oscillator2.stop(audioCtx.currentTime + totalTime + 0.5);
    noiseOscillator.stop(audioCtx.currentTime + totalTime + 0.5);

    oscillator1.onended = () => {
      setIsPlaying(false);
      setTimeout(() => {
        if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current.stop();
        if (audioContextRef.current) audioContextRef.current.close();
      }, 500);
    };
  };

  const sendToBackend = async (audioBlob) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "generated_audio.webm");

    try {
      const res = await fetch(`${apiBaseUrl}${process.env.REACT_APP_CAR_GENERATE_ENDPOINT}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze audio");

      const data = await res.json();
      setAnalysisData(data);
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setError("Failed to analyze audio. Make sure Flask backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopSound = () => {
  try {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current && typeof audioContextRef.current.close === "function") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsPlaying(false);
  } catch (err) {
    console.warn("AudioContext already closed or null:", err);
  }
};


 useEffect(() => {
  return () => {
    if (
      audioContextRef.current &&
      typeof audioContextRef.current.close === "function" &&
      audioContextRef.current.state !== "closed"
    ) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
}, []);


  return (
    <div className="home generate-page">
      <div className="home-container">
        {/* <div className="home-header">
          <h1 className="home-title">TOP Signal</h1>
          <p className="home-subtitle">Generate and analyze Doppler audio</p>
        </div> */}

        <div className="cards-container">
          <div className="signal-card sound-card">
            <div className="card-header">
              <div className="card-icon2">
                <GiSoundWaves size={54} />
              </div>

              <h2 className="card-title2">Passing Car Sound Generator</h2>

              <div className="card-features">
                <span className="feature-tag">Doppler</span>
                <span className="feature-tag">Spectrogram</span>
                <span className="feature-tag">Audio</span>
              </div>
            </div>


            <div className="main-box">
              <div className="control-box">
                <div className="input-grid">
                  <div className="input-group">
                    <label>Base Frequency (Hz):</label>
                    <input
                      type="number"
                      value={baseFreq}
                      onChange={(e) => setBaseFreq(parseFloat(e.target.value))}
                      min="50"
                      max="150"
                      disabled={isPlaying}
                    />
                    <small>Range: 50-150 Hz</small>
                  </div>

                  <div className="input-group">
                    <label>Speed (km/h):</label>
                    <input
                      type="number"
                      value={speedKmh}
                      onChange={(e) => setSpeedKmh(parseFloat(e.target.value))}
                      min="10"
                      max="200"
                      disabled={isPlaying}
                    />
                    <small>Range: 10-200 km/h</small>
                  </div>
                  <div className="input-group">
                    <label>Downsample Rate (Hz):</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="range"
                        min={3000}
                        max={48000}
                        step={10}
                        value={targetRate}
                        onChange={(e) => setTargetRate(parseInt(e.target.value, 10))}
                        disabled={isPlaying}
                        style={{ flex: 1 }}
                      />
                      <div style={{ width: 90, textAlign: 'right', color: '#cfc6ff' }}>
                        <strong>{targetRate} Hz</strong>
                      </div>
                    </div>
                    <small>Lower rates emulate aliasing / small-sensor capture</small>
                  </div>
                </div>

                <div className="button-group">
                  <button onClick={playSound} disabled={isPlaying} className="play-btn">
                    <FaPlay style={{ marginRight: 8 }} />
                    {isPlaying ? "Playing..." : "Play"}
                  </button>
                  <button onClick={stopSound} disabled={!isPlaying} className="stop-btn">
                    <FaStop style={{ marginRight: 8 }} />
                    Stop
                  </button>
                </div>

                {error && <p className="error">{error}</p>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
                {isPlaying && (
                  <div className="status-box playing">
                    <p>Playing and recording sound... Analysis will start when playback finishes!</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="status-box analyzing">
                    <p><AiOutlineLoading3Quarters className="analyzing-spinner" />Analyzing audio... Please wait</p>
                  </div>
                )}

                <div className="plot-container">
                  <h3>Spectrogram - Doppler Effect Visualization</h3>
                  {analysisData ? (
                    <Plot
                      data={[
                        {
                          z: analysisData.spectrogram,
                          x: analysisData.times,
                          y: analysisData.freq_axis,
                          type: "heatmap",
                          colorscale: "Jet",
                          colorbar: { title: "dB" },
                          zsmooth: "best",
                        },
                      ]}
                      layout={{
                        title: "Spectrogram Analysis",
                        xaxis: { title: "Time (seconds)" },
                        yaxis: { title: "Frequency (Hz)", range: [0, 250] },
                        plot_bgcolor: "#ffffff",
                        paper_bgcolor: "rgba(0,0,0,0)",
                        autosize: true,
                        margin: { t: 60, b: 60, l: 70, r: 100 },
                      }}
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#6ac1e4'
                    }}>
                      <p>No analysis yet. Play sound to generate and analyze a spectrogram.</p>
                    </div>
                  )}
                </div>

                <div className="footer-status">
                  <p>
                    {isPlaying
                      ? "Playing sound with Doppler effect..."
                      : isAnalyzing
                      ? "Analyzing audio with backend..."
                      : analysisData
                      ? "Analysis complete! Spectrogram and results are ready above."
                      : "Enter frequency (50-150 Hz) and speed (10-200 km/h) to simulate a car passing by."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Generate;
