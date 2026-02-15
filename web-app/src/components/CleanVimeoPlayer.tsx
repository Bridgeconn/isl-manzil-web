import { useEffect, useRef, useState, useCallback } from "react";
import Player from "@vimeo/player";
import { Play, Pause, RefreshCw, Maximize, Minimize } from "lucide-react";
import useDeviceDetection from "../hooks/useDeviceDetection";

interface CleanVimeoPlayerProps {
  videoId: number;
}

const CleanVimeoPlayer: React.FC<CleanVimeoPlayerProps> = ({ videoId }) => {
  const cleanVimeoPlayerRef = useRef<HTMLDivElement | null>(null);
  const cleanVimeoInstanceRef = useRef<Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [cleanVimeoIsPlaying, setCleanVimeoIsPlaying] = useState(false);
  const [cleanVimeoIsEnded, setCleanVimeoIsEnded] = useState(false);
  const [cleanVimeoCurrentTime, setCleanVimeoCurrentTime] = useState(0);
  const [cleanVimeoDuration, setCleanVimeoDuration] = useState(0);
  const [cleanVimeoIsFullscreen, setCleanVimeoIsFullscreen] = useState(false);
  const [cleanVimeoShowBezel, setCleanVimeoShowBezel] = useState(false);
  const [cleanVimeoIsReplaying, setCleanVimeoIsReplaying] = useState(false);

  const { deviceType } = useDeviceDetection();

  // Handle viewport meta for mobile fullscreen
  useEffect(() => {
    if (cleanVimeoIsFullscreen && deviceType === "mobile") {
      let viewport = document.querySelector(
        'meta[name="viewport"]'
      ) as HTMLMetaElement;
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        document.head.appendChild(viewport);
      }
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      );

      return () => {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, viewport-fit=cover"
        );
      };
    }
  }, [cleanVimeoIsFullscreen, deviceType]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () =>
      setCleanVimeoIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleModalKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      switch (e.key) {
        case " ":
          togglePlay();
          e.preventDefault();
          break;
        case "f":
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, []);

  // Initialize Vimeo player
  useEffect(() => {
    if (!cleanVimeoPlayerRef.current) return;

    const player = new Player(cleanVimeoPlayerRef.current, {
      id: videoId,
      controls: false,
      responsive: true,
      title: false,
      byline: false,
      portrait: false,
      autopause: false,
      loop: false,
      muted: false,
      background: false,
    });

    cleanVimeoInstanceRef.current = player;

    const handlePlay = () => {
      setCleanVimeoIsPlaying(true);
      setCleanVimeoIsEnded(false);
      setCleanVimeoIsReplaying(false);
    };

    const handlePause = () => setCleanVimeoIsPlaying(false);
    const handleEnded = () => {
      setCleanVimeoIsPlaying(false);
      setCleanVimeoIsEnded(true);
      setCleanVimeoIsReplaying(false);
    };
    const handleTimeUpdate = (data: any) =>
      setCleanVimeoCurrentTime(data.seconds);

    player
      .ready()
      .then(() => {
        player.on("play", handlePlay);
        player.on("pause", handlePause);
        player.on("ended", handleEnded);
        player.on("timeupdate", handleTimeUpdate);
        return player.getDuration();
      })
      .then(setCleanVimeoDuration)
      .catch(console.error);

    return () => {
      if (cleanVimeoInstanceRef.current) {
        cleanVimeoInstanceRef.current.off("play", handlePlay);
        cleanVimeoInstanceRef.current.off("pause", handlePause);
        cleanVimeoInstanceRef.current.off("ended", handleEnded);
        cleanVimeoInstanceRef.current.off("timeupdate", handleTimeUpdate);
        cleanVimeoInstanceRef.current.destroy();
        cleanVimeoInstanceRef.current = null;
      }
    };
  }, [videoId]);

  const togglePlay = useCallback(async () => {
    if (!cleanVimeoInstanceRef.current) return;
    try {
      if (cleanVimeoIsPlaying) {
        await cleanVimeoInstanceRef.current.pause();
      } else {
        await cleanVimeoInstanceRef.current.play();
      }
      setCleanVimeoShowBezel(true);
      setTimeout(() => setCleanVimeoShowBezel(false), 1500);
    } catch (err) {
      console.error("Toggle play error:", err);
    }
  }, [cleanVimeoIsPlaying]);

  const replayVideo = useCallback(async () => {
    if (!cleanVimeoInstanceRef.current) return;
    try {
      setCleanVimeoIsReplaying(true);
      setCleanVimeoIsEnded(false);
      await cleanVimeoInstanceRef.current.setCurrentTime(0);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await cleanVimeoInstanceRef.current.play();
      setCleanVimeoCurrentTime(0);
      setCleanVimeoIsReplaying(false);
    } catch (err) {
      console.error("Replay error:", err);
      setCleanVimeoIsReplaying(false);
      setCleanVimeoIsEnded(true);
    }
  }, []);

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!cleanVimeoInstanceRef.current) return;
      const time = parseFloat(e.target.value);
      try {
        await cleanVimeoInstanceRef.current.setCurrentTime(time);
        setCleanVimeoCurrentTime(time);
      } catch (err) {
        console.error("Seek error:", err);
      }
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isFullscreenMode =
    cleanVimeoIsFullscreen &&
    (deviceType === "mobile" || deviceType === "tablet");

  return (
    <div className="w-full mx-auto my-auto">
      <div
        ref={containerRef}
        className={`relative w-full max-w-6xl mx-auto overflow-hidden rounded-3xl ${
          isFullscreenMode
            ? "h-screen flex flex-col justify-center bg-black"
            : "aspect-video bg-black"
        }`}
        style={{
          maxHeight: isFullscreenMode ? "100vh" : "80vh",
          touchAction: "manipulation",
        }}
      >
        <div
          className={`relative ${
            isFullscreenMode
              ? "mx-auto bg-black overflow-hidden"
              : "w-full h-full"
          }`}
          style={
            isFullscreenMode
              ? { aspectRatio: "16/9", maxHeight: "100vh", width: "100%" }
              : undefined
          }
        >
          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `}</style>

          <div
            ref={cleanVimeoPlayerRef}
            className="w-full h-full cursor-pointer"
            onClick={togglePlay}
          />

          {(cleanVimeoIsEnded || cleanVimeoIsReplaying) && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!cleanVimeoIsReplaying) replayVideo();
                }}
                disabled={cleanVimeoIsReplaying}
                className="bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-md disabled:opacity-70"
                style={{ pointerEvents: "auto" }}
              >
                <RefreshCw
                  size={24}
                  className={cleanVimeoIsReplaying ? "animate-spin" : ""}
                />
                <span>{cleanVimeoIsReplaying ? "Loading..." : "Replay"}</span>
              </button>
            </div>
          )}

          {cleanVimeoShowBezel && !cleanVimeoIsEnded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-6">
                {cleanVimeoIsPlaying ? (
                  <Pause className="text-white w-6 h-6 sm:w-12 sm:h-12" />
                ) : (
                  <Play className="text-white w-6 h-6 sm:w-12 sm:h-12 ml-1" />
                )}
              </div>
            </div>
          )}

          {!cleanVimeoIsEnded && !cleanVimeoIsReplaying && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-white/20 rounded transition-colors flex-shrink-0"
                >
                  {cleanVimeoIsPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                </button>

                <div className="flex-1 flex items-center mx-1">
                  <input
                    type="range"
                    min={0}
                    max={cleanVimeoDuration || 0}
                    step={0.1}
                    value={cleanVimeoCurrentTime}
                    onChange={handleSeek}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                        (cleanVimeoCurrentTime / (cleanVimeoDuration || 1)) *
                        100
                      }%, rgba(255,255,255,0.3) ${
                        (cleanVimeoCurrentTime / (cleanVimeoDuration || 1)) *
                        100
                      }%, rgba(255,255,255,0.3) 100%)`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono whitespace-nowrap">
                    {formatTime(cleanVimeoCurrentTime)} /{" "}
                    {formatTime(cleanVimeoDuration)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-white/20 rounded transition-colors mb-0.5"
                  >
                    {cleanVimeoIsFullscreen ? (
                      <Minimize size={18} />
                    ) : (
                      <Maximize size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanVimeoPlayer;
