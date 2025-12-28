from Loader import SignalLoader
from flask import jsonify, Response,request,Blueprint
import time,json
from ecgTest import predict_from_csv
from EEG_test import predict_eeg_csv

def create_signal_routes(name, default_leads):
    bp = Blueprint(name, __name__)
    loader =None

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
        print("csv")
        loader = SignalLoader(file)
        df= loader.load_data()
        return jsonify({
        "status": "success",
        "filename": file.filename,
        "message": "File uploaded successfully"})
    #_______________________________________________________________________________


    def stream_generator(selected_leads, chunk_size=500, delay=0.5):
        start = 0
        total = len(loader.df)
        while start < total:
            chunk = loader.get_chunk(start_idx=start, chunk_size=chunk_size, leads=selected_leads)
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(delay)
            start += chunk_size
        yield f"data: {json.dumps({'end': True})}\n\n"

    #___________________________________________________________________________________
    @bp.route('/stream')
    def stream():
        all_leads = loader.get_leads()
        selected_leads = all_leads[:default_leads]  # default 3 leads
        return Response(stream_generator(selected_leads), mimetype='text/event-stream')
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

    @bp.route('/predict', methods=['GET'])
    def predict_ecg():
        nonlocal loader
        if loader is None:
            return jsonify({
                "status": "error",
                "message": "No file uploaded yet"
            }), 400
        
        df = loader.df 
        print(df)
        result = predict_from_csv(df)  

        return jsonify({
            "status": "success",
            "prediction": result
        })
    #___________________________________________________________________________________
  
    @bp.route('/predict_eeg', methods=['GET'])
    def predict_eeg():
        nonlocal loader
        if loader is None:
            return jsonify({
                "status": "error",
                 "message": "No file uploaded yet"
            }), 400
        result = predict_eeg_csv(loader.df)  # استدعاء الدالة الخارجية

        return jsonify({
            "status": "success",
            "prediction": result
        })

    return bp