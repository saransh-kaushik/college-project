# Implementing Azure Voice Live Realtime

Implementing Azure Voice Live Realtime is **not** just a simple REST API call. It requires maintaining a persistent WebSocket connection, managing raw audio streams (converting microphone audio to Base64 in real-time), and manually reconstructing incoming base64 chunks into playable audio via the Web Audio API.

Here is the step-by-step blueprint on how the connection and configuration work so you can implement it in any other project.

---

## 1. The Endpoint Connection (WebSocket)

The user pastes a standard HTTPS endpoint (e.g., `https://my-resource.cognitiveservices.azure.com/`), but you do not hit this with [fetch](file:///home/saransh/Desktop/EnglishYaariAI/react_frontend/src/components/ConversationExercise.tsx#128-140) or `axios`. 

You must **transform** this endpoint into a secure WebSocket (`wss://`) URL and append specific query parameters:

```javascript
const connectWebSocket = () => {
  // 1. Transform https:// to wss:// and remove trailing slashes
  const baseEndpoint = azureEndpoint.replace('https://', 'wss://').replace(/\/$/, '');
  
  // 2. Append the exact Voice Live realtime path
  const apiVersion = '2025-05-01-preview'; // Specific to Azure Realtime
  const wsUrl = `${baseEndpoint}/voice-live/realtime?api-version=${apiVersion}&model=${model}&api-key=${azureApiKey}`;

  // 3. Connect!
  const ws = new WebSocket(wsUrl);
  return ws;
}
```

## 2. Session Configuration (`session.update`)

As soon as the WebSocket opens (`ws.onopen`), you cannot just start speaking. You must first configure the AI session by sending a `session.update` payload. This tells Azure how to listen, what voice to use, and how to behave.

```javascript
ws.onopen = () => {
  const sessionUpdate = {
    type: 'session.update', // Required event type
    session: {
      instructions: "You are a helpful assistant. Keep your answers brief.", // System Prompt
      modalities: ['audio', 'text'], // We want both audio and text back
      
      // Voice Activity Detection (VAD) - Crucial for natural conversations!
      turn_detection: {
        type: 'azure_semantic_vad',
        threshold: 0.4,
        prefix_padding_ms: 300,
        silence_duration_ms: 800, // Wait 800ms of silence before assuming user is done
        remove_filler_words: false
      },
      
      // Azure specific audio enhancements
      input_audio_noise_reduction: {
        type: 'azure_deep_noise_suppression'
      },
      input_audio_echo_cancellation: {
        type: 'server_echo_cancellation' 
      },
      
      // Setup the AI's Voice
      voice: {
        name: 'en-US-JennyMultilingualNeural', // E.g., Jenny, Ava, Andrew
        type: 'azure-standard'
      },
      
      // Ask Azure to transcribe the USER's voice so you can show it on screen
      input_audio_transcription: {
        enabled: true,
        model: 'gpt-4o-mini-transcribe', // Internal transcription model
        format: 'text'
      }
    },
    event_id: ''
  };

  ws.send(JSON.stringify(sessionUpdate));
};
```

*(Optional: right after `session.update`, you can send a `response.create` event to tell the AI to speak first without waiting for the user).*

## 3. Handling User Microphone Input (Streaming OUT)

You cannot send standard MP3 or WAV files over the socket. Azure expects raw PCM audio data, chunked, and Base64 encoded.

1.  **Get Microphone Access:** `navigator.mediaDevices.getUserMedia({ audio: true })`
2.  **Audio Context (24kHz):** Create an `AudioContext` with a sample rate of 24000Hz (Azure's standard).
3.  **Audio Worklet (The Processor):** You **must** use an `AudioWorkletNode`. A separate script (e.g., `audio-processor.js`) runs on a background thread. It grabs small chunks of microphone data (e.g., 128 frames), converts the floating-point audio to 16-bit PCM (integers format), and sends it to your main thread.
4.  **Send via WebSocket:**
    ```javascript
    // In your main thread, receiving chunks from the AudioWorklet:
    workletNode.port.onmessage = (event) => {
      const audioData = event.data; // ArrayBuffer of PCM data
      const base64Audio = arrayBufferToBase64(audioData);
      
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
        event_id: ''
      }));
    };
    ```

## 4. Handling AI Response (Streaming IN)

Azure will send back multiple types of events as JSON strings. You must parse these in `ws.onmessage`:

*   **`input_audio_buffer.speech_started`**: VAD detected the user speaking. (You can use this to interrupt the AI if it is currently speaking).
*   **`conversation.item.input_audio_transcription.completed`**: Azure gives you the text of what the *user* just said.
*   **`response.audio_transcript.delta`**: The AI's response text, streaming chunk by chunk (useful for a typing effect).
*   **`response.audio.delta`**: This is the actual Base64 audio of the AI's voice.

### How to play back the AI's audio (`response.audio.delta`):

1.  Buffer the incoming `response.audio.delta` base64 strings (collect 3-5 chunks at a time for smooth playback).
2.  Convert the Base64 chunks back into an `Int16Array`.
3.  Convert the Int16 integers back to browser standard floating point (`-1` to `1` range).
4.  Create a fresh [AudioBuffer](file:///home/saransh/Desktop/EnglishYaariAI/react_frontend/src/components/ConversationExercise.tsx#497-513) and schedule it in the `AudioContext`.

```javascript
// Extremely simplified playback loop:
const playAudioChunks = (base64Chunks) => {
  // Combine all base64 chunks, decode to raw bytes
  // ... Convert those bytes to an Int16Array named 'pcmData'
  
  const frameCount = pcmData.length;
  // Create buffer (1 channel, frameCount length, 24000 sample rate)
  const audioBuffer = audioContext.createBuffer(1, frameCount, 24000);
  const outputData = audioBuffer.getChannelData(0);
  
  // Convert 16-bit integer PCM to Float32 [-1.0, 1.0]
  for (let i = 0; i < frameCount; i++) {
    outputData[i] = pcmData[i] / 32768.0; 
  }
  
  // Play the buffer
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  
  // Ensure sequential playback by keeping track of 'nextPlayTime'
  source.start(nextPlayTime);
  nextPlayTime = nextPlayTime + audioBuffer.duration;
}
```

## Summary Checklist for your new project:
1. [ ] WebSocket logic for the `wss://` URI and API version.
2. [ ] Robust `session.update` payload to set VAD, Prompt, and Voice.
3. [ ] An `AudioWorkletNode` (`audio-processor.js` file) to convert mic input to base64 `input_audio_buffer.append`.
4. [ ] A playback buffer management system to decode `response.audio.delta` base64 back into `AudioContext` buffers.
5. [ ] Event Switch statement ([onmessage](file:///home/saransh/Desktop/EnglishYaariAI/react_frontend/src/components/ConversationExercise.tsx#324-327)) to track VAD interruptions and text transcriptions.
