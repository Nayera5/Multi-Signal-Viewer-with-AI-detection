import Plot from "react-plotly.js";
import { useState, useRef, useEffect } from "react";


const generatePolarPlotData = (leads, data, getColorForLead) => {
  return leads.map(leadName => {
    const leadData = data.filter(d => d.lead === leadName);
    const numPoints = leadData.length;
    return {
      type: "scatterpolar",
      theta: leadData.map((d, i) => (i / numPoints) * 360 ),
      r: leadData.map((d) => d.value ),
      mode: "lines",
      line: { color: getColorForLead(leadName), width: 1.5 },
      name: leadName,
    };
  });
};
    

// Recurrence Plot Component
export const RecurrencePlot = ({ recurrenceData, themeColor, signalType }) => {
  if (!recurrenceData) return null;

  return (
    <div style={{ 
      marginBottom: "20px",
      border: "1px solid #2d4a22",
      borderRadius: "3px",
      backgroundColor: "#0d1117"
    }}>
      <div style={{ 
        padding: "5px 10px", 
        backgroundColor: "#161b22", 
        color: themeColor, 
        fontSize: "14px", 
        fontWeight: "bold",
        borderBottom: "1px solid #2d4a22"
      }}>
        Cross Recurrence Plot: {recurrenceData.lead1} vs {recurrenceData.lead2}
      </div>
      
      <Plot
        data={[
          {
            type: "heatmap",
            z: recurrenceData.zData, 
            colorscale: [
              [0, '#000000'],
              [1, themeColor]
            ],
            showscale: false,
          },
        ]}
        layout={{
          title: "",
          paper_bgcolor: "#0d1117",
          plot_bgcolor: "#0d1117",
          font: { color: "white", size: 10 },
          xaxis: {
            title: `${recurrenceData.lead2} Time Index`,
            showgrid: false,
            color: "white"
          },
          yaxis: {
            title: `${recurrenceData.lead1} Time Index`,
            showgrid: false,
            color: "white"
          },
          margin: { l: 60, r: 20, t: 20, b: 60 }
        }}
        style={{ width: "100%", height: "500px" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

// Multi-Channel Line Plot Component
export const MultiChannelLinePlot = ({ leads, getVisibleDataForLead, getColorForLead, signalType, themeColor }) => {
  if (leads.length === 0) return null;

  return (
    <div style={{ 
      marginBottom: "20px",
      border: "1px solid #2d4a22",
      borderRadius: "3px",
      backgroundColor: "#0d1117"
    }}>
      <div style={{ 
        padding: "5px 10px", 
        backgroundColor: "#161b22", 
        color: themeColor, 
        fontSize: "14px", 
        fontWeight: "bold",
        borderBottom: "1px solid #2d4a22"
      }}>
        {signalType} 
      </div>
      
      <Plot
        data={leads.map(leadName => ({
          type: "scatter",
          x: getVisibleDataForLead(leadName).map((d) => d.time),
          y: getVisibleDataForLead(leadName).map((d) => d.value),
          mode: "lines",
          line: { color: getColorForLead(leadName), width: 1.5 },
          name: leadName,
        }))}
        layout={{
          title: "",
          paper_bgcolor: "#0d1117",
          plot_bgcolor: "#0d1117",
          font: { color: "white", size: 10 },
          xaxis: {
            showgrid: true,
            gridcolor: "#2d4a22",
            gridwidth: 0.5,
            title: "Time (seconds)",
            showticklabels: true,
            autorange: true,
            zeroline: true,
            showline: false
          },
          yaxis: { 
            showgrid: true,
            gridcolor: "#2d4a22",
            gridwidth: 0.5,
            autorange: true,
            title: "",
            showticklabels: true,
            tickfont: { size: 8 },
            zeroline: true,
            zerolinecolor: "#2d4a22",
            zerolinewidth: 1,
            showline: false,
            range: [-2, 2]
          },
          showlegend: true,
          legend: {
            x: 1.05,
            y: 1,
            bgcolor: "#161b22",
            bordercolor: "#2d4a22",
            borderwidth: 1
          },
          margin: { l: 40, r: 120, t: 10, b: 20 }
        }}
        config={{ 
          displayModeBar: "hover", 
          displaylogo: false,
          doubleClick: "autoscale"
        }}
        style={{ width: "100%", height: "400px" }}
        useResizeHandler={true}
      />
    </div>
  );
};

// Multi-Channel Polar Plot Component
export const MultiChannelPolarPlot = ({ leads, data, getColorForLead, signalType, themeColor }) => {
  if (leads.length === 0) return null;

  return (
    <div style={{ 
      marginBottom: "20px",
      border: "1px solid #2d4a22",
      borderRadius: "3px",
      backgroundColor: "#0d1117"
    }}>
      <div style={{ 
        padding: "5px 10px", 
        backgroundColor: "#161b22", 
        color: themeColor, 
        fontSize: "14px", 
        fontWeight: "bold",
        borderBottom: "1px solid #2d4a22"
      }}>
        {signalType} 
      </div>
      <Plot
        data={generatePolarPlotData(leads, data, getColorForLead)}
        layout={{
          title: "", 
          polar: {
            radialaxis: { visible: true, color: "white" },
            angularaxis: { visible: true, color: "white" },
            bgcolor: "black",
          },
          paper_bgcolor: "black",
          font: { color: "white" },
          showlegend: true,
          legend: {
            x: 1.05,
            y: 1,
            bgcolor: "#161b22",
            bordercolor: "#2d4a22",
            borderwidth: 1
          },
        }}
        style={{ width: "100%", height: "400px" }}
      />
    </div>
  );
};

// Single Channel Line Plot Component
export const SingleChannelLinePlot = ({ leadName, getVisibleDataForLead, getColorForLead, signalType }) => {
  const visibleData = getVisibleDataForLead(leadName);
  if (visibleData.length === 0) return null;

  return (
    <Plot
      data={[
        {
          type: "scatter",
          x: visibleData.map((d) => d.time),
          y: visibleData.map((d) => d.value),
          mode: "lines",
          line: { color: getColorForLead(leadName), width: 1.2 },
          name: `${signalType} ${leadName}`,
        },
      ]}
      layout={{
        title: "",
        paper_bgcolor: "#0d1117",
        plot_bgcolor: "#0d1117",
        font: { color: "white", size: 10 },
        xaxis: {
          showgrid: true,
          gridcolor: "#2d4a22",
          gridwidth: 0.5,
          title: "Time (seconds)",
          showticklabels: true,
          autorange: true,
          zeroline: false,
          showline: false
        },
        yaxis: { 
          showgrid: true,
          gridcolor: "#2d4a22",
          gridwidth: 0.5,
          autorange: true,
          title: "",
          showticklabels: true,
          tickfont: { size: 8 },
          zeroline: true,
          zerolinecolor: "#2d4a22",
          zerolinewidth: 1,
          showline: false,
          range: [-2, 2]
        },
        showlegend: false,
        margin: { l: 40, r: 20, t: 10, b: 20 }
      }}
      config={{ 
        displayModeBar: "hover", 
        displaylogo: false 
      }}
      style={{ width: "100%", height: "300px" }}
      useResizeHandler={true}
    />
  );
};

// Single Channel Polar Plot Component
export const SingleChannelPolarPlot = ({ leadName, data, getColorForLead, signalType }) => {
  const leadData = data.filter(d => d.lead === leadName);
  if (leadData.length === 0) return null;

  return (
    <Plot
      data={generatePolarPlotData([leadName], data, getColorForLead)}
      layout={{
        title: "", 
        polar: {
          radialaxis: { visible: true, color: "white" },
          angularaxis: { visible: true, color: "white" },
          bgcolor: "black",
        },
        paper_bgcolor: "black",
        font: { color: "white" },
      }}
      config={{ 
        displayModeBar: "hover", 
        displaylogo: false,
        doubleClick: "autoscale"
      }}
      style={{ width: "100%", height: "400px" }}
      useResizeHandler={true}
    />
  );
};

// XOR Overlay Plot
export const XOROverlayPlot = ({ leads, data, getColorForLead, windowSize = 5000, epsilon = 1e-2, leadName = null, sampleRate = 100 }) => {
  // chunkSize will be 500 samples as requested
  const chunkSize = 709;
  const chunkDurationSec = chunkSize / sampleRate; // seconds per chunk
  const localLeads = leadName ? [leadName] : leads;

  // animation state: reveal chunks sequentially (show chunk 0, then 1 with XOR, pause 2s, then 2, ...)
  const chunkCounts = localLeads.map(l => Math.ceil(data.filter(d => d.lead === l).length / chunkSize));
  const maxChunkCount = chunkCounts.length > 0 ? Math.max(...chunkCounts) : 0;
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // reset when number of chunks changes
    setCurrentChunkIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (maxChunkCount <= 1) return undefined;

    timerRef.current = setInterval(() => {
      setCurrentChunkIndex(prev => {
        if (prev + 1 >= maxChunkCount) {
          // stop at last chunk
          clearInterval(timerRef.current);
          timerRef.current = null;
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [maxChunkCount]);

  if (!localLeads || localLeads.length === 0) return null;

  const traces = [];

  localLeads.forEach((lead) => {
    const leadData = data.filter(d => d.lead === lead);
    if (!leadData || leadData.length === 0) return;

    const chunkCount = Math.ceil(leadData.length / chunkSize);

    // Build chunks: an array of arrays where each inner array contains the numeric values
    // for that chunk index. This allows referencing chunks[c][i] below.
    const chunks = Array.from({ length: chunkCount }, (_, c) =>
      leadData
        .slice(c * chunkSize, (c + 1) * chunkSize)
        .map((d) => (d && typeof d.value !== 'undefined' ? d.value : null))
    );

    // Helper: generate a readable color per chunk index
    const getChunkColor = (idx) => {
      const hue = (idx * 47) % 360; // step hue by 47 degrees to spread colors
      return `hsl(${hue},70%,60%)`;
    };

    // For each sample index, perform parity grouping across chunk values so identical values cancel
    // number of visible chunks at this moment (revealed sequentially)
    const visibleChunkCount = Math.min(chunkCount, currentChunkIndex + 1);

    for (let i = 0; i < chunkSize; i++) {
      // collect entries {chunk, value}
      const entries = [];
      for (let c = 0; c < visibleChunkCount; c++) {
        const v = chunks[c][i];
        if (v !== undefined && v !== null) entries.push({ c, v });
      }
      if (entries.length === 0) continue;

      // group values by proximity within epsilon
      const groups = [];
      entries.forEach(({ c, v }) => {
        let placed = false;
        for (const g of groups) {
          if (Math.abs(g.representative - v) <= epsilon) {
            g.chunks.push(c);
            g.sum += v;
            g.count += 1;
            placed = true;
            break;
          }
        }
        if (!placed) {
          groups.push({ representative: v, chunks: [c], sum: v, count: 1 });
        }
      });

      // For each group, if count is odd -> it survives XOR; else it cancels
      // For each group, check both XOR parity and actual numeric spread
      for (const g of groups) {
        // If the number of values is even → skip it as usual
        if (g.count % 2 === 0) continue;

        // Calculate the min and max value in the group
        const minVal = Math.min(...g.chunks.map(c => chunks[c][i]));
        const maxVal = Math.max(...g.chunks.map(c => chunks[c][i]));
        const spread = Math.abs(maxVal - minVal);

        // If all values are very close (difference < epsilon) → treat it as noise and skip drawing
        if (spread < epsilon) continue;

        // If both conditions pass, actually draw it
        const meanVal = g.sum / g.count;
        let markerColor;
        if (g.chunks.length === 1) {
          markerColor = getChunkColor(g.chunks[0]);
        } 
        // else {
        //   markerColor = '#ffd166'; // XOR difference highlight
        // }

        let traceKey, traceName, traceColor;
        if (g.chunks.length === 1) {
          const chunkIdx = g.chunks[0];
          traceKey = `${lead}_chunk_${chunkIdx}`;
          traceName = `${lead} chunk ${chunkIdx + 1}`;
          traceColor = getChunkColor(chunkIdx);
        } else {
          traceKey = `${lead}_xor_mixed`;
          traceName = `${lead} xor (mixed)`;
          traceColor = '#ffd166';
        }

        let trace = traces.find(t => t._meta && t._meta.key === traceKey);
        if (!trace) {
          trace = {
            type: 'scatter',
            x: [],
            y: [],
            mode: 'markers',
            marker: { color: traceColor, size: 3 },
            name: traceName,
            _meta: { key: traceKey }
          };
          traces.push(trace);
        }

        trace.x.push(i / sampleRate);
        trace.y.push(meanVal);
      }

    }
  });

  if (traces.length === 0) {
    return (
      <div style={{ padding: '12px', color: '#888' }}>
        No XOR differences detected yet (not enough data or chunks are identical).
      </div>
    );
  }

  return (
    <div style={{ 
      marginBottom: '20px',
      border: '1px solid #2d4a22',
      borderRadius: '3px',
      backgroundColor: '#0d1117'
    }}>
      <div style={{ 
        padding: '5px 10px', 
        backgroundColor: '#161b22', 
        color: '#9be79b', 
        fontSize: '14px', 
        fontWeight: 'bold',
        borderBottom: '1px solid #2d4a22'
      }}>
        {leadName ? `XOR Overlay - ${leadName}` : 'XOR Overlay'}
        <span style={{ marginLeft: 12, fontSize: 12, color: '#9fb0c8', fontWeight: 600 }}>
          ({chunkSize} samples ≈ {chunkDurationSec.toFixed(2)} s per chunk)
        </span>
      </div>

      <Plot
        data={traces}
        layout={{
          title: '',
          paper_bgcolor: '#0d1117',
          plot_bgcolor: '#0d1117',
          font: { color: 'white', size: 10 },
          xaxis: { showgrid: true, gridcolor: '#2d4a22', gridwidth: 0.5, title: 'Time' },
          yaxis: { showgrid: true, gridcolor: '#2d4a22', gridwidth: 0.5, title: 'XOR / Diff', autorange: true },
          showlegend: true,
          legend: { x: 1.05, y: 1, bgcolor: '#161b22', bordercolor: '#2d4a22', borderwidth: 1 },
          margin: { l: 40, r: 120, t: 10, b: 40 }
        }}
        config={{ displayModeBar: 'hover', displaylogo: false }}
        style={{ width: '100%', height: '420px' }}
        useResizeHandler={true}
      />
    </div>
  );
};

