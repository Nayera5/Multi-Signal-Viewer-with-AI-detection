// EEG.js - Just configuration!
import SignalPage from "./signal_viewer";

function EEG() {
  return (
    <SignalPage
      signalType="EEG"
      title="EEG Signal"
      themeColor="#6ac1e4ff"
      apiBaseUrl={process.env.REACT_APP_API_BASE_URL}
      leadsEndpoint={process.env.REACT_APP_LEADS_ENDPOINT_eeg}
    uploadEndpoint={process.env.REACT_APP_UPLOAD_ENDPOINT_eeg}
      streamEndpoint={process.env.REACT_APP_STREAM_ENDPOINT_eeg}
      AidetectionEndpoint={process.env.REACT_APP_DETECTION_ENDPOINT_eeg}
      maxfreq={128}
      channelCount={19}
      channelOptions={[4, 8, 12, 19]}
      channelColors={{
        'FP1': '#a46bf0ff',
        'FP2': '#6ac1e4ff',
        'F3': '#e3eb83ff',
        'F4': '#ff6b9d'
      }}
      windowSize={5000}
      compressionFactor={1}
    />
  );
}

export default EEG;