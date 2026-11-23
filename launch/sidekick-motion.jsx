import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export default function SidekickMotion({ item }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { accent, background, scenes: sceneJson, font } = item.props;
  const scenes = JSON.parse(sceneJson);
  const time = frame / fps;
  const found = scenes.findIndex(scene => time < scene.end);
  const index = found < 0 ? scenes.length - 1 : found;
  const scene = scenes[index];
  const local = time - (scenes[index - 1]?.end ?? 0);
  const reveal = delay => interpolate(local, [delay, delay + 0.28], [0, 1], clamp);
  const lift = delay => ({ opacity: reveal(delay), transform: `translateY(${(1 - reveal(delay)) * 20}px)` });
  const progress = interpolate(time, [0, scenes.at(-1).end], [0, 1], clamp);
  const vertical = height > width;
  const panel = {
    position: 'absolute', left: vertical ? 82 : 112, top: vertical ? 680 : 254,
    width: vertical ? 800 : 650,
  };
  const rows = {
    position: 'absolute', left: vertical ? 84 : 970, top: vertical ? 730 : 270,
    width: vertical ? 800 : 806, display: 'flex', flexDirection: 'column', gap: 22,
  };
  const title = { ...panel, top: vertical ? 332 : 305, alignItems: 'flex-start' };
  return (
    <AbsoluteFill style={{ backgroundColor: background, color: '#f2f8fc', fontFamily: font, overflow: 'hidden' }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="sidekick-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="#183040" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#sidekick-grid)" />
        <path d={`M0 ${height * 0.81}H${width} M${width * 0.90} 0V${height}`} stroke="#214352" strokeWidth="2" fill="none" />
      </svg>
      <div style={{ position: 'absolute', top: vertical ? 170 : 105, left: vertical ? 84 : 112, letterSpacing: 6, fontSize: 28, fontWeight: 700, color: accent }}>
        SIDEKICK <span style={{ color: '#a9c2cf' }}>/ DESIGN NOTES</span>
      </div>
      <div style={{ position: 'absolute', top: vertical ? 226 : 170, left: vertical ? 84 : 112, width: width - (vertical ? 224 : 224), height: 4, backgroundColor: '#253e4d' }}>
        <div style={{ width: `${progress * 100}%`, height: 4, backgroundColor: accent }} />
      </div>
      <div style={{ ...title, ...lift(0), display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ color: accent, fontWeight: 700, fontSize: 29, letterSpacing: 4 }}>{scene.chapter}</div>
        <div style={{ whiteSpace: 'pre-line', fontSize: vertical ? 86 : 74, lineHeight: 1.17, fontWeight: 750 }}>{scene.title}</div>
      </div>
      <div style={rows}>
        {scene.notes.map((note, row) => {
          const active = row === scene.active;
          return (
            <div key={row} style={{ ...lift(0.12 + row * 0.22), height: 110, border: `2px solid ${active ? accent : '#315063'}`, backgroundColor: active ? '#123e43' : '#102636', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 25, padding: '0 27px', fontSize: 39, fontWeight: active ? 700 : 500 }}>
              <div style={{ minWidth: 64, color: active ? accent : '#9db9c8', fontSize: 29 }}>{`0${row + 1}`}</div>
              <span>{note}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: vertical ? 84 : 112, width: vertical ? 800 : 1430, top: vertical ? 1295 : 780, color: '#d4e6ef', fontSize: vertical ? 40 : 44, lineHeight: 1.45, fontWeight: 600 }}>
        {scene.caption}
      </div>
      <div style={{ position: 'absolute', top: vertical ? 1500 : 930, left: vertical ? 84 : 112, color: '#9db9c8', fontSize: 25, letterSpacing: 3 }}>
        {String(index + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')} <span style={{ color: accent }}>—</span> ARCHITECTURE DEMO
      </div>
    </AbsoluteFill>
  );
}
