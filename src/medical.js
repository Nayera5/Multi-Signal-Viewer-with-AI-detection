import { useNavigate } from "react-router-dom";
import "./CSS_files/medical.css";
import { FaHeartbeat, FaBrain, FaArrowLeft } from "react-icons/fa";
import { MdMonitorHeart } from "react-icons/md";

function Medical() {
  const navigate = useNavigate();

  return (
    <div className="medical">
      <div className="medical-container">
        <button className="back-button" onClick={() => navigate("/")}>
          <FaArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="medical-header">
          <div className="header-icon">
            <MdMonitorHeart size={70} />
          </div>
          <h1 className="medical-title">Medical Signal Analysis</h1>
          <p className="medical-subtitle">Select a signal type to begin analysis</p>
        </div>

        <div className="medical-cards-container">
          <div className="medical-signal-card ecg-card" onClick={() => navigate("/ecg")}>
            <div className="medical-card-icon">
              <FaHeartbeat size={70} />
            </div>
            <h2 className="medical-card-title">ECG Analysis</h2>
           
            
            <div className="medical-card-stats-single">
              <div className="stat-item">
                <span className="stat-value">3-12</span>
                <span className="stat-label">Leads</span>
              </div>
            </div>
          </div>

          <div className="medical-signal-card eeg-card" onClick={() => navigate("/eeg")}>
            <div className="medical-card-icon">
              <FaBrain size={70} />
            </div>
            <h2 className="medical-card-title">EEG Analysis</h2>
            
           
            <div className="medical-card-stats-single">
              <div className="stat-item">
                <span className="stat-value">4-20</span>
                <span className="stat-label">Leads</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Medical;
