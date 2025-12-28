from Loader import SignalLoader
import numpy as np
import pandas as pd
from scipy import signal
from flask import jsonify, Response,request,Blueprint
import time,json
from ecgTest import ecg_prediction
from EEG_test import predict_eeg_csv


def create_signal_routes(name, default_leads):
    bp = Blueprint(name, __name__)
    loader =None
    original_freq = 128 if name.upper() == "EEG" else 500

#___________________________________________________________________________________
    @bp.route('/upload_data', methods=['POST'])
    def upload_data():
        nonlocal loader
        file = request.files['file']
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                "status": "error",
                "message": "Invalid file type. Only .csv files are allowed"
            }), 400  
        loader = SignalLoader(file)
        df= loader.load_data()
        return jsonify({
        "status": "success",
        "filename": file.filename,
        "message": "File uploaded successfully"})
    #_______________________________________________________________________________

    def stream_generator(selected_leads, chunk_size=500, delay=0.5, target_freq=500):
        start = 0
        total = len(loader.df)
        
        ratio = target_freq / original_freq if target_freq > 0 else 1
        read_size = chunk_size  
        
        while start < total:
            chunk = loader.get_chunk(start_idx=start, chunk_size=read_size, leads=selected_leads)
            
            
            if target_freq != original_freq:
                new_samples = int(chunk_size * ratio)
                
                for lead in selected_leads:
                    if lead in chunk:
                        chunk[lead] = np.array(chunk[lead])
                        chunk[lead] = signal.resample(chunk[lead], new_samples)
                        chunk[lead] = chunk[lead].tolist()
                

                start_time = chunk['time'][0]
                time_step = 1.0 / target_freq  
                chunk['time'] = [start_time + i * time_step for i in range(new_samples)]
            
            for key in chunk:
                if isinstance(chunk[key], np.ndarray):
                    chunk[key] = chunk[key].tolist()
            
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(delay)
            start += read_size
        
        yield f"data: {json.dumps({'end': True})}\n\n"
        
    #___________________________________________________________________________________
   
    @bp.route('/stream')
    def stream():
        all_leads = loader.get_leads()
        selected_leads = all_leads[:default_leads]
        target_freq = request.args.get('freq', 500, type=int)  
        return Response(stream_generator(selected_leads, target_freq=target_freq), mimetype='text/event-stream')


    #___________________________________________________________________________________
    @bp.route("/stream_leads/<int:num_leads>")
    def stream_leads(num_leads):
        all_leads = loader.get_leads()
        selected_leads = all_leads[:num_leads]
        return Response(stream_generator(selected_leads), mimetype='text/event-stream')
    #___________________________________________________________________________________

    @bp.route("/get_leads", methods=["GET"])
    def get_leads():
        if loader.df is None:
            return {"status": "error", "message": "No file uploaded"}, 400
        return {"leads": loader.get_leads()}
    #___________________________________________________________________________________
    @bp.route('/predict', methods=['POST'])
    def predict():
        nonlocal loader
        if loader is None:
            return jsonify({
                "status": "error",
                "message": "No file uploaded yet"
            }), 400
        
        data = request.get_json() if request.is_json else {}
        target_freq = data.get("freq", original_freq)
        
        df = loader.df.copy()

        if target_freq <= original_freq:
            print(f"Downsampling from {original_freq}Hz → {target_freq}Hz")

            factor = target_freq / original_freq
            new_len = int(len(df) * factor)
            resampled_cols = {}
            for col in df.columns:
                resampled_cols[col] = signal.resample(df[col].to_numpy(), new_len)

        df = pd.DataFrame(resampled_cols)
        
        if name.upper() == "ECG":
            result = ecg_prediction(df)
            if result is None:
                return jsonify({
                    "status": "error",
                    "message": "ECG prediction failed"
                }), 500
        elif name.upper() == "EEG":
            result = predict_eeg_csv(df)
            if result is None:
                return jsonify({
                    "status": "error",
                    "message": "EEG prediction failed"
                }), 500
            
        else:
            return jsonify({
                "status": "error",
                "message": f"Unknown signal type: {name}"
            }), 400
        

        return jsonify({
            "status": "success",
            "prediction": result
        })



    return bp
