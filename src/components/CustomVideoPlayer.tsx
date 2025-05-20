import { useState, useRef, useEffect } from "react";
import { Play, Pause, RefreshCw, Maximize, Minimize } from "lucide-react";
import { bibleVerses, VerseData } from "../assets/data/bibleVersesSample";
import { Options as VimeoPlayerOptions } from "@vimeo/player";
import Player from "@vimeo/player";
import useBibleStore from "@/store/useBibleStore";

const CustomVideoPlayer = () => {
  const { currentVideoId } = useBibleStore();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const updateIntervalRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const [showControls, setShowControls] = useState(true);
  const [showPlayBezel, setShowPlayBezel] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [lastAction, setLastAction] = useState<
    "play" | "pause" | "replay" | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize Vimeo player
  useEffect(() => {
    const loadVimeo = () => {
      if (window.Vimeo) {
        initializeVimeoPlayer();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      script.onload = initializeVimeoPlayer;
      document.body.appendChild(script);
    };

    if (playerRef.current) {
      loadVimeo();
    }

    return () => {
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }

      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.destroy();
        vimeoPlayerRef.current = null;
        setIsPlayerReady(false);
      }
    };
  }, []);

  // Handle video ID changes
  useEffect(() => {
    if (!currentVideoId || !playerRef.current) return;

    const loadNewVideo = async () => {
      try {
        // Clear previous player if it exists
        if (vimeoPlayerRef.current) {
          if (updateIntervalRef.current !== null) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }

          // Destroy old player
          await vimeoPlayerRef.current.destroy();
          vimeoPlayerRef.current = null;
        }

        // Reset states
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setIsEnded(false);
        setIsPlayerReady(false);

        // Create new player
        const options: VimeoPlayerOptions = {
          id: currentVideoId,
          controls: false,
          responsive: true,
          title: false,
          byline: false,
          portrait: false,
          autopause: false,
        };
        // Ensure the DOM element is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create player again
        vimeoPlayerRef.current = new Player(playerRef.current!, options);

        // Wait for player to be ready
        await new Promise((resolve) => {
          vimeoPlayerRef.current!.ready().then(() => {
            console.log("Player ready!");
            resolve(true);
          });
        });
        // Set up events after player is ready
        setupEventListeners();

        // Get and set video duration
        const newDuration = await vimeoPlayerRef.current.getDuration();
        setDuration(newDuration);

        setIsPlayerReady(true);

        // Set up interval for time updates
        updateIntervalRef.current = window.setInterval(() => {
          if (vimeoPlayerRef.current) {
            vimeoPlayerRef.current.getCurrentTime().then(setCurrentTime);
          }
        }, 500);
      } catch (error) {
        console.error("Error loading new video:", error);
      }
    };
    loadNewVideo();

    return () => {
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [currentVideoId]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!isPlayerReady) return;
      switch (event.key) {
        case " ":
          togglePlay();
          event.preventDefault();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft": {
          const currentTime =
            (await vimeoPlayerRef.current?.getCurrentTime()) || 0;
          const newTime = Math.max(0, currentTime - 10);
          await vimeoPlayerRef.current?.setCurrentTime(newTime);
          break;
        }
        case "ArrowRight": {
          const currentTime =
            (await vimeoPlayerRef.current?.getCurrentTime()) || 0;
          const newTime = Math.min(duration, currentTime + 10);
          await vimeoPlayerRef.current?.setCurrentTime(newTime);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, isPlayerReady, duration]);

  // Setup global mouse events for seek bar dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && seekBarRef.current) {
        handleSeekPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [duration]);

  // Set up event listeners for Vimeo player
  const setupEventListeners = () => {
    if (!vimeoPlayerRef.current) return;

    vimeoPlayerRef.current.off("play");
    vimeoPlayerRef.current.off("pause");
    vimeoPlayerRef.current.off("ended");

    const handlePlay = () => {
      setIsPlaying(true);
      setIsEnded(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const handleEnded = () => {
      console.log("Video ended event triggered");
      setIsPlaying(false);
      setShowControls(true);
      setIsEnded(true);
    };
    // Add listeners
    vimeoPlayerRef.current.on("play", handlePlay);
    vimeoPlayerRef.current.on("pause", handlePause);
    vimeoPlayerRef.current.on("ended", handleEnded);
  };
  // Initialize Vimeo player
  const initializeVimeoPlayer = () => {
    if (
      !playerRef.current ||
      vimeoPlayerRef.current ||
      !window.Vimeo ||
      !currentVideoId
    )
      return;
    try {
      const options: VimeoPlayerOptions = {
        id: currentVideoId,
        controls: false,
        responsive: true,
        title: false,
        byline: false,
        portrait: false,
        autopause: false,
      };

      vimeoPlayerRef.current = new Player(playerRef.current, options);

      // Get video metadata
      vimeoPlayerRef.current.ready().then(() => {
        vimeoPlayerRef.current?.getDuration().then(setDuration);
        setupEventListeners();
        setIsPlayerReady(true);
      });

      // Start interval to update current time
      updateIntervalRef.current = window.setInterval(() => {
        if (vimeoPlayerRef.current) {
          vimeoPlayerRef.current.getCurrentTime().then(setCurrentTime);
        }
      }, 500);
    } catch (error) {
      console.error("Error initializing Vimeo player:", error);
    }
  };

  const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;

    const parts = timeStr.split(":");

    // Handle hours:minutes:seconds format (hh:mm:ss or hh:mm:ss:ff)
    if (parts.length === 3 || parts.length == 4) {
      return (
        parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
      );
    }
    // Handle minutes:seconds format (mm:ss)
    else if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    // Handle seconds only
    else {
      return parseInt(parts[0]);
    }
  };

  const padTime = (time: number) => {
    return time.toString().padStart(2, "0");
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${padTime(hours)}:${padTime(mins)}:${padTime(secs)}`;
    } else {
      return `${padTime(mins)}:${padTime(secs)}`;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!vimeoPlayerRef.current || !isPlayerReady) return;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      vimeoPlayerRef.current.play();
      setIsEnded(false);
      setLastAction("play");
    } else {
      vimeoPlayerRef.current.pause();
      setLastAction("pause");
    }

    setIsPlaying(newIsPlaying);

    // Show play/pause bezel effect
    setShowPlayBezel(true);
    setTimeout(() => setShowPlayBezel(false), 800);
  };

  // Replay the video
  const replayVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!vimeoPlayerRef.current || !isPlayerReady) return;

    vimeoPlayerRef.current.setCurrentTime(0);
    vimeoPlayerRef.current.play();

    setCurrentTime(0);
    setIsPlaying(true);
    setIsEnded(false);
    setLastAction("replay");
    // Show replay bezel effect
    setShowPlayBezel(true);
    setTimeout(() => setShowPlayBezel(false), 800);
  };

  // Handle seeking in the video
  const handleSeekPosition = (clientX: number) => {
    if (!vimeoPlayerRef.current || !seekBarRef.current || !isPlayerReady)
      return;

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const seekPos = Math.max(0, Math.min(1, offsetX / rect.width));
    const seekTime = seekPos * duration;

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  // Handle click on seek bar
  const handleSeekClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    handleSeekPosition(event.clientX);
  };

  // For dragging
  const handleSeekMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    isDraggingRef.current = true;
  };

  // Handle verse marker click
  const handleVerseMarkerClick = (
    verse: VerseData,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (!vimeoPlayerRef.current || !isPlayerReady) return;

    const seekTime = timeToSeconds(verse.time);

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (isFullscreen) {
      if (document?.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Calculate progress as percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full sm:w-3/4 mx-auto bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() =>
        isPlaying && !isEnded && setTimeout(() => setShowControls(false), 2000)
      }
      onClick={togglePlay}
    >
      {!isPlayerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}

      {/* Vimeo Player Container */}
      <div className="w-full h-full">
        <div ref={playerRef} className="w-full h-full" />
      </div>

      {/* Play/Pause/Replay Bezel Effect */}
      {showPlayBezel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black bg-opacity-50 rounded-full p-6">
            {lastAction === "replay" || isEnded ? (
              <RefreshCw size={48} className="text-white" />
            ) : lastAction === "pause" ? (
              <Pause size={48} className="text-white" />
            ) : (
              <Play size={48} className="text-white" />
            )}
          </div>
        </div>
      )}
      {/* Video Ended Overlay */}
      {isEnded && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <button
            onClick={replayVideo}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full flex items-center space-x-2 transition-colors"
          >
            <RefreshCw size={24} />
            <span>Replay</span>
          </button>
        </div>
      )}
      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls || isEnded ? "opacity-100" : "opacity-0"
        } pointer-events-auto z-20`}
        style={{
          backgroundColor: "rgba(0,0,0,0)",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Bottom Controls */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seekbar with sections */}
          <div
            ref={seekBarRef}
            className="relative h-2 bg-gray-600 rounded-full mb-4 cursor-pointer"
            onClick={handleSeekClick}
          >
            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
            {/* Verse markers */}
            {bibleVerses.map((verse: VerseData) => {
              const verseTimeInSeconds = timeToSeconds(verse.time);
              const versePosition = (verseTimeInSeconds / duration) * 100;
              const isPassed = currentTime >= verseTimeInSeconds;
              return (
                <div
                  key={verse.id}
                  className={`absolute top-0 w-0.5 h-2 ${
                    isPassed ? "bg-yellow-400" : "bg-black"
                  }  cursor-pointer z-10 hover:w-1 transition-all duration-200`}
                  style={{
                    left: `${versePosition}%`,
                    transform: "translateX(-50%)",
                  }}
                  onClick={(e) => handleVerseMarkerClick(verse, e)}
                  title={`${verse.title} (${verse.time})`}
                ></div>
              );
            })}
            {/* Current Time Indicator */}
            <div
              className="absolute top-0 w-4 h-4 bg-white rounded-full cursor-grab z-20 -mt-1"
              style={{
                left: `${progressPercent}%`,
                transform: "translateX(-50%)",
              }}
              onMouseDown={handleSeekMouseDown}
            ></div>
          </div>
          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause/Replay Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEnded) {
                    replayVideo(e);
                  } else {
                    togglePlay();
                  }
                }}
                className="text-white hover:text-blue-400"
                aria-label={isEnded ? "Replay" : isPlaying ? "Pause" : "Play"}
                disabled={!isPlayerReady}
              >
                {isEnded ? (
                  <RefreshCw size={24} />
                ) : isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} />
                )}
              </button>
              {/* Timer */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="text-white hover:text-blue-400"
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                disabled={!isPlayerReady}
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
