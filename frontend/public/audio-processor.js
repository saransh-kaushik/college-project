// A simple AudioWorkletProcessor to stream raw PCM16 audio chunks to the main thread.
// Uses transferable ArrayBuffer (zero-copy) so the buffer ownership moves to the
// main thread instead of being cloned — critical for real-time audio performance.
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];

      // Convert Float32 [-1.0, 1.0] → Int16 [-32768, 32767] (PCM16)
      const int16Buffer = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Transfer the underlying ArrayBuffer (zero-copy) to the main thread.
      // After this point int16Buffer.buffer is detached and must not be used here.
      this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
