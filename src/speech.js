// import React, { useState, useRef } from "react";
// import "./CSS_files/speech.css";
// import { useNavigate } from 'react-router-dom';
// import { FaHome, FaArrowCircleUp, FaArrowLeft } from 'react-icons/fa';


// function Speech() {
//   const [sampleRate, setSampleRate] = useState(48000);
//   const navigate = useNavigate();
//   const audioCtxRef = useRef(null);
//   const bufferRef = useRef(null);
//   const sourceRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [aiResult, setAiResult] = useState(null);
//   const [aiLoading, setAiLoading] = useState(false);
//   const fileInputRef = useRef(null);
//   const [fileName, setFileName] = useState('');
//   const themeColor = '#e790f6';

//   // decode uploaded file to AudioBuffer
//   const decodeFileToBuffer = async (file) => {
//     if (!file) return null;
//     try {
//       setIsLoading(true);
//       if (!audioCtxRef.current) {
//         audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
//       }
//       const arrayBuffer = await file.arrayBuffer();
//       const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
//       bufferRef.current = audioBuffer;
//       bufferRef.current.name = file.name;
//       return audioBuffer;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileChange = async (e) => {
//     const f = e.target.files && e.target.files[0];
//     if (!f) return;
//     await decodeFileToBuffer(f);
//   };

//   const playAudio = async () => {
//     const audioCtx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
//     audioCtxRef.current = audioCtx;

//     if (!bufferRef.current) {
//       alert('Please upload an audio file before playing.');
//       return;
//     }

//     const buffer = bufferRef.current;
//     const originalSampleRate = buffer.sampleRate;

//     console.log(originalSampleRate);
//     console.log(sampleRate);
//     // create a new buffer with modified playback sampleRate
//     const newBuffer = audioCtx.createBuffer(
//       buffer.numberOfChannels,
//       buffer.length,
//       sampleRate
//     );

//     console.log(sampleRate);
//     const downSampleRatio =  sampleRate / originalSampleRate ;
//     console.log(downSampleRatio);
    

//     for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
//       const oldData = buffer.getChannelData(ch);
//       console.log(oldData[0]);
//       const newData = newBuffer.getChannelData(ch);
//       for (let i = 0; i < newData.length; i++) {
//         newData[i] = oldData[Math.floor(i / downSampleRatio)] || 0;
//       }
//     }
    
//     const source = audioCtx.createBufferSource();
//     source.buffer = newBuffer;
//     source.connect(audioCtx.destination);
//     source.start();
//     source.onended = () => { setIsPlaying(false); sourceRef.current = null; };
//     sourceRef.current = source;
//     setIsPlaying(true);
//   };

//   return (
//     <div className="speech">
//       <div className="icons-wrapper">
//         <div className="icon-btn" role="button" tabIndex={0} aria-label="Go back" onClick={() => navigate(-1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(-1); } }}>
//           <FaArrowLeft className="icon" size={22} color={themeColor} />
//         </div>

//         <div className="icon-btn" role="button" tabIndex={0} aria-label="Home" onClick={() => navigate('/')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/'); } }}>
//           <FaHome className="icon" size={22} color={themeColor} />
//         </div>

//         {/* Analyze Gender button */}
//         <div className="icon-btn" role="button" tabIndex={0} aria-label="Analyze gender" onClick={async () => {
//             if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) { alert('Please upload a file first'); return; }
//             setAiLoading(true); 
//             setAiResult(null);
//             const f = fileInputRef.current.files[0];
//             const fd = new FormData(); 
//             fd.append('file', f);
//             try {
//               const res = await fetch('http://127.0.0.1:5000/gender/predict', {
//               method: 'POST',
//               body: fd
//             });

//               const json = await res.json();
//               if (json.status === 'success') 
//                 setAiResult(json.prediction);
//               else 
//                 setAiResult(json.message || 'Prediction failed');
//             } catch (err) {
//               setAiResult('Error connecting to server');
//             } finally { setAiLoading(false); }
//         }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); /* same click handler will run because onClick is async */ } }}>
//           <span style={{ fontSize: 18, color: themeColor }}>🤖</span>
//         </div>

