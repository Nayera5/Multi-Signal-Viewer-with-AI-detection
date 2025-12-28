import "./CSS_files/eeg.css";
import { useNavigate } from "react-router-dom";
import { FaArrowCircleUp } from "react-icons/fa";
import { HiOutlineLockClosed } from "react-icons/hi2";
import { LuAudioWaveform } from "react-icons/lu";
import { useState, useRef, useEffect } from "react";
import Plot from "react-plotly.js";

function Car() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showWave, setShowWave] = useState(false);
  const [currentVelocity, setCurrentVelocity] = useState(0);
  
  // للنقاط المختارة
  const [fApproach, setFApproach] = useState(null);
  const [fRecede, setFRecede] = useState(null);
  const [timeApproach, setTimeApproach] = useState(null);
  const [timeRecede, setTimeRecede] = useState(null);
  
  // النتائج المحسوبة
  const [f0Calculated, setF0Calculated] = useState(null);
  const [velocityCalculated, setVelocityCalculated] = useState(null);
  
  const [selectionMode, setSelectionMode] = useState("approach");
  const audioRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Uploading file:", file.name);
      const res = await fetch("http://127.0.0.1:5000/upload_car", {
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
      audioRef.current.src = URL.createObjectURL(file);
      console.log("Audio source set:", audioRef.current.src);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };

  const handleWave = () => {
    if (!data) {
      console.error("No data available to display graph");
      alert("No data available. Please upload a file first.");
      return;
    }
    if (!audioRef.current) {
      console.error("Audio reference is not available");
      return;
    }
    console.log("Attempting to play audio and show graph");
    setShowWave(true);
    audioRef.current.play().catch((error) => {
      console.error("Error playing audio:", error);
      alert("Failed to play audio. Please try playing it manually using the audio controls.");
    });
  };

  // معالج الضغط على الـ Frequency-Time graph
  const handleFrequencyPlotClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const freq = point.y;
      const time = point.x;
      
      if (selectionMode === "approach") {
        setFApproach(freq);
        setTimeApproach(time);
        console.log(`Approach frequency selected: ${freq.toFixed(2)} Hz at ${time.toFixed(2)}s`);
        alert(`✅ Approach frequency selected: ${freq.toFixed(2)} Hz\n\nNow select the RECEDE frequency (lower point after the car passes)`);
        setSelectionMode("recede");
      } else {
        setFRecede(freq);
        setTimeRecede(time);
        console.log(`Recede frequency selected: ${freq.toFixed(2)} Hz at ${time.toFixed(2)}s`);
        alert(`✅ Recede frequency selected: ${freq.toFixed(2)} Hz\n\nNow click "Calculate" button!`);
        setSelectionMode("approach");
      }
    }
  };

  // حساب f₀ والسرعة
  const calculateDopplerParameters = () => {
    if (!fApproach || !fRecede) {
      alert("Please select both APPROACH and RECEDE frequencies from the graph!");
      return;
    }

    const c = 343; // سرعة الصوت m/s
    
    // حساب f₀ (التردد الأصلي)
    const f0 = (fApproach + fRecede) / 2;
    
    // حساب السرعة من معادلة Doppler
    const v = c * (fApproach - fRecede) / (fApproach + fRecede);
    
    setF0Calculated(f0);
    setVelocityCalculated(v);
    
    console.log(`Calculated: f₀ = ${f0.toFixed(2)} Hz, v = ${v.toFixed(2)} m/s`);
  };

  const resetSelections = () => {
    setFApproach(null);
    setFRecede(null);
    setTimeApproach(null);
    setTimeRecede(null);
    setF0Calculated(null);
    setVelocityCalculated(null);
    setSelectionMode("approach");
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
    <div className="eeg">
      <div className="icons">
        <span className="icon">
          <label htmlFor="fileUpload">
            <FaArrowCircleUp size={30} color="purple" style={{ cursor: "pointer" }} />
          </label>
          <input
            id="fileUpload"
            type="file"
            accept=".wav"
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
      </div>

      <h1>Car Page - Doppler Effect Analysis</h1>
      <audio ref={audioRef} controls style={{ margin: "10px 0" }} />
      
      {showWave && data ? (
        <div>
          <div style={{
            background: "#e8f4f8",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "3px solid #4CAF50"
          }}>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>
              📍 Next Step: Select <span style={{ 
                color: selectionMode === "approach" ? "red" : "blue",
                fontSize: "20px"
              }}>
                {selectionMode === "approach" ? "HIGHEST POINT (🔴 APPROACH)" : "LOWEST POINT (🔵 RECEDE)"}
              </span> from the graph
            </p>
          </div>

          {/* Frequency-Time Graph */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ color: "purple", textAlign: "center" }}>
              📈 Observed Frequency vs Time (Doppler Effect)
            </h2>
            <Plot
              data={[
                {
                  x: data.times,
                  y: data.frequencies,
                  type: "scatter",
                  mode: "lines+markers",
                  line: {
                    color: "purple",
                    width: 4
                  },
                  marker: {
                    size: 6,
                    color: "purple"
                  },
                  name: "Observed Frequency",
                  hovertemplate: "<b>Time:</b> %{x:.2f} s<br><b>Frequency:</b> %{y:.2f} Hz<extra></extra>"
                },
                // Approach marker
                ...(fApproach ? [{
                  x: [timeApproach],
                  y: [fApproach],
                  mode: "markers+text",
                  marker: {
                    color: "red",
                    size: 25,
                    symbol: "x",
                    line: {
                      color: "darkred",
                      width: 3
                    }
                  },
                  text: ["APPROACH"],
                  textposition: "top center",
                  textfont: {
                    size: 14,
                    color: "red",
                    family: "Arial Black"
                  },
                  name: `Approach: ${fApproach.toFixed(2)} Hz`,
                  showlegend: true
                }] : []),
                // Recede marker
                ...(fRecede ? [{
                  x: [timeRecede],
                  y: [fRecede],
                  mode: "markers+text",
                  marker: {
                    color: "blue",
                    size: 25,
                    symbol: "x",
                    line: {
                      color: "darkblue",
                      width: 3
                    }
                  },
                  text: ["RECEDE"],
                  textposition: "bottom center",
                  textfont: {
                    size: 14,
                    color: "blue",
                    family: "Arial Black"
                  },
                  name: `Recede: ${fRecede.toFixed(2)} Hz`,
                  showlegend: true
                }] : []),
                // خط f₀ إذا تم حسابه
                ...(f0Calculated ? [{
                  x: [data.times[0], data.times[data.times.length - 1]],
                  y: [f0Calculated, f0Calculated],
                  mode: "lines",
                  line: {
                    color: "green",
                    width: 3,
                    dash: "dash"
                  },
                  name: `Source Frequency f₀ = ${f0Calculated.toFixed(2)} Hz`,
                  showlegend: true
                }] : []),
              ]}
              layout={{
                title: {
                  text: "Doppler Effect: Frequency Shift as Car Passes Observer",
                  font: { size: 20, color: "purple", family: "Arial" }
                },
                xaxis: { 
                  title: {
                    text: "Time (seconds)",
                    font: { size: 16, color: "#333" }
                  },
                  showgrid: true,
                  gridcolor: "#e0e0e0",
                  zeroline: false
                },
                yaxis: { 
                  title: {
                    text: "Observed Frequency (Hz)",
                    font: { size: 16, color: "#333" }
                  },
                  showgrid: true,
                  gridcolor: "#e0e0e0",
                  zeroline: false
                },
                plot_bgcolor: "#fafafa",
                paper_bgcolor: "white",
                hovermode: "closest",
                autosize: true,
                margin: { t: 80, b: 70, l: 80, r: 50 },
                legend: {
                  x: 0.02,
                  y: 0.98,
                  bgcolor: "rgba(255,255,255,0.9)",
                  bordercolor: "#333",
                  borderwidth: 1
                }
              }}
              style={{ width: "100%", height: "550px" }}
              config={{ responsive: true, displayModeBar: true }}
              onClick={handleFrequencyPlotClick}
            />
          </div>

          {/* Calculator Section */}
          <div style={{ 
            background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)", 
            padding: "25px", 
            borderRadius: "12px", 
            marginTop: "20px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "purple", textAlign: "center", marginTop: 0 }}>
              🚗 Doppler Effect Calculator
            </h2>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "20px",
              marginBottom: "20px" 
            }}>
              <div style={{ 
                padding: "20px", 
                background: fApproach ? "#ffebee" : "white",
                borderRadius: "10px",
                border: "4px solid red",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "red", margin: "0 0 15px 0", textAlign: "center" }}>
                  🔴 Approach Phase
                </h3>
                {fApproach ? (
                  <>
                    <p style={{ fontSize: "24px", margin: "10px 0", textAlign: "center", color: "red" }}>
                      <b>{fApproach.toFixed(2)} Hz</b>
                    </p>
                    <p style={{ color: "#666", textAlign: "center" }}>
                      at <b>{timeApproach.toFixed(2)}</b> seconds
                    </p>
                    <p style={{ fontSize: "12px", color: "#999", textAlign: "center", marginTop: "10px" }}>
                      (Car coming towards observer)
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#999", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                    Click on the highest point<br/>in the graph above
                  </p>
                )}
              </div>

              <div style={{ 
                padding: "20px", 
                background: fRecede ? "#e3f2fd" : "white",
                borderRadius: "10px",
                border: "4px solid blue",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "blue", margin: "0 0 15px 0", textAlign: "center" }}>
                  🔵 Recede Phase
                </h3>
                {fRecede ? (
                  <>
                    <p style={{ fontSize: "24px", margin: "10px 0", textAlign: "center", color: "blue" }}>
                      <b>{fRecede.toFixed(2)} Hz</b>
                    </p>
                    <p style={{ color: "#666", textAlign: "center" }}>
                      at <b>{timeRecede.toFixed(2)}</b> seconds
                    </p>
                    <p style={{ fontSize: "12px", color: "#999", textAlign: "center", marginTop: "10px" }}>
                      (Car moving away from observer)
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#999", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                    Click on the lowest point<br/>in the graph above
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
              <button
                onClick={calculateDopplerParameters}
                disabled={!fApproach || !fRecede}
                style={{
                  background: (fApproach && fRecede) ? "linear-gradient(135deg, purple 0%, #6a1b9a 100%)" : "#ccc",
                  color: "white",
                  padding: "18px 35px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: (fApproach && fRecede) ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "20px",
                  flex: 1,
                  boxShadow: (fApproach && fRecede) ? "0 4px 6px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.3s"
                }}
              >
                🧮 Calculate f₀ & Velocity
              </button>

              <button
                onClick={resetSelections}
                style={{
                  background: "linear-gradient(135deg, #ff5722 0%, #d84315 100%)",
                  color: "white",
                  padding: "18px 35px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "18px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
                }}
              >
                🔄 Reset All
              </button>
            </div>

            {f0Calculated !== null && velocityCalculated !== null && (
              <div style={{ 
                marginTop: "25px", 
                padding: "25px", 
                background: "white", 
                borderRadius: "12px",
                border: "5px solid purple",
                boxShadow: "0 6px 12px rgba(0,0,0,0.15)"
              }}>
                <h2 style={{ color: "purple", marginTop: 0, textAlign: "center" }}>
                  📊 Calculation Results
                </h2>
                
                <div style={{ 
                  marginBottom: "25px",
                  padding: "20px",
                  background: "#f5f5f5",
                  borderRadius: "8px"
                }}>
                  <p style={{ fontWeight: "bold", marginBottom: "15px", fontSize: "16px" }}>
                    📐 Doppler Equations Used:
                  </p>
                  <div style={{ fontFamily: "Courier New", fontSize: "15px" }}>
                    <p style={{ 
                      background: "#e8f5e9", 
                      padding: "12px", 
                      borderRadius: "6px", 
                      margin: "8px 0",
                      borderLeft: "4px solid #4CAF50"
                    }}>
                      <b>f₀</b> = (f_approach + f_recede) / 2
                    </p>
                    <p style={{ 
                      background: "#fff3e0", 
                      padding: "12px", 
                      borderRadius: "6px", 
                      margin: "8px 0",
                      borderLeft: "4px solid #FF9800"
                    }}>
                      <b>v</b> = c × (f_approach - f_recede) / (f_approach + f_recede)
                    </p>
                    <p style={{ fontSize: "13px", color: "#666", marginTop: "12px", fontFamily: "Arial" }}>
                      where <b>c = 343 m/s</b> (speed of sound in air at 20°C)
                    </p>
                  </div>
                </div>

                <div style={{ 
                  background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", 
                  padding: "25px", 
                  borderRadius: "10px",
                  marginBottom: "20px",
                  border: "3px solid #4CAF50",
                  textAlign: "center"
                }}>
                  <h3 style={{ margin: "0 0 15px 0", color: "#2e7d32" }}>
                    🎯 Source Frequency (f₀)
                  </h3>
                  <p style={{ fontSize: "42px", margin: "15px 0", color: "#1b5e20", fontWeight: "bold" }}>
                    {f0Calculated.toFixed(2)} Hz
                  </p>
                  <p style={{ fontSize: "15px", color: "#666", margin: "10px 0" }}>
                    This is the original frequency emitted by the car
                  </p>
                </div>

                <div style={{ 
                  background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)", 
                  padding: "25px", 
                  borderRadius: "10px",
                  border: "3px solid #FF9800",
                  textAlign: "center"
                }}>
                  <h3 style={{ margin: "0 0 15px 0", color: "#e65100" }}>
                    🚗 Car Velocity
                  </h3>
                  <p style={{ fontSize: "42px", margin: "15px 0", color: "#bf360c", fontWeight: "bold" }}>
                    {velocityCalculated.toFixed(2)} m/s
                  </p>
                  <p style={{ fontSize: "36px", margin: "15px 0", color: "#f57c00", fontWeight: "bold" }}>
                    = {(velocityCalculated * 3.6).toFixed(2)} km/h
                  </p>
                  <p style={{ fontSize: "15px", color: "#666", margin: "10px 0" }}>
                    Speed of the car passing by the observer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Backend Auto Calculations */}
          <div style={{ 
            marginTop: "25px",
            padding: "20px",
            background: "#fafafa",
            borderRadius: "10px",
            border: "2px solid #ddd"
          }}>
            <h4 style={{ color: "#666", marginTop: 0 }}>
              🤖 Automatic Backend Calculations (For Comparison):
            </h4>
            <p style={{ fontSize: "16px" }}>
              <b>Estimated Avg Velocity:</b> {data.estimated_velocity.toFixed(2)} m/s 
              ({(data.estimated_velocity * 3.6).toFixed(2)} km/h)
            </p>
            <p id="liveVel" style={{ fontSize: "16px" }}>
              <b>Live Velocity:</b> {currentVelocity} m/s
            </p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ fontSize: "20px", color: "#666" }}>
            📁 No data available yet
          </p>
          <p style={{ fontSize: "16px", color: "#999" }}>
            Please upload a .wav file and click the Wave icon to start analysis
          </p>
        </div>
      )}
    </div>
  );
}

export default Car;   