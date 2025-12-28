from flask import Flask
from signals import create_signal_routes
from sar_routes import sar_bp
# from drones import drones_bp
from flask_cors import CORS
from detect import detect
from generate import generate

app = Flask(__name__)
CORS(app)  

#_________________________________________________________________
ecg_bp = create_signal_routes("ECG", default_leads=12)
app.register_blueprint(ecg_bp, url_prefix="/ecg")

eeg_bp = create_signal_routes("EEG", default_leads=19)
app.register_blueprint(eeg_bp, url_prefix="/eeg")
#_________________________________________________________________
app.register_blueprint(sar_bp, url_prefix="/sar")
#_________________________________________________________________
# app.register_blueprint(drones_bp, url_prefix="/drones")

app.register_blueprint(generate)
app.register_blueprint(detect)


@app.route('/')
def index():
    return "Signal Viewer Backend is running ^ ^"


if __name__ == "__main__":
    app.run(debug=True)



