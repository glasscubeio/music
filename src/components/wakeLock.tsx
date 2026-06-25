import { useEffect, useRef } from "react";

export function useWakeLock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    async function enableWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");

          wakeLockRef.current.addEventListener("release", () => {
            console.log("Wake Lock released");
          });
        }
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }

    enableWakeLock();

    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        await enableWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);
}
