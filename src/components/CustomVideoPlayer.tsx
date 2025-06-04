import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Maximize, Minimize, Loader2, Clock } from "lucide-react";
import { Options as VimeoPlayerOptions } from "@vimeo/player";
import Next from "../assets/images/Next.gif";
import Previous from "../assets/images/Previous.gif";
import Player from "@vimeo/player";
import useBibleStore, { VerseMarkerType } from "@/store/useBibleStore";
import { useChapterNavigation } from "../hooks/useChapterNavigation";
import LoopingGif from "./LoopingGif";

const FilledPlayIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const FilledPauseIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const FilledSkipBackIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M4 5h2v14H4V5zm4.5 7l9.5 7V5l-9.5 7z" />
  </svg>
);

const FilledSkipForwardIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M20 5h-2v14h2V5zm-4.5 7L6 19V5l9.5 7z" />
  </svg>
);

const CustomVideoPlayer = () => {
  const { canGoPrevious, canGoNext, navigateToChapter } =
    useChapterNavigation();
  const {
    currentVideoId,
    setCurrentVideoId,
    selectedBook,
    selectedChapter,
    selectedVerse,
    loadVideoForCurrentSelection,
    bibleVerseMarker,
    findVerseMarkerForVerse,
    getBibleVerseMarker,
    getCurrentVerseFromTime,
    setCurrentPlayingVerse,
    currentPlayingVerse,
    isVideoLoading,
  } = useBibleStore();

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const updateIntervalRef = useRef<number | null>(null);
  const verseTrackingIntervalRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  const prevSelectedVerse = useRef<number | null>(null);
  const prevSelectedChapter = useRef<number | null>(null);
  const userInteractedRef = useRef<boolean>(false);

  const [showControls, setShowControls] = useState(true);
  const [showPlayBezel, setShowPlayBezel] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [lastAction, setLastAction] = useState<"play" | "pause" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const isVideoAvailable = !isVideoLoading && currentVideoId !== null;
  const showComingSoon =
    !isVideoLoading &&
    currentVideoId === null &&
    selectedBook &&
    selectedChapter;

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      setCurrentVideoId(null);
      loadVideoForCurrentSelection();
      getBibleVerseMarker();
    }
  }, [
    selectedBook,
    selectedChapter,
    setCurrentVideoId,
    loadVideoForCurrentSelection,
    getBibleVerseMarker,
  ]);

  // Helper function to clear all intervals
  const clearIntervals = useCallback(() => {
    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    if (verseTrackingIntervalRef.current !== null) {
      clearInterval(verseTrackingIntervalRef.current);
      verseTrackingIntervalRef.current = null;
    }
  }, []);

  const setupIntervals = useCallback(() => {
    clearIntervals();

    // Set up interval for time updates
    updateIntervalRef.current = window.setInterval(async () => {
      if (vimeoPlayerRef.current && isPlayerReady) {
        try {
          const time = await vimeoPlayerRef.current.getCurrentTime();
          setCurrentTime(time);
        } catch (error) {
          console.error("Error getting current time:", error);
        }
      }
    }, 500);

    // Set up interval for verse tracking
    verseTrackingIntervalRef.current = window.setInterval(async () => {
      if (
        vimeoPlayerRef.current &&
        isPlayerReady &&
        isPlaying &&
        !isEnded &&
        bibleVerseMarker &&
        bibleVerseMarker?.length > 0
      ) {
        try {
          const time = await vimeoPlayerRef.current.getCurrentTime();
          const currentVerse = getCurrentVerseFromTime(time);

          if (currentVerse && currentVerse !== currentPlayingVerse) {
            setCurrentPlayingVerse(currentVerse);
          }
        } catch (error) {
          console.error("Error tracking verse:", error);
        }
      }
    }, 500);
  }, [
    isPlayerReady,
    isPlaying,
    isEnded,
    bibleVerseMarker,
    getCurrentVerseFromTime,
    currentPlayingVerse,
    setCurrentPlayingVerse,
    clearIntervals,
  ]);

  // Helper function to jump to a specific verse
  const jumpToVerse = useCallback(
    async (verseNumber: number) => {
      if (!vimeoPlayerRef.current || !isPlayerReady) return;

      const verseMarker = findVerseMarkerForVerse(verseNumber);
      if (!verseMarker) {
        console.warn(`Verse ${verseNumber} marker not found`);
        return;
      }

      try {
        const seekTime = timeToSeconds(verseMarker.time);
        await vimeoPlayerRef.current.setCurrentTime(seekTime);
        setCurrentTime(seekTime);
        setCurrentPlayingVerse(verseMarker.verse);

        // If video was ended, update state
        if (isEnded) {
          setIsEnded(false);
        }
      } catch (error) {
        console.error(`Error jumping to verse ${verseNumber}:`, error);
      }
    },
    [isPlayerReady, findVerseMarkerForVerse, setCurrentPlayingVerse, isEnded]
  );

  // Effect to handle selectedVerse changes
  useEffect(() => {
  const handleVerseChange = async () => {
    if (!selectedVerse || !isPlayerReady) {
      return;
    }

    const currentChapter = selectedChapter?.value ?? null;
    const currentVerse = selectedVerse.value;

    if (prevSelectedChapter.current !== currentChapter) {
      prevSelectedVerse.current = null;
      prevSelectedChapter.current = currentChapter;

      if (currentVerse === 0) {
        prevSelectedVerse.current = 0;
        return;
      }
    }

    if (prevSelectedVerse.current !== currentVerse) {
      prevSelectedVerse.current = currentVerse;
      userInteractedRef.current = false;
      await jumpToVerse(currentVerse);
    }
  };

  handleVerseChange();
}, [selectedVerse, selectedChapter, isPlayerReady, jumpToVerse]);

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

    if (playerRef.current && isVideoAvailable) {
      loadVimeo();
    }

    return () => {
      clearControlsTimeout();
      clearIntervals();

      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.destroy();
        vimeoPlayerRef.current = null;
        setIsPlayerReady(false);
      }
    };
  }, [clearIntervals, isVideoAvailable]);

  // Handle video ID changes
  useEffect(() => {
    if (!currentVideoId || !playerRef.current || isVideoLoading) return;

    const loadNewVideo = async () => {
      try {
        // Clear previous player if it exists
        if (vimeoPlayerRef.current) {
          clearIntervals();

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
        setCurrentPlayingVerse(null);

        // Reset tracking references
        userInteractedRef.current = false;

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
      } catch (error) {
        console.error("Error loading new video:", error);
      }
    };

    loadNewVideo();

    return () => {
      clearControlsTimeout();
      clearIntervals();
    };
  }, [currentVideoId, clearIntervals]);

  // Update intervals when play state changes
  useEffect(() => {
    if (isPlayerReady && isPlaying && !isEnded) {
      setupIntervals();
    }

    return () => {
      clearIntervals();
    };
  }, [isPlaying, isPlayerReady, isEnded, setupIntervals, clearIntervals]);

  useEffect(() => {
    const handleSeekEvent = async (e: any) => {
      const { time } = e.detail;
      const seconds = timeToSeconds(time);

      if (vimeoPlayerRef.current && isPlayerReady) {
        try {
          userInteractedRef.current = true;

          await vimeoPlayerRef.current.setCurrentTime(seconds);

          setCurrentTime(seconds);

          const newCurrentVerse = getCurrentVerseFromTime(seconds);
          setCurrentPlayingVerse(newCurrentVerse);

          if (isEnded) {
            setIsEnded(false);
          }
        } catch (error) {
          console.error("Error seeking to verse:", error);
        }
      } else {
        console.warn("Player not ready for seeking");
      }
    };

    window.addEventListener("seek-to-verse", handleSeekEvent);
    return () => {
      window.removeEventListener("seek-to-verse", handleSeekEvent);
    };
  }, [isPlayerReady, isEnded, getCurrentVerseFromTime, setCurrentPlayingVerse]);

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
      if (!isPlayerReady || !isVideoAvailable) return;

      // Mark user interaction for seek operations
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        userInteractedRef.current = true;
      }

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
          vimeoPlayerRef.current?.setCurrentTime(newTime);
          setCurrentTime(newTime);
          if (isEnded) {
            setIsEnded(false);
          }
          if (bibleVerseMarker && bibleVerseMarker?.length > 0) {
            const newCurrentVerse = getCurrentVerseFromTime(newTime);
            setCurrentPlayingVerse(newCurrentVerse);
          }
          break;
        }
        case "ArrowRight": {
          const currentTime =
            (await vimeoPlayerRef.current?.getCurrentTime()) || 0;
          const newTime = Math.min(duration, currentTime + 10);
          vimeoPlayerRef.current?.setCurrentTime(newTime);
          setCurrentTime(newTime);
          if (isEnded) {
            setIsEnded(false);
          }
          if (bibleVerseMarker && bibleVerseMarker?.length > 0) {
            const newCurrentVerse = getCurrentVerseFromTime(newTime);
            setCurrentPlayingVerse(newCurrentVerse);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlaying,
    isFullscreen,
    isPlayerReady,
    duration,
    isEnded,
    bibleVerseMarker,
    getCurrentVerseFromTime,
    setCurrentPlayingVerse,
    isVideoAvailable,
  ]);

  // Setup global mouse events for seek bar dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && seekBarRef.current && isVideoAvailable) {
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
  }, [duration, isVideoAvailable]);

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
      clearControlsTimeout();
    };

    const handleEnded = () => {
      console.log("Video ended event triggered");
      setIsPlaying(false);
      setShowControls(true);
      setIsEnded(true);
      setCurrentPlayingVerse(null);
      clearControlsTimeout();
      clearIntervals();
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
    } catch (error) {
      console.error("Error initializing Vimeo player:", error);
    }
  };

  const clearControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const setControlsHideTimeout = () => {
    clearControlsTimeout();
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2000);
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

    // Mark as user interaction
    userInteractedRef.current = true;

    vimeoPlayerRef.current.setCurrentTime(0);
    vimeoPlayerRef.current.play();

    setCurrentTime(0);
    setIsPlaying(true);
    setIsEnded(false);
    setCurrentPlayingVerse(null);
    setShowPlayBezel(true);
    setTimeout(() => setShowPlayBezel(false), 800);
  };

  // Handle seeking in the video
  const handleSeekPosition = (clientX: number) => {
    if (!vimeoPlayerRef.current || !seekBarRef.current || !isPlayerReady)
      return;

    // Mark as user interaction
    userInteractedRef.current = true;

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const seekPos = Math.max(0, Math.min(1, offsetX / rect.width));
    const seekTime = seekPos * duration;

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // Update current verse based on seek position
    const newCurrentVerse = getCurrentVerseFromTime(seekTime);
    setCurrentPlayingVerse(newCurrentVerse);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  // Handle click on seek bar
  const handleSeekClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (isVideoAvailable) {
      handleSeekPosition(event.clientX);
    }
  };

  // For dragging
  const handleSeekMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isVideoAvailable) {
      isDraggingRef.current = true;
    }
  };

  // Handle verse marker click
  const handleVerseMarkerClick = (
    verse: VerseMarkerType,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (!vimeoPlayerRef.current || !isPlayerReady || !isVideoAvailable) return;

    // Mark as user interaction
    userInteractedRef.current = true;

    const seekTime = timeToSeconds(verse.time);

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // Update current verse based on clicked marker
    setCurrentPlayingVerse(verse.verse);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  const navigateToVerse = (direction: "forward" | "backward") => {
    if (!vimeoPlayerRef.current) return;

    const verseTimes =
      bibleVerseMarker &&
      bibleVerseMarker.map((verse) => timeToSeconds(verse.time));

    if (!verseTimes) return;

    const nextVerseIndex = verseTimes.findIndex(
      (verseTime) => verseTime > currentTime
    );

    const currentVerseIndex =
      nextVerseIndex === -1 ? verseTimes.length - 1 : nextVerseIndex - 1;

    let targetVerseIndex;
    if (direction === "forward") {
      targetVerseIndex =
        nextVerseIndex === -1 ? verseTimes.length - 1 : nextVerseIndex;
    } else {
      targetVerseIndex = currentVerseIndex <= 0 ? 0 : currentVerseIndex - 1;
    }

    console.log("target verse index", targetVerseIndex);

    const nextVerse = bibleVerseMarker[targetVerseIndex];

    if (nextVerse) {
      const seekTime = timeToSeconds(nextVerse.time);
      vimeoPlayerRef.current.setCurrentTime(seekTime);
      setCurrentTime(seekTime);
      setCurrentPlayingVerse(nextVerse.verse);

      if (isEnded) {
        setIsEnded(false);
      }
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

  // Handle controls area mouse events
  const handleControlsMouseEnter = () => {
    setShowControls(true);
    clearControlsTimeout();
  };

  const handleControlsMouseLeave = () => {
    if (!isEnded && !isDraggingRef.current && isVideoAvailable) {
      setControlsHideTimeout();
    }
  };

  // Calculate progress as percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  console.log("selected chapter", selectedChapter, bibleVerseMarker);

  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      <div className="flex items-center justify-center w-full">
        {/* <div className="flex flex-col items-center gap-2 sm:gap-4"> */}
        {/* <button
            onClick={() => navigateToChapter("previous")}
            disabled={!canGoPrevious}
            className={`p-1 rounded-full transition-all duration-200 ${
              canGoPrevious
                ? "bg-gray-200 bg-opacity-50 hover:bg-opacity-70 hover:scale-110"
                : "cursor-not-allowed opacity-50"
            }`}
            title="Previous Chapter"
          >
            <ChevronLeft size={24} />
          </button> */}
        {canGoPrevious ? (
          <button
            onClick={() => navigateToChapter("previous")}
            className={`transition-all duration-200 rounded-full p-1 cursor-pointer hover:scale-110 hover:bg-gray-100`}
            title="Previous Chapter"
          >
            <LoopingGif
              src={Previous}
              alt="Previous chapter"
              className="w-10 h-10 md:w-15 md:h-15 lg:w-20 lg:h-20"
              duration={2000}
            />
          </button>
        ) : (
          <button className="p-1">
            <div className="w-10 h-10 md:w-15 md:h-15 lg:w-20 lg:h-20" />
          </button>
        )}

        {/* </div> */}

        <div
          ref={playerContainerRef}
          className="relative w-full sm:w-3/4 mx-auto bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: "16/9" }}
          onClick={
            isVideoAvailable
              ? () => {
                  togglePlay();
                  setControlsHideTimeout();
                }
              : undefined
          }
        >
          {(isVideoLoading || !isPlayerReady) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
              <div className="text-white text-lg">Loading video...</div>
            </div>
          )}
          {showComingSoon && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-10">
              <Clock className="w-16 h-16 text-blue-400 mb-2 sm:mb-6" />
              <div className="text-white text-xl sm:text-2xl font-bold mb-2">
                Video Coming Soon
              </div>
              <div className="text-gray-300 sm:text-lg text-center px-4">
                {selectedBook?.label} Chapter {selectedChapter?.label}
              </div>
              <div className="text-gray-400 text-sm mt-2 sm:mt-4 text-center px-4">
                This video is currently being prepared and will be available
                soon.
              </div>
            </div>
          )}
          {isVideoAvailable && (
            <>
              {/* Vimeo Player Container */}
              <div className="w-full h-full">
                <div ref={playerRef} className="w-full h-full" />
              </div>

              {/* Play/Pause/Replay Bezel Effect */}
              {showPlayBezel && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="bg-black bg-opacity-50 rounded-full p-6">
                    {isEnded && !(currentTime < duration) ? (
                      <RefreshCw size={48} className="text-white" />
                    ) : lastAction === "pause" ? (
                      <FilledPauseIcon size={48} className="text-white" />
                    ) : (
                      <FilledPlayIcon size={48} className="text-white pl-1" />
                    )}
                  </div>
                </div>
              )}
              {/* Video Ended Overlay */}
              {isEnded && !(currentTime < duration) && (
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
                } z-20`}
              >
                {/* Bottom Controls */}
                <div
                  ref={controlsRef}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={handleControlsMouseEnter}
                  onMouseLeave={handleControlsMouseLeave}
                >
                  {/* Seekbar with sections */}
                  <div
                    ref={seekBarRef}
                    className="relative h-1 bg-gray-600 rounded-full mb-4 cursor-pointer"
                    onClick={handleSeekClick}
                  >
                    {/* Progress Bar */}
                    <div
                      className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                    {/* Verse markers */}
                    {bibleVerseMarker &&
                      bibleVerseMarker.length > 0 &&
                      bibleVerseMarker.map((verse: VerseMarkerType) => {
                        const verseTimeInSeconds = timeToSeconds(verse.time);
                        const versePosition =
                          (verseTimeInSeconds / duration) * 100;
                        const isPassed = currentTime >= verseTimeInSeconds;
                        return (
                          <div
                            key={verse.id}
                            className={`absolute top-0 w-0.5 h-1 ${
                              isPassed ? "bg-yellow-400" : "bg-black"
                            }  cursor-pointer z-10 hover:w-1 transition-all duration-200`}
                            style={{
                              left: `${versePosition}%`,
                              transform: "translateX(-50%)",
                            }}
                            onClick={(e) => handleVerseMarkerClick(verse, e)}
                            title={`Verse:${verse.verse} (${verse.time})`}
                          ></div>
                        );
                      })}
                    {/* Current Time Indicator */}
                    <div
                      className="absolute top-0 w-4 h-4 bg-white rounded-full cursor-grab z-20 -mt-1.5"
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
                      {(bibleVerseMarker?.length ?? 0) > 0 && !selectedChapter?.label.includes("Intro") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToVerse("backward");
                          }}
                          className="text-white hover:text-blue-400"
                          aria-label="Previous Verse"
                          disabled={!isPlayerReady}
                        >
                          <FilledSkipBackIcon size={24} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEnded && !(currentTime < duration)) {
                            replayVideo(e);
                          } else {
                            togglePlay();
                          }
                        }}
                        className="text-white hover:text-blue-400"
                        aria-label={
                          isEnded && !(currentTime < duration)
                            ? "Replay"
                            : isPlaying
                            ? "Pause"
                            : "Play"
                        }
                        disabled={!isPlayerReady}
                      >
                        {isEnded && !(currentTime < duration) ? (
                          <RefreshCw size={24} />
                        ) : isPlaying ? (
                          <FilledPauseIcon size={24} />
                        ) : (
                          <FilledPlayIcon size={24} />
                        )}
                      </button>
                      {(bibleVerseMarker?.length ?? 0) > 0 && !selectedChapter?.label.includes("Intro") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToVerse("forward");
                          }}
                          className="text-white hover:text-blue-400"
                          aria-label="Next Verse"
                          disabled={!isPlayerReady}
                        >
                          <FilledSkipForwardIcon size={24} />
                        </button>
                      )}
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
                        title={
                          isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                        }
                        disabled={!isPlayerReady}
                      >
                        {isFullscreen ? (
                          <Minimize size={24} />
                        ) : (
                          <Maximize size={24} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* <div className="flex flex-col items-center gap-2 sm:gap-4"> */}
        {/* <button
            onClick={() => navigateToChapter("next")}
            disabled={!canGoNext}
            className={`p-1 rounded-full transition-all duration-200 ${
              canGoNext
                ? "bg-gray-200 bg-opacity-50 hover:bg-opacity-70 hover:scale-110"
                : "cursor-not-allowed opacity-50"
            }`}
            title="Next Chapter"
          >
            <ChevronRight size={24} />
          </button> */}
        {canGoNext ? (
          <button
            onClick={() => navigateToChapter("next")}
            className={`transition-all duration-200 rounded-full p-1 cursor-pointer hover:scale-110 hover:bg-gray-100`}
            title="Next Chapter"
          >
            <LoopingGif
              src={Next}
              alt="Next chapter"
              className="w-10 h-10 md:w-15 md:h-15 lg:w-20 lg:h-20"
              duration={2000}
            />
          </button>
        ) : (
          <button className="p-1">
            <div className="w-10 h-10 md:w-15 md:h-15 lg:w-20 lg:h-20" />
          </button>
        )}
        {/* </div> */}
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
