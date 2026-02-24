import os
import io
import torchaudio
from voicefixer import VoiceFixer

vf = VoiceFixer()  



def restore_and_stream(input_file, mode=0, use_cuda=False):
    
    restored_path = "temp_restored.wav"
    vf.restore(input=input_file, output=restored_path, cuda=use_cuda, mode=mode)
    waveform, sr = torchaudio.load(restored_path)
    
    buffer = io.BytesIO()
    torchaudio.save(buffer, waveform, sr, format="wav")
    buffer.seek(0)

    os.remove(restored_path)
    return buffer, sr