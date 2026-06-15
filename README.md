# Smart Music Studio

Smart Music Studio is a realtime smart-instrument web app inspired by GarageBand Smart Instruments. It ships with chord pads, realtime instrument switching, mixer/effects controls, recording tools, offline PWA support, and Docker/Nginx deployment.

## Features

- 20 default chord pads with editable, sortable, importable, and exportable chord sets
- Mouse, touch, and multi-touch pad playback with chord, arpeggio, fingerstyle, strum down, strum up, and auto pattern modes
- Realtime instrument library with search, favorites, and recent instruments
- Tone.js audio engine with synths, transport, sequence playback, effects chain, compressor, limiter, and recorder routing
- Mixer controls for master volume, instrument volume, reverb, delay, chorus, EQ, compressor, and limiter
- Performance recorder with play, pause, stop, delete, WAV, MP3, and MIDI export
- LocalStorage persistence, 10-second autosave, project JSON import/export
- PWA manifest, service worker caching, offline fallback, and background sync hook
- Production Docker image served by Nginx

## Local Development

```bash
npm install
npm run dev
```

Open the printed Vite URL, usually `http://localhost:5173`.

## Production Build

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t smart-music-studio .
docker run -p 80:80 smart-music-studio
```

Docker Compose:

```bash
docker compose up -d
```

## Project JSON

Use the export/import buttons in the app to move projects between browsers. Imported chord names and project fields are sanitized and validated before they reach the store.

## Notes

The browser must unlock Web Audio from a user gesture, so the first pad press starts the audio context and then immediately plays the requested chord. MP3 export uses browser decoding plus `lamejs`; if a browser cannot decode the captured recording format, WAV export remains available.
