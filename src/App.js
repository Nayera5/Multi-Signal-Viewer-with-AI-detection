import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import Medical from "./medical";
import ECG from "./ecg";
import EEG from "./eeg";
import Sound from "./sound";
import Detect from "./detect";
import Generate from "./generate";
import SARViewer from "./sar";
import Drone from "./drones";
import Speech from "./speech";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/medical" element={<Medical />} />
        <Route path="/ecg" element={<ECG />} />
        <Route path="/eeg" element={<EEG />} />
        <Route path="/sound" element={<Sound />} />
        <Route path="/detect" element={<Detect />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/sar" element={<SARViewer />} />
        <Route path="/drones" element={<Drone />} />
        <Route path="/speech" element={<Speech />} />
      </Routes>
    </Router>
  );
}

export default App;

