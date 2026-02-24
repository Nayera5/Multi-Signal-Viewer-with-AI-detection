import { useNavigate } from "react-router-dom";
import "./CSS_files/home.css";
import { GiSoundWaves } from "react-icons/gi";
import { TbHeartRateMonitor } from "react-icons/tb";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">TOP Signal</h1>
          <p className="home-subtitle">Visualize and analyze your signal data in real-time</p>
        </div>

        <div className="cards-container">
          <div className="signal-card medical-card" onClick={() => navigate("/medical")}>
            <div className="card-icon">
              <TbHeartRateMonitor size={60} />
            </div>
            <h2 className="card-title">Medical Signals</h2>
            {/* <p className="card-description">
              Analyze ECG and EEG signals with advanced visualization tools
            </p> */}
            <div className="card-features">
              <span className="feature-tag">ECG</span>
              <span className="feature-tag">EEG</span>
              <span className="feature-tag">Real-time</span>
            </div>
          </div>

          <div className="signal-card sound-card" onClick={() => navigate("/sound")}>
            <div className="card-icon">
              <GiSoundWaves size={60} />
            </div>
            <h2 className="card-title">Sound Signals</h2>
            {/* <p className="card-description">
              Process and visualize audio signals with powerful analytics
            </p> */}
            <div className="card-features">
              <span className="feature-tag">Audio</span>
              <span className="feature-tag">Doppler</span>
              <span className="feature-tag">Spectrum</span>
            </div>
          </div>
        </div>

        <footer className="home-footer">
          <p>Choose a signal type to get started</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