//         {/* Upload icon triggers the hidden file input for accessibility and keyboard support */}
//         <div
//           role="button"
//           tabIndex={0}
//           aria-label="Upload audio file"
//           className="icon-btn upload-icon-container"
//           onClick={() => fileInputRef.current && fileInputRef.current.click()}
//           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
//         >
//           <FaArrowCircleUp size={22} color={themeColor} />
//         </div>

//         <input
//           type="file"
//           ref={fileInputRef}
//           style={{ display: "none" }}
//           accept="audio/*"
//           onChange={async (e) => { await handleFileChange(e); const f = e.target.files && e.target.files[0]; setFileName(f ? f.name : ''); }}
//         />
//       </div>
      
//       <div className="card">
//         <h2>🎧 Downsampling & Aliasing Demo</h2>

//         <label className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//           <span>Uploaded File:</span>
//           <span style={{ color: '#cfc6ff', fontWeight: 500 }}>{fileName || 'No file selected'}</span>
//           {isLoading && <span style={{ marginLeft: 10, color: '#cfc6ff' }}>Loading...</span>}
//         </label>
//         {/* AI Prediction status */}
//         <div style={{ minHeight: 22, marginBottom: 8 }}>
//           {aiLoading ? <span style={{ color: '#cfc6ff' }}>Analyzing...</span> : aiResult ? <span style={{ color: '#cfc6ff' }}>Prediction: <strong>{aiResult}</strong></span> : null}
//         </div>

//         <div className="range-container">
//           <input
//             type="range"
//             min="3000"
//             max="48000"
//             step="20"
//             value={ Math.round(sampleRate / 96) }
            
//             onChange={(e) => setSampleRate(parseInt(e.target.value))}
//           />
//           <p>Sample Rate: <strong>{Math.round(sampleRate)} Hz</strong></p>
//         </div>

//         <div className={`play-controls`}> 
//           <button onClick={playAudio} className={`btn-play`}>▶ Play</button>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default Speech;




// // import React, { useState, useRef } from "react";
// // import "./CSS_files/speech.css";
// // import { useNavigate } from 'react-router-dom';
// // import { FaHome, FaArrowCircleUp, FaArrowLeft } from 'react-icons/fa';


// // function Speech() {
// //   const [sampleRate, setSampleRate] = useState(48000);
// //   const navigate = useNavigate();
// //   const audioCtxRef = useRef(null);
// //   const bufferRef = useRef(null);
// //   const sourceRef = useRef(null);
// //   const [isPlaying, setIsPlaying] = useState(false);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const fileInputRef = useRef(null);
// //   const [fileName, setFileName] = useState('');
// //   const themeColor = '#e790f6';

