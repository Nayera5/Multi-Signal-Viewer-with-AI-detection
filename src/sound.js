import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./CSS_files/sound.css";
import { FaCar,FaArrowLeft } from "react-icons/fa";
import { MdAudiotrack } from "react-icons/md";
import { GiDeliveryDrone,GiHumanCannonball,GiHumanEar,GiHumanPyramid,GiHumanTarget,GiRadarSweep } from "react-icons/gi";


function Sound() {
  const navigate = useNavigate();
  const [showCarDropdown, setShowCarDropdown] = useState(false);

  return (
    <div className="sound">
      <div className="sound-container">
        <button className="back-button" onClick={() => navigate("/")}>
          <FaArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="sound-header">
          <div className="header-icon">
            <MdAudiotrack size={70} />
          </div>
          <h1 className="sound-title">Sound Signal Analysis</h1>
          <p className="sound-subtitle">Select a signal type to begin analysis</p>
        </div>

        <div className="sound-cards-container">
          <div className="sound-signal-card car-card" onClick={() => setShowCarDropdown(!showCarDropdown)}>
            <div className="sound-card-icon">
              <FaCar size={70} />
            </div>
            <h2 className="sound-card-title">Car Sounds {showCarDropdown ? "▲" : "▼"}</h2>
            
            
            {showCarDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate("/detect"); }}>
                  Car Detection
                </div>
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate("/generate"); }}>
                  Generate Car Sound
                </div>
              </div>
            )}
          </div>

          <div className="sound-signal-card drone-card" onClick={() => navigate("/drones")}>
            <div className="sound-card-icon">
              <GiDeliveryDrone size={70} />
            </div>
            <h2 className="sound-card-title">Drone Sounds</h2>
            
           
            <div className="sound-card-stats-single">
              <div className="stat-item">
                <span className="stat-value">Analysis</span>
                <span className="stat-label">Mode</span>
              </div>
            </div>
          </div>


        <div className="sound-signal-card drone-card" onClick={() => navigate("/sar")}>
            <div className="sound-card-icon">
              <GiRadarSweep size={70} />
            </div>
            <h2 className="sound-card-title">SAR</h2>
            <div className="sound-card-stats-single">
              <div className="stat-item">
                <span className="stat-value">Analysis</span>
                <span className="stat-label">Mode</span>
              </div>
            </div>
          </div>

        <div className="sound-signal-card car-card" onClick={() => navigate("/Speech")}>
            <div className="sound-card-icon">
              <GiHumanEar size={70} />
            </div>
            <h2 className="sound-card-title">Speech</h2>
            <div className="sound-card-stats-single">
              <div className="stat-item">
                <span className="stat-value">Analysis</span>
                <span className="stat-label">Mode</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

export default Sound;
