# 🎧 Minimal Music Player (React + Bun)

A clean, modern music player with smooth transitions, keyboard controls, and a premium UX feel.

Built with:

- React
- Bun
- TailwindCSS
- Framer Motion
- shadcn/ui

---

## ✨ Features

### 🎵 Core Player

- Play / Pause / Next / Previous
- Multiple collections (fetched from `/public/metadata.json`)
- Shuffle / Loop / Loop One modes

---

### 🎚️ Smooth Audio Experience

- **Fade-in on track change**
- **Fade-out on pause**
- Prevents harsh audio cuts → gives premium feel

---

### ⌨️ Keyboard Controls

| Key     | Action         |
| ------- | -------------- |
| `Space` | Play / Pause   |
| `,`     | Previous track |
| `.`     | Next track     |
| `L`     | Change mode    |

---

### 🔊 Volume Control

- Vertical hover slider (top-right)
- Real-time volume updates
- Does NOT restart track (fixed behavior)

---

### 🎨 UI/UX

- Blurred dynamic background from track cover
- Responsive layout (desktop + mobile)
- Square normalized album art (no layout breaking)
- Smooth transitions using Framer Motion

---

## 📁 Project Structure

```
project-root/
│
├── public/
│   ├── metadata.json      # collections + tracks
│   ├── cover/             # album covers
│   └── track/             # audio files
│
├── src/
│   ├── components/
│   │   └── ui/            # shadcn components
│   │
│   ├── lib/
│   │   └── utils.ts       # helpers (formatTime, types)
│   │
│   ├── App.tsx            # main player logic (everything here)
│   └── main.tsx
│
└── README.md
```

---

## 📦 metadata.json format

```json
[
  {
    "name": "Collection Name",
    "cover": "/cover/example.jpg",
    "tracks": [
      {
        "title": "Track Name",
        "artist": "Artist",
        "src": "/track/file.mp3",
        "cover": "/cover/track.jpg"
      }
    ]
  }
]
```

---

## 🧠 How It Works (Code Overview)

### 1. Audio Engine (`audioRef`)

- Central `<audio>` element controlled via `useRef`
- All playback logic interacts directly with it

---

### 2. Track Switching + Fade-In

```ts
useEffect(() => {
  audio.src = currentTrack.src;
  audio.volume = 0;
  audio.play();
  // gradual volume increase
}, [currentIndex, active]);
```

👉 Runs only when track changes
👉 Prevents restart issues by NOT depending on `volume`

---

### 3. Fade-Out on Pause

```ts
togglePlay();
```

- Gradually reduces volume
- Pauses only after volume reaches ~0

---

### 4. Volume Control (Independent)

```ts
useEffect(() => {
  audioRef.current.volume = volume;
}, [volume]);
```

👉 Decoupled from playback logic
👉 Fixes restart bug

---

### 5. Keyboard Controls

```ts
window.addEventListener("keydown", ...)
```

- Global listener
- Only active when a collection is selected

---

### 6. UI Layout

- **Top bar** → collections + volume
- **Center** → album + metadata
- **Bottom** → controls + progress

Everything is locked to `h-screen` → no scrolling.

---

## 🖼️ Adding Screenshots

### Step 1: Create folder

```
/public/screenshots/
```

---

### Step 2: Add images

Example:

```
/public/screenshots/player.png
/public/screenshots/collections.png
```

---

### Step 3: Use in README

```md
## 📸 Screenshots

### Player View

![Player](public/screenshots/mobile.png)

### Collections View

![Collections](public/screenshots/desk.png)
```

---

## ⚠️ Important Notes

- Do NOT include `volume` in track-change effect deps → will restart audio
- Always clean intervals in fade logic
- Audio state must stay single source of truth (`audioRef`)

---

## 🚀 Run Locally

```bash
bun install
bun run dev
```

---

## 💡 Future Improvements

- Crossfade between tracks 🔥
- Persist last played track
- Media Session API (lock screen controls)
- Playlist editing UI

---

## 🧠 Philosophy

This project focuses on:

- minimal UI
- smooth UX
- no unnecessary abstractions

Everything is kept inside `App.tsx` intentionally for clarity and control.

---

## 🧾 License

MIT
