import os
import io
import torchaudio
from voicefixer import VoiceFixer

vf = VoiceFixer()  

# def restore_single_file(input_file, output_file, mode=0, use_cuda=False):
  
#     print("🚀 Initializing VoiceFixer...")    
#     print(f"🎵 Processing: {input_file}")
#     print(f"   Mode: {mode}")
#     print(f"   CUDA: {use_cuda}")
    
#     vf.restore(
#         input=input_file,
#         output=output_file,
#         cuda=use_cuda,
#         mode=mode
#     )
    
#     print(f"✅ Saved restored audio: {output_file}")



# def restore_with_custom_vocoder(input_file, output_file):
   

#     vf.restore(
#         input=input_file,
#         output=output_file,
#         cuda=False,
#         mode=0,
#     )


def restore_and_stream(input_file, mode=0, use_cuda=False):
    
    restored_path = "temp_restored.wav"
    vf.restore(input=input_file, output=restored_path, cuda=use_cuda, mode=mode)
    waveform, sr = torchaudio.load(restored_path)
    
    buffer = io.BytesIO()
    torchaudio.save(buffer, waveform, sr, format="wav")
    buffer.seek(0)

    os.remove(restored_path)
    return buffer