// //   // decode uploaded file to AudioBuffer
// //   const decodeFileToBuffer = async (file) => {
// //     if (!file) return null;
// //     try {
// //       setIsLoading(true);
// //       if (!audioCtxRef.current) {
// //         audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
// //       }
// //       const arrayBuffer = await file.arrayBuffer();
// //       const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
// //       bufferRef.current = audioBuffer;
// //       bufferRef.current.name = file.name;
// //       return audioBuffer;
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const handleFileChange = async (e) => {
// //     const f = e.target.files && e.target.files[0];
// //     if (!f) return;
// //     await decodeFileToBuffer(f);
// //   };

// //   const playAudio = async () => {
// //     const audioCtx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
// //     audioCtxRef.current = audioCtx;

// //     if (!bufferRef.current) {
// //       alert('Please upload an audio file before playing.');
// //       return;
// //     }

// //     const buffer = bufferRef.current;
// //     const originalSampleRate = buffer.sampleRate;

// //     // We'll create the output buffer at the AudioContext's sample rate (guaranteed supported)
// //     const ctxRate = audioCtx.sampleRate || 48000;

// //     // Desired (requested) sample rate from the UI
// //     const desiredRate = Math.max(1, Math.floor(sampleRate));

// //     // Output length at the context's sample rate for the same duration
// //     const outputLength = Math.max(1, Math.floor(buffer.length * (ctxRate / originalSampleRate)));

// //     const newBuffer = audioCtx.createBuffer(
// //       buffer.numberOfChannels,
// //       outputLength,
// //       ctxRate
// //     );

// //     // sample-and-hold: for each output sample time, pick the most recent desired-rate sample
// //     // This emulates a low sample-rate capture while keeping the buffer's sampleRate in allowed range
// //     for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
// //       const oldData = buffer.getChannelData(ch);
// //       const newData = newBuffer.getChannelData(ch);
// //       for (let i = 0; i < outputLength; i++) {
// //         // time in seconds for the output sample
// //         // k is the index at the desired sample rate (which stays constant for a block of output samples)
// //         const k = Math.floor(i * (desiredRate / ctxRate));
// //         const srcIndex = Math.floor(k * (originalSampleRate / desiredRate));
// //         newData[i] = oldData[srcIndex] || 0;
// //       }
// //     }
    
// //     const source = audioCtx.createBufferSource();
// //     source.buffer = newBuffer;
// //     source.connect(audioCtx.destination);
// //     source.start();
// //     source.onended = () => { setIsPlaying(false); sourceRef.current = null; };
// //     sourceRef.current = source;
// //     setIsPlaying(true);
// //   };

// //   return (
// //     <div className="speech">
// //       <div className="icons-wrapper">
// //         <div className="icon-btn" role="button" tabIndex={0} aria-label="Go back" onClick={() => navigate(-1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(-1); } }}>
// //           <FaArrowLeft className="icon" size={22} color={themeColor} />
// //         </div>

// //         <div className="icon-btn" role="button" tabIndex={0} aria-label="Home" onClick={() => navigate('/')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/'); } }}>
// //           <FaHome className="icon" size={22} color={themeColor} />
// //         </div>

// //         {/* Upload icon triggers the hidden file input for accessibility and keyboard support */}
// //         <div
// //           role="button"
// //           tabIndex={0}
// //           aria-label="Upload audio file"
// //           className="icon-btn upload-icon-container"
// //           onClick={() => fileInputRef.current && fileInputRef.current.click()}
// //           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
// //         >
// //           <FaArrowCircleUp size={22} color={themeColor} />
// //         </div>

// //         <input
// //           type="file"
// //           ref={fileInputRef}
// //           style={{ display: "none" }}
// //           accept="audio/*"
// //           onChange={async (e) => { await handleFileChange(e); const f = e.target.files && e.target.files[0]; setFileName(f ? f.name : ''); }}
// //         />
// //       </div>
      
// //       <div className="card">
// //         <h2>🎧 Downsampling & Aliasing Demo</h2>

// //         <label className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// //           <span>Uploaded File:</span>
// //           <span style={{ color: '#cfc6ff', fontWeight: 500 }}>{fileName || 'No file selected'}</span>
// //           {isLoading && <span style={{ marginLeft: 10, color: '#cfc6ff' }}>Loading...</span>}
// //         </label>

// //         <div className="range-container">
// //           <input
// //             type="range"
// //             min="300"
// //             max="48000"
// //             step="10"
// //             value={sampleRate}
// //             onChange={(e) => setSampleRate(parseInt(e.target.value, 10))}
// //           />
// //           <p>Sample Rate: <strong>{Math.round(sampleRate)} Hz</strong></p>
// //         </div>

// //         <div className={`play-controls`}> 
// //           <button onClick={playAudio} className={`btn-play`}>▶ Play</button>
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }

// // export default Speech;




import React, { useState, useRef } from "react";
import "./CSS_files/speech.css";
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowCircleUp, FaArrowLeft } from 'react-icons/fa';
import { RiRobot2Line } from "react-icons/ri";
import { processAudioToWav, decodeAudioFile } from './Sound_Downsampling.js';

