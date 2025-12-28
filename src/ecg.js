import SignalPage from "./signal_viewer";

function ECG() {
  return (
    <SignalPage
      signalType="ECG"
      title="ECG Signal"
      themeColor="#b73acdff"
      apiBaseUrl={process.env.REACT_APP_API_BASE_URL}
      leadsEndpoint={process.env.REACT_APP_LEADS_ENDPOINT_ecg}      
      uploadEndpoint={process.env.REACT_APP_UPLOAD_ENDPOINT_ecg}    
      streamEndpoint={process.env.REACT_APP_STREAM_ENDPOINT_ecg}
      AidetectionEndpoint={process.env.REACT_APP_DETECTION_ENDPOINT_ecg} 
      maxfreq={500}
      channelCount={12}
      channelOptions={[3, 12]}
      channelColors={{
        'I': '#98a2f8ff',
        'II': '#ece684ff',
        'III': '#4aa478ff'
      }}
      windowSize={1000}
      compressionFactor={1}
    />
  );
}

export default ECG;