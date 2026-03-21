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
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./components/ui/button";

// ----------------------------------------
// Types
// ----------------------------------------
interface Track {
  title: string;
  artist: string;
  src: string;
  cover: string;
}

interface Collection {
  name: string;
  cover: string;
  tracks: Track[];
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(
    null,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [mode, setMode] = useState<"normal" | "shuffle" | "loop" | "loopOne">(
    "normal",
  );

  // fetch metadata
  useEffect(() => {
    fetch("/metadata.json")
      .then((res) => res.json())
      .then(setCollections);
  }, []);

  const currentTrack = activeCollection?.tracks[currentIndex] || null;

  // ----------------------------------------
  // Player logic
  // ----------------------------------------
  function playCollection(col: Collection) {
    setActiveCollection(col);
    setCurrentIndex(0);
    setIsPlaying(true);
  }

  function togglePlay() {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  }

  function next() {
    if (!activeCollection) return;

    let nextIndex = currentIndex;

    if (mode === "shuffle") {
      nextIndex = Math.floor(Math.random() * activeCollection.tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % activeCollection.tracks.length;
    }

    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }

  function prev() {
    if (!activeCollection) return;

    const prevIndex =
      (currentIndex - 1 + activeCollection.tracks.length) %
      activeCollection.tracks.length;

    setCurrentIndex(prevIndex);
    setIsPlaying(true);
  }

  function cycleMode() {
    const modes = ["normal", "shuffle", "loop", "loopOne"];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex] as any);
  }

  // ----------------------------------------
  // Sync audio
  // ----------------------------------------
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.src = currentTrack.src;
    audioRef.current.play();
  }, [currentIndex, activeCollection]);

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
  }, [mode, currentIndex, activeCollection]);

  function formatTime(time: number) {
    if (!time) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="h-screen w-screen text-white overflow-hidden relative">
      {/* background */}
      {currentTrack && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-40"
          style={{ backgroundImage: `url(${currentTrack.cover})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

      {/* COLLECTIONS */}
      {!activeCollection && (
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
      {activeCollection && (
        <div className="relative flex flex-col h-full justify-between">
          {/* top collections */}
          <div className="flex gap-3 p-4 flex-wrap">
            {collections.map((col, i) => (
              <Button
                variant="outline"
                key={i}
                onClick={() => playCollection(col)}
                className="px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur"
              >
                {col.name}
              </Button>
            ))}
          </div>

          {/* center */}
          <motion.div
            key={currentTrack?.src}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            {currentTrack ? (
              <img
                src={currentTrack.cover}
                className="w-64 md:w-lg rounded-2xl shadow-2xl"
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
                {/* list */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button>
                      <List />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    side="top"
                    className="w-80 p-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl"
                  >
                    <ScrollArea className="h-72 pr-2">
                      {activeCollection.tracks.map((t, i) => (
                        <div
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/10 ${
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
                  <button
                    className="hover:border-2 rounded-full p-1"
                    onClick={prev}
                  >
                    <SkipBack />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="bg-white text-black p-3 hover:bg-gray-300 rounded-full"
                  >
                    {isPlaying ? <Pause /> : <Play />}
                  </button>

                  <button
                    className="hover:border-2 rounded-full p-1"
                    onClick={next}
                  >
                    <SkipForward />
                  </button>
                </div>

                {/* mode */}
                <button onClick={cycleMode}>
                  {mode === "shuffle" && <Shuffle />}
                  {mode === "loop" && <Repeat />}
                  {mode === "loopOne" && <Repeat className="text-green-400" />}
                  {mode === "normal" && <Repeat className="opacity-40" />}
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