function Speech() {
  const [sampleRate, setSampleRate] = useState(48000); // âœ… Ø§ÙØªØ±Ø§Ø¶ÙŠ Ù„Ø­Ø¯ Ù…Ø§ ÙŠØªÙ‚Ø±Ø£ Ø§Ù„Ù…Ù„Ù
  const [originalRate, setOriginalRate] = useState(48000); // âœ… ØªØ±Ø¯Ø¯ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø£ØµÙ„ÙŠ
  const [fileName, setFileName] = useState('');
  const [processedAudio, setProcessedAudio] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const themeColor = '#e790f6';

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


  // ✅ زر تغيير تردد العينة (تغيير sample rate)
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

  // ✅ زر تحليل الصوت (gender detection)
const analyzeGender = async () => {
  const file = fileInputRef.current?.files?.[0];
  if (!file) return alert('Upload an audio file first');

  setLoading(true);
  setAiResult(null);

  try {
    // 👇 نعيد إنتاج الصوت بالـ sampleRate الحالي (من السلايدر)
    const wavBlob = await processAudioToWav(file, sampleRate);

    // نستخدم الصوت الجديد (المُعاد توليده)
    setProcessedAudio(wavBlob);

    // نجهزه للإرسال
    const fd = new FormData();
    fd.append('file', wavBlob, `speech_${sampleRate}.wav`);

    const res = await fetch('http://127.0.0.1:5000/gender/predict', {
      method: 'POST',
      body: fd,
    });

    const json = await res.json();
    if (json.status === 'success') {
      setAiResult(json.prediction);
    } else {
      setAiResult(json.message || 'Prediction failed');
    }
  } catch (err) {
    console.error('Error analyzing audio:', err);
    setAiResult('Error processing or connecting to server');
  } finally {
    setLoading(false);
  }
};




// const handlePlay = async () => {
//   if (!processedAudio) {
//     alert("No processed audio to play");
//     return;
//   }

//   try {
//     const arrayBuffer = await processedAudio.arrayBuffer();
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

//     const src = ctx.createBufferSource();
//     src.buffer = decodedBuffer;
//     src.connect(ctx.destination);
//     src.start();
//     console.log("Playing processed audio manually 🎵");
//   } catch (err) {
//     console.error("Error playing audio:", err);
//   }
// };



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
        <h2>ðŸŽ§ Downsampling & Gender Detection</h2>

        <p style={{ color: '#cfc6ff' }}>
          Uploaded File: <strong>{fileName || 'None'}</strong>
        </p>

        {loading ? (
          <p>Analyzing...</p>
        ) : (
          aiResult && <p>Prediction: <strong>{aiResult}</strong></p>
        )}

        {/* âœ… Ø§Ù„Ø³Ù„Ø§ÙŠØ¯Ø± ÙŠØ¸Ù‡Ø± Ø¨Ø¹Ø¯ Ø±ÙØ¹ Ù…Ù„Ù */}
        {fileName && (
          <div className="range-container">
            <input
              type="range"
              min="3000"
              max={originalRate || 48000} // fallback Ù„Ùˆ Ù„Ø³Ù‡ Ø§Ù„ØªØ±Ø¯Ø¯ Ù…ØªØ¬Ø§Ø¨Ø´
              step="5"
              value={sampleRate}
              onChange={handleSampleRateChange}
            />
            <p>Sample Rate: <strong>{sampleRate} Hz</strong></p>
          </div>
        )}

        {processedAudio && (
          <>
            <button onClick={downloadAudio} className="btn-download" style={{ marginTop: '10px' }}>
              Download Audio
            </button>
            {/* <button onClick={handlePlay} className="btn-play" style={{ marginTop: '10px' }}>
              ▶️ Play Audio
            </button> */}
          </>
        )}

        <audio ref={audioRef} controls style={{ marginTop: '10px' }} />
      </div>
    </div>
  );
}

export default Speech;
