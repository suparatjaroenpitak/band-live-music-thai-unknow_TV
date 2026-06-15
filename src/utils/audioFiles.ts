function audioBufferToWav(audioBuffer: AudioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

async function decodeBlob(blob: Blob) {
  const context = new AudioContext();
  const buffer = await context.decodeAudioData(await blob.arrayBuffer());
  await context.close();
  return buffer;
}

export async function recordingToWavBlob(blob: Blob) {
  const audioBuffer = await decodeBlob(blob);
  return new Blob([audioBufferToWav(audioBuffer)], { type: "audio/wav" });
}

export async function recordingToMp3Blob(blob: Blob) {
  const audioBuffer = await decodeBlob(blob);
  const lame = await import("lamejs");
  const Mp3Encoder = lame.Mp3Encoder;
  const channels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, 128);
  const sampleBlockSize = 1152;
  const mp3Data: BlobPart[] = [];
  const left = convertFloatToInt16(audioBuffer.getChannelData(0));
  const right = channels > 1 ? convertFloatToInt16(audioBuffer.getChannelData(1)) : left;

  for (let i = 0; i < left.length; i += sampleBlockSize) {
    const leftChunk = left.subarray(i, i + sampleBlockSize);
    const rightChunk = right.subarray(i, i + sampleBlockSize);
    const encoded = channels > 1 ? encoder.encodeBuffer(leftChunk, rightChunk) : encoder.encodeBuffer(leftChunk);
    if (encoded.length > 0) mp3Data.push(toArrayBuffer(encoded));
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) mp3Data.push(toArrayBuffer(flushed));

  return new Blob(mp3Data, { type: "audio/mpeg" });
}

function toArrayBuffer(data: Uint8Array | Int8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength);
  copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  return copy.buffer;
}

function convertFloatToInt16(data: Float32Array) {
  const output = new Int16Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}
