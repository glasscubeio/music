import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  List,
  Repeat,
  Shuffle,
  Music,
  Volume2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { formatTime, type Collection } from "./lib/utils";

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [active, setActive] = useState<Collection | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [mode, setMode] = useState<"normal" | "shuffle" | "loop" | "loopOne">(
    "normal",
  );
  const currentTrack = active?.tracks[currentIndex] || null;

  useEffect(() => {
    fetch("/metadata.json")
      .then((res) => res.json())
      .then(setCollections);
  }, []);

  // Player logic
  function playCollection(col: Collection) {
    setActive(col);
    setCurrentIndex(0);
    setIsPlaying(true);
  }

  function togglePlay() {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (isPlaying) {
      // FADE OUT
      let v = audio.volume;

      const fade = setInterval(() => {
        v -= 0.05;

        if (v <= 0.05) {
          audio.volume = 0;
          clearInterval(fade);
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.volume = v;
        }
      }, 50);
    } else {
      // FADE IN (THIS WAS MISSING)
      audio.play();

      let v = audio.volume || 0;

      const fade = setInterval(() => {
        v += 0.05;

        if (v >= volume) {
          audio.volume = volume;
          clearInterval(fade);
        } else {
          audio.volume = v;
        }
      }, 50);

      setIsPlaying(true);
    }
  }

  function next() {
    if (!active) return;

    let nextIndex = currentIndex;

    if (mode === "shuffle") {
      nextIndex = Math.floor(Math.random() * active.tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % active.tracks.length;
    }

    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }

  function prev() {
    if (!active) return;

    const prevIndex =
      (currentIndex - 1 + active.tracks.length) % active.tracks.length;

    setCurrentIndex(prevIndex);
    setIsPlaying(true);
  }

  function cycleMode() {
    const modes = ["normal", "shuffle", "loop", "loopOne"];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex] as "normal" | "shuffle" | "loop" | "loopOne");
  }

  // Sync audio + FADE IN
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    audio.src = currentTrack.src;
    audio.volume = 0;

    audio.play();

    let v = 0;

    const fade = setInterval(() => {
      v += 0.02;

      if (v >= volume) {
        audio.volume = volume;
        clearInterval(fade);
      } else {
        audio.volume = v;
      }
    }, 50);

    return () => clearInterval(fade);
  }, [currentIndex, active, currentTrack, volume]);

  // duration + progress
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const loaded = () => setDuration(audio.duration);
    const timeUpdate = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("timeupdate", timeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("timeupdate", timeUpdate);
    };
  }, []);

  // loop handling
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleEnd = () => {
      if (mode === "loopOne") {
        audio.currentTime = 0;
        audio.play();
      } else {
        next();
      }
    };

    audio.addEventListener("ended", handleEnd);
    return () => audio.removeEventListener("ended", handleEnd);
  }, [mode, currentIndex, active]);

  // volume control
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume]);

  // ⌨️ KEYBOARD CONTROLS
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!active) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case ",":
          prev();
          break;
        case ".":
          next();
          break;
        case "l":
          cycleMode();
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, isPlaying, currentIndex, mode]);

  return (
    <div className="h-screen w-screen text-white overflow-hidden relative">
      {/* background */}
      {currentTrack && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-60"
          style={{ backgroundImage: `url(${currentTrack.cover})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

      {/* COLLECTIONS */}
      {!active && (
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 px-6 h-full">
          {collections.map((col, i) => (
            <div
              key={i}
              onClick={() => playCollection(col)}
              className="w-full max-w-xs cursor-pointer backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6 hover:scale-105 transition"
            >
              <img
                src={col.cover}
                className="w-full h-48 md:h-52 object-cover rounded-xl mb-4"
              />
              <h2 className="text-center">{col.name}</h2>
            </div>
          ))}
        </div>
      )}

      {/* PLAYER */}
      {active && (
        <div className="relative flex flex-col h-full justify-between">
          {/* TOP BAR */}
          <div className="flex justify-between items-center p-4">
            <div className="flex gap-3 flex-wrap">
              {collections.map((col, i) => (
                <Button
                  key={i}
                  onClick={() => playCollection(col)}
                  className="bg-white/10 border border-white/20"
                >
                  {col.name}
                </Button>
              ))}
            </div>

            {/* 🔊 volume (vertical hover) */}
            <div className="relative group flex items-center">
              <div className="p-2 rounded-full bg-white/10 border border-white/20 cursor-pointer">
                <Volume2 />
              </div>

              <div className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition">
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      if (audioRef.current) {
                        audioRef.current.volume = v;
                      }
                    }}
                    className="h-24 w-2 accent-white"
                    style={{ writingMode: "vertical-lr" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER */}
          <motion.div
            key={currentTrack?.src}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6 px-4"
          >
            {currentTrack ? (
              <img
                src={currentTrack.cover}
                className="
              w-full
              max-w-[320px]
              md:max-w-105
              lg:max-w-120
              aspect-square
              object-cover
              rounded-2xl
              shadow-2xl
            "
              />
            ) : (
              <Music size={80} />
            )}

            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold">
                {currentTrack?.title}
              </h2>
              <p className="text-gray-300">{currentTrack?.artist}</p>
            </div>
          </motion.div>

          {/* CONTROL BAR */}
          <div className="p-4 flex justify-center">
            <div className="w-full max-w-xl flex flex-col gap-3 bg-white/10 backdrop-blur-3xl border border-white/20 shadow-xl rounded-2xl px-4 py-4">
              {/* progress */}
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>{formatTime(currentTime)}</span>

                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (!audioRef.current) return;
                    audioRef.current.currentTime = Number(e.target.value);
                  }}
                  className="flex-1 accent-white"
                />

                <span>{formatTime(duration)}</span>
              </div>

              {/* controls */}
              <div className="flex items-center justify-between">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="hover:border rounded-lg p-1">
                      <List />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-80 p-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl">
                    <ScrollArea className="h-72">
                      {active.tracks.map((t, i) => (
                        <div
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={`flex items-center mb-1 gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/10 ${
                            i === currentIndex ? "bg-white/10" : ""
                          }`}
                        >
                          <img
                            src={t.cover}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                          <div>
                            <div className="text-sm">{t.title}</div>
                            <div className="text-xs text-gray-400">
                              {t.artist}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-4">
                  <button onClick={prev}>
                    <SkipBack />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="bg-white text-black p-3 rounded-full"
                  >
                    {isPlaying ? <Pause /> : <Play />}
                  </button>

                  <button onClick={next}>
                    <SkipForward />
                  </button>
                </div>

                <button onClick={cycleMode}>
                  {mode === "shuffle" && <Shuffle />}
                  {mode === "loop" && <Repeat className="text-green-400" />}
                  {mode === "loopOne" && (
                    <div className="flex">
                      <Repeat className="text-green-400" />1
                    </div>
                  )}
                  {mode === "normal" && <Repeat />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
}
