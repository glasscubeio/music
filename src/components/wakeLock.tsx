import { useEffect, useRef } from "react";

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    async function enableWakeLock() {
      try {
        if (!("wakeLock" in navigator)) return;
        if (wakeLockRef.current && !wakeLockRef.current.released) return;

        const sentinel = await navigator.wakeLock.request("screen");
        wakeLockRef.current = sentinel;

        sentinel.addEventListener("release", () => {
          console.log("Wake Lock released");
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null;
          }
        });
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }

    enableWakeLock();

    const handleVisibility = async () => {
      if (
        document.visibilityState === "visible" &&
        (!wakeLockRef.current || wakeLockRef.current.released)
      ) {
        await enableWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);
}
