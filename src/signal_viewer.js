import "./CSS_files/ecg.css";
import { useNavigate } from "react-router-dom";
import { FaArrowCircleUp } from "react-icons/fa"; 
import { CiHome } from "react-icons/ci";
import { PiChartPolar } from "react-icons/pi";
import { RiRobot2Line } from "react-icons/ri";
import { LuAudioWaveform } from "react-icons/lu";
import { BiScatterChart } from "react-icons/bi";
import { useState, useRef, useEffect } from "react";
import { 
  RecurrencePlot, 
  MultiChannelLinePlot, 
  MultiChannelPolarPlot,
  SingleChannelLinePlot,
  SingleChannelPolarPlot,
  XOROverlayPlot
} from "./Signal_Plot";

function SignalPage({ 
  signalType,
  title,
  themeColor,
  apiBaseUrl,
  leadsEndpoint,
  uploadEndpoint,
  streamEndpoint,
  AidetectionEndpoint,
  maxfreq,
  channelCount,
  channelColors,
  windowSize = 5000,
  compressionFactor = 5,
  channelOptions = [] 
}) {
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
  `;
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);
  const [leads, setLeads] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeChart, setActiveChart] = useState(null);
  const [viewStart, setViewStart] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewMode, setViewMode] = useState("multi"); // "multi" or "single"
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedChannelCount, setSelectedChannelCount] = useState(channelOptions[1]); // Default to first option
  const [recurrenceSelectedLeads, setRecurrenceSelectedLeads] = useState([]); // For recurrence plot channel selection
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [downsampleFreq, setDownsampleFreq] = useState(maxfreq); 
  const [streamKey, setStreamKey] = useState(0);
  
  const getMinFrequency = () => {
    if (signalType.toUpperCase() === "ECG") {
      return 100;
    } else if (signalType.toUpperCase() === "EEG") {
      return 10;
    }
  };
  
  const minFreq = getMinFrequency(); 
  
  const getAdjustedWindowSize = () => {
    return Math.round((downsampleFreq/maxfreq) * windowSize );
  };
  //________________________________________________________________________________
  const handleFrequencyChange = (newFreq) => {
    setDownsampleFreq(newFreq);
    
    // If a stream is active, restart it with the new frequency
    if (activeChart && isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      setData([]);
      setViewStart(0);
      setAutoScroll(true);
      setIsStreaming(true);
      setStreamKey(prev => prev + 1);
      
      const streamUrl = `${apiBaseUrl}${streamEndpoint}?freq=${newFreq}`;
      eventSourceRef.current = new EventSource(streamUrl);

      eventSourceRef.current.onmessage = (event) => {
        const chunk = JSON.parse(event.data);
        if (chunk.end) {
          setIsStreaming(false);
          eventSourceRef.current.close();
          return;
        }
        const newDataPoints = [];
        leads.forEach(leadName => {
          if (chunk[leadName]) {
            const leadPoints = chunk.time.map((t, idx) => ({
              time: t,
              value: chunk[leadName][idx],
              lead: leadName,
            }));
            newDataPoints.push(...leadPoints);
          }
        });
        setData(prevData => [...prevData, ...newDataPoints]);   
      };

      eventSourceRef.current.onerror = (error) => {
        console.error("SSE Error:", error);
        setIsStreaming(false);
        eventSourceRef.current.close();
      };
    }
  };

//________________________________________________________________________________
  useEffect(() => {
    fetch(`${apiBaseUrl}${leadsEndpoint}`)
      .then((res) => res.json())
      .then((result) => {
        const fetchedLeads = result.leads.slice(0, selectedChannelCount);
        console.log("Fetched leads from backend:", fetchedLeads); 
        console.log("Color mapping:", channelColors); 
        setLeads(fetchedLeads);
        if (fetchedLeads.length > 0 && !selectedChannel) {
          setSelectedChannel(fetchedLeads[0]);
        }
        // Clear old data when channel count changes
        setData([]);
        setIsStreaming(false);
        setActiveChart(null);
      })
      .catch((err) => console.error(`Error fetching ${signalType} leads:`, err));
  }, [apiBaseUrl, leadsEndpoint, selectedChannelCount, signalType]);

//________________________________________________________________________________
  useEffect(() => {
    if (autoScroll && data.length > 0 && leads.length > 0) {
      const maxLength = Math.max(...leads.map(lead => 
        data.filter(d => d.lead === lead).length
      ));
      const adjustedWindow = getAdjustedWindowSize();
      if (maxLength > adjustedWindow) {
        setViewStart(maxLength - adjustedWindow);
      }
    }
  }, [data.length, downsampleFreq, autoScroll, leads]);

//________________________________________________________________________________
  const getVisibleDataForLead = (leadName) => {
    if (data.length === 0) return [];
    const adjustedWindowSize = getAdjustedWindowSize();
    const leadData = data.filter(d => d.lead === leadName);
    const start = Math.max(0, viewStart);
    const end = Math.min(leadData.length, start + adjustedWindowSize);
    const selectedData = leadData.slice(start, end);
    
    const compressedData = [];
    for (let i = 0; i < selectedData.length; i += compressionFactor) {
      if (selectedData[i]) {
        compressedData.push(selectedData[i]);
      }
    }
    return compressedData;
  };

  const getMaxViewStart = () => {
    if (leads.length === 0) return 0;
    const adjustedWindowSize = getAdjustedWindowSize();
    const maxLength = Math.max(...leads.map(lead => 
      data.filter(d => d.lead === lead).length
    ));
    return Math.max(0, maxLength - adjustedWindowSize);
  };

//________________________________________________________________________________
  const predictAI = async () => {
    if (!fileName) {
      setAiError('Please upload a file first');
      return;
    }
    
    setAiLoading(true);
    setAiError(null);
    setAiPrediction(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}${AidetectionEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ freq: downsampleFreq })  
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setAiPrediction(result.prediction);
        setShowPrediction(true);
        setAiError(null);
        
        setTimeout(() => {
          setShowPrediction(false);
        }, 5000);
      } else {
        setAiError(result.message || 'Prediction failed');
      }
    } catch (error) {
      console.error('Error predicting:', error);
      setAiError('Error connecting to prediction service');
    } finally {
      setAiLoading(false);
    }
  };
//________________________________________________________________________________
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Stop any active streaming
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setData([]);
    setIsStreaming(false);
    setActiveChart(null);
    setViewStart(0);
    setAutoScroll(true);

    // send the file to backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBaseUrl}${uploadEndpoint}`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Upload response:", result);
      
      if (result.status === "success") {
        setFileName(result.filename || file.name);      
        
        fetch(`${apiBaseUrl}${leadsEndpoint}`)
          .then((res) => res.json())
          .then((result) => {
            const fetchedLeads = result.leads.slice(0, channelCount);
            setLeads(fetchedLeads);
            // Set first channel as default selected
            if (fetchedLeads.length > 0) {
              setSelectedChannel(fetchedLeads[0]);
            }
          })
          .catch((err) => console.error(`Error fetching ${signalType} leads:`, err));
        
        alert(result.message || "File uploaded successfully!");
      } else {
        alert(result.message || "Upload failed!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    }};

//________________________________________________________________________________
  const startStream = (chartType) => {
    if (!fileName) {
      alert("Please upload a file first!");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setData([]);
    setViewStart(0);
    setAutoScroll(true);
    setIsStreaming(true);
    setActiveChart(chartType);
    setStreamKey(prev => prev + 1); // Force visualization remount

    const streamUrl = `${apiBaseUrl}${streamEndpoint}?freq=${downsampleFreq}`;
    eventSourceRef.current = new EventSource(streamUrl);

    eventSourceRef.current.onmessage = (event) => {
      const chunk = JSON.parse(event.data);

      if (chunk.end) {
        setIsStreaming(false);
        eventSourceRef.current.close();
        return;
      }

      const newDataPoints = [];
      leads.forEach(leadName => {
        if (chunk[leadName]) {
          const leadPoints = chunk.time.map((t, idx) => ({
            time: t,
            value: chunk[leadName][idx],
            lead: leadName,
          }));
          newDataPoints.push(...leadPoints);
        }
      });

      setData(prevData => [...prevData, ...newDataPoints]);   
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("SSE Error:", error);
      setIsStreaming(false);
      eventSourceRef.current.close();
    };
  };
//________________________________________________________________________________

  const getColorForLead = (leadName) => {
    // Try exact match first
    if (channelColors[leadName]) {
      return channelColors[leadName];
    }
    
    // Try case-insensitive match
    const normalizedName = leadName.toLowerCase().trim();
    for (const [key, color] of Object.entries(channelColors)) {
      if (key.toLowerCase().trim() === normalizedName) {
        return color;
      }
    }
    
    // Try matching if the lead name contains the color key
    for (const [key, color] of Object.entries(channelColors)) {
      if (normalizedName.includes(key.toLowerCase())) {
        return color;
      }
    }
    
    // Generate a unique color based on lead index if no match
    const leadIndex = leads.indexOf(leadName);
    if (leadIndex !== -1 && leadIndex < Object.keys(channelColors).length) {
      return Object.values(channelColors)[leadIndex];
    }
    
    // Fall back to theme color
    return themeColor;
  };

//________________________________________________________________________________
  // Cross Recurrence Plot
  const calculateCrossRecurrence = (lead1Data, lead2Data) => {
    const minLength = Math.min(lead1Data.length, lead2Data.length);
    
    const allValues = [...lead1Data.map(d => d.value), ...lead2Data.map(d => d.value)];
    const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
    const stdDev = Math.sqrt(variance);
    const threshold = stdDev * 0.02;
    const matrix = [];
    
    for (let i = 0; i < minLength; i++) {
      const row = [];
      for (let j = 0; j < minLength; j++) {
        const distance = Math.abs(lead1Data[i].value - lead2Data[j].value);
        row.push(distance < threshold ? 1 : 0);
      }
      matrix.push(row);
    }
    
    return matrix;
  };

  const getRecurrencePlotData = () => {
    if (leads.length < 2) return null;
    
    // Use selected channels if available, otherwise default to ch1 vs itself
    const lead1Name = recurrenceSelectedLeads.length >= 1 ? recurrenceSelectedLeads[0] : leads[0];
    const lead2Name = recurrenceSelectedLeads.length >= 2 ? recurrenceSelectedLeads[1] : leads[0];
    
    const lead1Data = data.filter(d => d.lead === lead1Name).slice(0, 2000);
    const lead2Data = data.filter(d => d.lead === lead2Name).slice(0, 2000);
    
    if (lead1Data.length === 0 || lead2Data.length === 0) return null;

    const recurrenceMatrix = calculateCrossRecurrence(lead1Data, lead2Data);
    return {
      lead1: lead1Name,
      lead2: lead2Name,
      zData: recurrenceMatrix,
      size: recurrenceMatrix.length
    };
  };
//________________________________________________________________________________
  return (
    <div className="ecg">
      <div className="icons" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "20px",          
          padding: "10px 20px"
        }}>

        <h2 style={{ margin: 0, color: themeColor, fontSize: "35px" }}>
          {title}
        </h2>
      

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", cursor: "pointer" }}
        onClick={()=> {fileInputRef.current.click();}}>
          <span className="icon">
            <FaArrowCircleUp size={30} color={themeColor} /> 
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>Upload</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <span className="icon">
            <CiHome size={30} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>Home</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={() => startStream("recurrence")}>
          <span className="icon">
            <BiScatterChart size={30} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>Recurrence</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={() => startStream("polar")}>
          <span className="icon">
            <PiChartPolar size={30} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>Polar</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={() => startStream("line")}>
          <span className="icon">
            <LuAudioWaveform size={30} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>Waveform</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={() => startStream("xor") }>
          <span className="icon">
            <BiScatterChart size={26} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>XOR</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }} onClick={predictAI}>
          <span className="icon">
            <RiRobot2Line size={30} color={themeColor} />
          </span>
          <span style={{ fontSize: "11px", color: themeColor, fontWeight: "500" }}>{aiLoading ? 'Analyzing...' : 'Predict'}</span>
        </div>

        
      </div>

      {/* AI Prediction Result */}
      {aiPrediction && showPrediction && (
        <div style={{
          margin: "20px 0",
          padding: "20px",
          background: "linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)",
          borderRadius: "12px",
          border: "2px solid rgba(74, 222, 128, 0.4)",
          animation: "fadeIn 0.5s ease-in, fadeOut 0.5s ease-out 4.5s"
        }}>
          <h3 style={{ color: "#4ade80", margin: "0 0 10px 0", fontSize: "20px", fontWeight: "600" }}>
            AI Prediction Result:
          </h3>
          <p style={{ color: "#c9d1d9", fontSize: "25px", margin: "0", fontWeight: "500" }}>
            {aiPrediction}
          </p>
        </div>
      )}

      {/* AI Error */}
      {aiError && (
        <div style={{
          margin: "20px 0",
          padding: "20px",
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)",
          borderRadius: "12px",
          border: "2px solid rgba(239, 68, 68, 0.4)",
          animation: "shake 0.5s ease-in-out"
        }}>
          <p style={{ color: "#f87171", fontSize: "16px", margin: "0", fontWeight: "500" }}>
            ⚠️ {aiError}
          </p>
        </div>
      )}


      {/* View Mode and Channel Count Selector */}
      {leads.length > 0 && (
        <div style={{
          margin: "15px 0",
          padding: "15px",
          backgroundColor: "#161b22",
          borderRadius: "8px",
          border: `1px solid ${themeColor}30`,
          display: "flex",
          gap: "30px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          {/* View Mode */}
          <div>
            <label style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginRight: "15px" }}>
              View Mode:
            </label>
            <button
              onClick={() => setViewMode("multi")}
              style={{
                margin: "5px",
                padding: "8px 20px",
                backgroundColor: viewMode === "multi" ? themeColor : "#0d1117",
                color: viewMode === "multi" ? "white" : "#aaa",
                border: `2px solid ${viewMode === "multi" ? themeColor : "#2d4a22"}`,
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: viewMode === "multi" ? "bold" : "normal",
                transition: "all 0.3s ease"
              }}
            >
              Multiple Channels
            </button>
            <button
              onClick={() => setViewMode("single")}
              style={{
                margin: "5px",
                padding: "8px 20px",
                backgroundColor: viewMode === "single" ? themeColor : "#0d1117",
                color: viewMode === "single" ? "white" : "#aaa",
                border: `2px solid ${viewMode === "single" ? themeColor : "#2d4a22"}`,
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: viewMode === "single" ? "bold" : "normal",
                transition: "all 0.3s ease"
              }}
            >
              Single Channel
            </button>
          </div>

          {/* Channel Count Selector */}
          <div>
            <label style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginRight: "15px" }}>
              Channels:
            </label>
            {channelOptions.map((count) => (
              <button
                key={count}
                onClick={() => setSelectedChannelCount(count)}
                style={{
                  margin: "5px",
                  padding: "8px 20px",
                  backgroundColor: selectedChannelCount === count ? themeColor : "#0d1117",
                  color: selectedChannelCount === count ? "white" : "#aaa",
                  border: `2px solid ${selectedChannelCount === count ? themeColor : "#2d4a22"}`,
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: selectedChannelCount === count ? "bold" : "normal",
                  transition: "all 0.3s ease"
                }}
              >
                {count} Channel{count !== 1 ? 's' : ''}
              </button>
            ))}
          </div>

          {/* Pause Button */}
          {isStreaming && (
            <button
              onClick={() => {
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                }
                setIsStreaming(false);
              }}
              style={{
                padding: "8px 20px",
                backgroundColor: themeColor,
                color: "white",
                border: `2px solid ${themeColor}`,
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                transition: "all 0.3s ease"
              }}
            >
              ⏸ Pause
            </button>
          )}

          {/* Recurrence Channel Selector - Only show when Recurrence is active */}
          {activeChart === "recurrence" && (
            <div style={{ width: "100%", marginTop: "10px" }}>
              <label style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                Select 2 Channels for Recurrence Plot:
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {leads.map((leadName) => (
                  <button
                    key={leadName}
                    onClick={() => {
                      if (recurrenceSelectedLeads.includes(leadName)) {
                        // Remove if already selected
                        setRecurrenceSelectedLeads(recurrenceSelectedLeads.filter(l => l !== leadName));
                      } else if (recurrenceSelectedLeads.length < 2) {
                        // Add if less than 2 selected
                        setRecurrenceSelectedLeads([...recurrenceSelectedLeads, leadName]);
                      } else {
                        // Replace first one if 2 already selected
                        setRecurrenceSelectedLeads([recurrenceSelectedLeads[1], leadName]);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: recurrenceSelectedLeads.includes(leadName) ? themeColor : "#0d1117",
                      color: recurrenceSelectedLeads.includes(leadName) ? "white" : "#aaa",
                      border: `2px solid ${recurrenceSelectedLeads.includes(leadName) ? themeColor : "#2d4a22"}`,
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: recurrenceSelectedLeads.includes(leadName) ? "bold" : "normal",
                      transition: "all 0.3s ease"
                    }}
                  >
                    {leadName} {recurrenceSelectedLeads.indexOf(leadName) !== -1 && `(${recurrenceSelectedLeads.indexOf(leadName) + 1})`}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#8892b0" }}>
                Selected: {recurrenceSelectedLeads.join(" vs ") || "Using default (first 2 channels)"} 
              </div>
            </div>
          )}
        </div>
      )}

      {/* Downsample Factor Slider */}
      {fileName && (
        <div style={{
          margin: "15px 0",
          padding: "15px",
          backgroundColor: "#161b22",
          borderRadius: "8px",
          border: `1px solid ${themeColor}30`,
          display: "flex",
          gap: "20px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div>
            <label style={{ color: "white", fontSize: "14px", fontWeight: "bold", marginRight: "15px" }}>
              Downsample Frequency:
            </label>
            <span style={{ color: themeColor, fontSize: "16px", fontWeight: "600", marginLeft: "10px" }}>
              {downsampleFreq} Hz
            </span>
          </div>
          <input
            type="range"
            min={minFreq}
            max={maxfreq}
            step="1"
            value={downsampleFreq}
            onChange={(e) => {
              const newFreq = parseInt(e.target.value);
              handleFrequencyChange(newFreq);
            }}
            style={{
              width: "300px",
              cursor: "pointer",
              height: "6px"
            }}
          />

         
        </div>
      )}


      <div className="ecg-charts" key={streamKey} style={{ 
        padding: "10px",
        backgroundColor: "#0a0e13",
        borderRadius: "8px",
        margin: "10px 0"
      }}>
        {/* Cross Recurrence Plot */}
        {activeChart === "recurrence" && (
          <RecurrencePlot 
            recurrenceData={getRecurrencePlotData()} 
            themeColor={themeColor}
            signalType={signalType}
          />
        )}

        {/* Multi Channel View - All channels overlaid on single graph */}
        {viewMode === "multi" && activeChart === "line" && (
          <MultiChannelLinePlot
            leads={leads}
            getVisibleDataForLead={getVisibleDataForLead}
            getColorForLead={getColorForLead}
            signalType={signalType}
            themeColor={themeColor}
          />
        )}

        {/* XOR Overlay View */}
        {activeChart === "xor" && viewMode === "multi" && (
          <XOROverlayPlot
            leads={leads}
            data={data}
            getColorForLead={getColorForLead}
            windowSize={windowSize}
            sampleRate={100}
          />
        )}

        {activeChart === "xor" && viewMode === "single" && (
          <div>
            {leads.map((leadName) => (
              <div key={`xor-${leadName}`} style={{ marginBottom: '8px' }}>
                <XOROverlayPlot
                  leads={leads}
                  data={data}
                  getColorForLead={getColorForLead}
                  windowSize={windowSize}
                  leadName={leadName}
                  sampleRate={100}
                />
              </div>
            ))}
          </div>
        )}

        {viewMode === "multi" && activeChart === "polar" && (
          <MultiChannelPolarPlot
            leads={leads}
            data={data}
            getColorForLead={getColorForLead}
            signalType={signalType}
            themeColor={themeColor}
          />
        )}

        {/* Single Channel View - Original stacked view */}
        {viewMode === "single" && (activeChart === "line" || activeChart === "polar") && leads.map((leadName, idx) => (
          <div key={leadName} style={{ 
            marginBottom: "5px",
            border: "1px solid #2d4a22",
            borderRadius: "3px",
            backgroundColor: "#0d1117"
          }}>
            <div style={{ 
              padding: "5px 10px", 
              backgroundColor: "#161b22", 
              color: getColorForLead(leadName), 
              fontSize: "14px", 
              fontWeight: "bold",
              borderBottom: "1px solid #2d4a22"
            }}>
              {signalType} - Channel {leadName}
            </div>

            {activeChart === "line" && (
              <SingleChannelLinePlot
                leadName={leadName}
                getVisibleDataForLead={getVisibleDataForLead}
                getColorForLead={getColorForLead}
                signalType={signalType}
              />
            )}

            {activeChart === "polar" && (
              <SingleChannelPolarPlot
                leadName={leadName}
                data={data}
                getColorForLead={getColorForLead}
                signalType={signalType}
              />
            )}
          </div>
        ))}
        

        {data.length > 0 && (
          <div style={{
            margin: "20px auto",
            padding: "10px 20px",
            background: "#1a1a1a",
            borderRadius: "8px",
            width: "fit-content",
            textAlign: "center",
          }}>
            <div style={{ color: "white" }}>
              <label>Navigate through the signal:</label>
              <br />
              <input
                type="range"
                min={0}
                max={Math.max(getMaxViewStart(), 1)}
                value={Math.min(viewStart, Math.max(getMaxViewStart(), 1))}
                onChange={(e) => {
                  setViewStart(parseInt(e.target.value));
                  setAutoScroll(false);
                }}
                style={{
                  width: "300px",
                  margin: "10px auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {fileName && (
        <div style={{ marginTop: "20px", color: "#666", textAlign: "center" }}>
          Current file: {fileName}
        </div>
      )}
    </div>
  );
}

export default SignalPage;