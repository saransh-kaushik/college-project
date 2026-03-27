export default function VoiceOrb({ state }) {
  // state can be 'idle', 'listening', 'speaking'

  return (
    <div className={`voice-orb-container ${state}`}>
      <div className="orb-glow"></div>
      <div className="orb-core">
        <div className={`orb-wave ${state}`}></div>
      </div>
    </div>
  );
}
