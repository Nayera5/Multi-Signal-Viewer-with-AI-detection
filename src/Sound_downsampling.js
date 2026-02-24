
// Decode the uploaded file to get its original sample rate
export async function decodeAudioFile(file) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer.sampleRate; // return original sample rate
}


export async function processAudioToWav(file, targetRate = 48000) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Step 1: Decode file → AudioBuffer
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Step 2: Downsample
  const oldRate = audioBuffer.sampleRate;
  if (targetRate > oldRate) {
    console.warn('Upsampling not supported — returning original rate.');
    targetRate = oldRate;
  }

  const ratio = oldRate / targetRate;
  const newLength = Math.floor(audioBuffer.length / ratio);
  const numChannels = audioBuffer.numberOfChannels;
  const newBuffer = audioContext.createBuffer(numChannels, newLength, targetRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const oldData = audioBuffer.getChannelData(ch);
    const newData = newBuffer.getChannelData(ch);
    for (let i = 0; i < newLength; i++) {
      newData[i] = oldData[Math.floor(i * ratio)] || 0;
    }
  }

  // Step 3: Convert to WAV Blob
  const length = newBuffer.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let pos = 0;

  const setString = (s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
    pos += s.length;
  };

  // WAV header
  setString('RIFF');
  view.setUint32(pos, length - 8, true); pos += 4;
  setString('WAVEfmt '); 
  view.setUint32(pos, 16, true); pos += 4;
  view.setUint16(pos, 1, true); pos += 2;
  view.setUint16(pos, numChannels, true); pos += 2;
  view.setUint32(pos, targetRate, true); pos += 4;
  view.setUint32(pos, targetRate * numChannels * 2, true); pos += 4;
  view.setUint16(pos, numChannels * 2, true); pos += 2;
  view.setUint16(pos, 16, true); pos += 2;
  setString('data');
  view.setUint32(pos, length - pos - 4, true); pos += 4;

  for (let i = 0; i < newBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = newBuffer.getChannelData(ch)[i];
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(pos, s * 0x7fff, true);
      pos += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}


