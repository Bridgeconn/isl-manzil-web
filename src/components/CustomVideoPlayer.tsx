import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Maximize,
  Minimize,
  Loader2,
  Clock,
} from "lucide-react";
import SettingsButton from "../components/SettingsButton";
import SharePopup from "../components/SharePopUp";
import SettingsDrawer from "../components/SettingsDrawer";
import QualityDrawer from "../components/QualityDrawer";
import { Options as VimeoPlayerOptions } from "@vimeo/player";
import Player from "@vimeo/player";
import useBibleStore, { VerseMarkerType } from "@/store/useBibleStore";
import { useChapterNavigation } from "../hooks/useChapterNavigation";
import useDeviceDetection from "@/hooks/useDeviceDetection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";

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
    availableData,
    setBook,
    setChapter,
    currentVideoId,
    setCurrentVideoId,
    selectedBook,
    selectedChapter,
    selectedVerse,
    setVerse,
    loadVideoForCurrentSelection,
    bibleVerseMarker,
    findVerseMarkerForVerse,
    getBibleVerseMarker,
    getCurrentVerseFromTime,
    setCurrentPlayingVerse,
    currentPlayingVerse,
    isVideoLoading,
  } = useBibleStore();

  const { deviceType, shouldUseMobileBottomBar } = useDeviceDetection();

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);
  const updateIntervalRef = useRef<number | null>(null);
  const verseTrackingIntervalRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const pendingQualityChangeTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef<boolean>(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextClickRef = useRef<boolean>(false);
  const prevSelectedBook = useRef<string | null>(null);
  const prevSelectedVerse = useRef<number | null>(null);
  const prevSelectedChapter = useRef<number | null>(null);
  const userInteractedRef = useRef<boolean>(false);
  const isManualSeekingRef = useRef<boolean>(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const [showControls, setShowControls] = useState(true);
  const [showPlayBezel, setShowPlayBezel] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [lastAction, setLastAction] = useState<"play" | "pause" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showQualityDrawer, setShowQualityDrawer] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("Auto");
  const [availableQualities, setAvailableQualities] = useState<
    { id: string; label: string }[]
  >([]);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  //versedemarcation

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const HD_QUALITIES = ["1080p", "1440p", "2160p"];
  const isHDSelected = HD_QUALITIES.includes(selectedQuality);

  // const [shareUrl, setShareUrl] = useState<string>("");

  const BASE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173";

  const shareUrl = useMemo(() => {
    return selectedBook?.value && selectedChapter?.value
      ? `${BASE_URL}/bible/${selectedBook.value}/${selectedChapter.value}`
      : `${BASE_URL}/bible`;
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const bookCode = pathParts[2];
    const chapterNumber = pathParts[3];

    if (!bookCode || !chapterNumber || availableData.books.length === 0) return;

    const matchedBook = availableData.books.find((b) => b.value === bookCode);
    const chapterList = matchedBook
      ? availableData.chapters[matchedBook.value]
      : [];
    const matchedChapter = chapterList.find(
      (c) => String(c.value) === String(chapterNumber)
    );

    if (matchedBook && matchedChapter) {
      setBook(matchedBook);
      setChapter(matchedChapter);
    }
  }, [availableData.books, availableData.chapters, setBook, setChapter]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      setCurrentVideoId(null);
      loadVideoForCurrentSelection();
      getBibleVerseMarker();
      setSelectedQuality("Auto");
    }
  }, [
    selectedBook,
    selectedChapter,
    setCurrentVideoId,
    loadVideoForCurrentSelection,
    getBibleVerseMarker,
  ]);

  const isVideoAvailable = !isVideoLoading && currentVideoId !== null;
  const showComingSoon =
    !isVideoLoading &&
    currentVideoId === null &&
    selectedBook &&
    selectedChapter;

  const handleChangeSettings = () => {
    setShowQualityDrawer(false);
    setShowSettingsMenu(true);
  };

  const updateVerseDropdown = useCallback(
    (verseNumber: string | number) => {
      if (isManualSeekingRef.current) return;
      isManualSeekingRef.current = true;
      setVerse({
        value: ["Intro", "0"].includes(verseNumber.toString())
          ? 0
          : Number(verseNumber),
        label: verseNumber.toString(),
      });
      setTimeout(() => {
        isManualSeekingRef.current = false;
      }, 300);
    },
    [setVerse]
  );

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

  // Replace the existing orientation detection useEffect with this:
  useEffect(() => {
    const checkOrientation = () => {
      // Use a more stable check for mobile devices
      const isMobile = shouldUseMobileBottomBar;

      const isLandscape =
        isMobile &&
        window.innerWidth > window.innerHeight &&
        window.innerWidth / window.innerHeight > 1.2;

      setIsLandscapeMode(isLandscape);
    };

    // Debounce the orientation check to prevent rapid state changes
    let orientationTimeout: number;

    const debouncedCheckOrientation = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = window.setTimeout(checkOrientation, 150);
    };

    checkOrientation();

    // Listen for orientation changes with debouncing
    const handleOrientationChange = () => {
      // Add a longer delay for orientation change events
      setTimeout(debouncedCheckOrientation, 200);
    };

    const handleResize = () => {
      debouncedCheckOrientation();
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(orientationTimeout);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [shouldUseMobileBottomBar]);

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
        bibleVerseMarker?.length > 0 &&
        !isManualSeekingRef.current
      ) {
        try {
          const time = await vimeoPlayerRef.current.getCurrentTime();
          const currentVerse = getCurrentVerseFromTime(time);

          if (currentVerse && currentVerse !== currentPlayingVerse) {
            setCurrentPlayingVerse(currentVerse);
            updateVerseDropdown(currentVerse);
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
    updateVerseDropdown,
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
      if (!selectedVerse || !isPlayerReady || isManualSeekingRef.current) {
        return;
      }
      const currentBook = selectedBook?.value ?? null;
      const currentChapter = selectedChapter?.value ?? null;
      const currentVerse = selectedVerse.value;

      if (prevSelectedBook.current !== currentBook) {
        prevSelectedBook.current = currentBook;
        prevSelectedChapter.current = null;
        prevSelectedVerse.current = null;

        // Don't jump on book change
        if (currentVerse === 0) {
          prevSelectedVerse.current = 0;
          prevSelectedChapter.current = currentChapter;
          return;
        }
      }

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
  }, [
    selectedBook,
    selectedVerse,
    selectedChapter,
    jumpToVerse,
    isPlayerReady,
  ]);

  // Handle video ID changes
  useEffect(() => {
    if (
      !currentVideoId ||
      !playerRef.current ||
      isVideoLoading ||
      !isVideoAvailable
    )
      return;

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
        pendingQualityChangeTimeRef.current = null;

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
  }, [currentVideoId, clearIntervals, isVideoAvailable]);

  useEffect(() => {
    const fetchAndApplyVideoQuality = async () => {
      if (vimeoPlayerRef.current && isPlayerReady && selectedQuality) {
        try {
          const player = vimeoPlayerRef.current;
          await player.ready();
          const qualities = await player.getQualities();
          const qualityIds = qualities.map((q) => q.id);
          setAvailableQualities(qualities);
          const selected = selectedQuality.toLowerCase();
          if (qualityIds.includes(selected)) {
            await player.setQuality(
              selected as import("@vimeo/player").VimeoVideoQuality
            );
            console.log(`Video quality set to: ${selected}`);
          } else {
            console.warn(
              "Selected quality not available:",
              selected,
              "Available:",
              qualityIds
            );
          }

          //  Use the time stored at click time
          const timeToSeek = pendingQualityChangeTimeRef.current;
          if (timeToSeek) {
            await player.setCurrentTime(timeToSeek);
            setCurrentTime(timeToSeek);
          }
          //  Resume if it was playing
          if (wasPlayingRef.current) {
            await player.play();
            setIsPlaying(true);
          }
          // Clear it after applying
          pendingQualityChangeTimeRef.current = null;
          wasPlayingRef.current = false;
        } catch (err) {
          console.error("Error applying video quality:", err);
        }
      }
    };
    fetchAndApplyVideoQuality();
  }, [selectedQuality, isPlayerReady]);

  // Modified useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedOutsideSettings =
        containerRef.current && !containerRef.current.contains(target);

      const clickedOutsideShare =
        shareRef.current && !shareRef.current.contains(target);

      const clickedOnShareButton =
        shareButtonRef.current && shareButtonRef.current.contains(target);

      // Close settings-related drawers
      if ((showSettingsMenu || showQualityDrawer) && clickedOutsideSettings) {
        setShowSettingsMenu(false);
        setShowQualityDrawer(false);
        skipNextClickRef.current = true; // prevent toggle on same click
      }

      // Close share popup (but not if clicking on the share button itself)
      if (showShare && clickedOutsideShare && !clickedOnShareButton) {
        setShowShare(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showSettingsMenu, showQualityDrawer, showShare]);

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

          if (newCurrentVerse) {
            updateVerseDropdown(newCurrentVerse);
          }

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
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
      ) {
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
            if (newCurrentVerse) {
              updateVerseDropdown(newCurrentVerse);
            }
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
            if (newCurrentVerse) {
              updateVerseDropdown(newCurrentVerse);
            }
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
    updateVerseDropdown,
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
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setTimeout(() => {
          isManualSeekingRef.current = false;
        }, 500);
      }
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
    if (showShare || showSettingsMenu || showQualityDrawer) {
      return;
    }

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
    isManualSeekingRef.current = true;

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const seekPos = Math.max(0, Math.min(1, offsetX / rect.width));
    const seekTime = seekPos * duration;

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // Update current verse based on seek position
    const newCurrentVerse = getCurrentVerseFromTime(seekTime);
    setCurrentPlayingVerse(newCurrentVerse);

    if (newCurrentVerse) {
      setVerse({
        value: ["Intro", "0"].includes(newCurrentVerse.toString())
          ? 0
          : Number(newCurrentVerse),
        label: newCurrentVerse.toString(),
      });
    }

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
    setTimeout(() => {
      isManualSeekingRef.current = false;
    }, 500);
  };

  // Handle click on seek bar
  const handleSeekClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isVideoAvailable) {
      handleSeekPosition(event.clientX);
    }
  };

  const handleSeekMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isVideoAvailable) {
      isDraggingRef.current = true;
      isManualSeekingRef.current = true;
      userInteractedRef.current = true;
    }
  };

  // Handle verse marker click
  const handleVerseMarkerClick = (
    verse: VerseMarkerType,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!vimeoPlayerRef.current || !isPlayerReady || !isVideoAvailable) return;

    // Mark as user interaction
    userInteractedRef.current = true;
    isManualSeekingRef.current = true;

    const seekTime = timeToSeconds(verse.time);

    vimeoPlayerRef.current.setCurrentTime(seekTime);
    setCurrentTime(seekTime);

    // Update current verse based on clicked marker
    setCurrentPlayingVerse(verse.verse);

    setVerse({
      value: ["Intro", "0"].includes(verse.verse.toString())
        ? 0
        : Number(verse.verse),
      label: verse.verse.toString(),
    });

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
    setTimeout(() => {
      isManualSeekingRef.current = false;
    }, 500);
  };

  const navigateToVerse = (direction: "forward" | "backward") => {
    if (!vimeoPlayerRef.current) return;
    isManualSeekingRef.current = true;
    userInteractedRef.current = true;

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

    const nextVerse = bibleVerseMarker[targetVerseIndex];

    if (nextVerse) {
      const seekTime = timeToSeconds(nextVerse.time);
      vimeoPlayerRef.current.setCurrentTime(seekTime);
      setCurrentTime(seekTime);
      setCurrentPlayingVerse(nextVerse.verse);
      setVerse({
        value: ["Intro", "0"].includes(nextVerse.verse)
          ? 0
          : Number(nextVerse.verse),
        label: nextVerse.verse.toString(),
      });

      if (isEnded) {
        setIsEnded(false);
      }
      setTimeout(() => {
        isManualSeekingRef.current = false;
      }, 500);
    }
  };

  const isFirstVerse = () => {
    if (!bibleVerseMarker) return false;
    return (
      bibleVerseMarker[0].verse === currentPlayingVerse || currentTime === 0
    );
  };

  const isLastVerse = () => {
    if (!bibleVerseMarker) return false;
    return (
      bibleVerseMarker[bibleVerseMarker.length - 1].verse ===
        currentPlayingVerse ||
      !(currentTime < duration) ||
      isEnded
    );
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

  console.log("is landscape", isLandscapeMode);

  return (
    <div className="w-full max-w-5xl mx-auto sm:mt-2 md:px-2">
      <div className="flex items-end justify-center gap-2 w-full">
        {!shouldUseMobileBottomBar &&
          (canGoPrevious ? (
            <button
              onClick={() => navigateToChapter("previous")}
              className="mb-5.5 transition-all duration-200 bg-opacity-50 hover:bg-opacity-70 hover:bg-gray-200 hover:scale-120"
              title="Previous Chapter"
            >
              <ChevronLeft strokeWidth={2.5} size={25} />
            </button>
          ) : (
            <div className="w-6 h-6 mb-3" />
          ))}
        <div
          ref={playerContainerRef}
          className={`relative w-full max-w-4xl mx-auto overflow-hidden ${
            isFullscreen &&
            (shouldUseMobileBottomBar || deviceType === "tablet")
              ? "h-screen flex flex-col justify-center bg-black"
              : ""
          }`}
          style={{
            aspectRatio:
              isFullscreen &&
              (shouldUseMobileBottomBar || deviceType === "tablet")
                ? "unset"
                : "16/9",
            maxHeight:
              isFullscreen &&
              (shouldUseMobileBottomBar || deviceType === "tablet")
                ? "100vh"
                : "80vh",
          }}
          onClick={(e) => {
            const clickedInsideDrawer =
              containerRef.current?.contains(e.target as Node) ?? false;
            // Ignore click if it just closed the drawer
            if (skipNextClickRef.current) {
              skipNextClickRef.current = false;
              return;
            }
            //  Toggle only if not inside drawer
            if (!clickedInsideDrawer && isVideoAvailable) {
              togglePlay();
            }
          }}
        >
          {(isVideoLoading || !isPlayerReady) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <Loader2 className="w-8 h-8sm:w-12 sm:h-12 text-white animate-spin mb-2 sm:mb-4" />
              <div className="text-white sm:text-lg">Loading video...</div>
            </div>
          )}
          {showComingSoon && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-10">
              <Clock className="w-8 h-8 sm:w-16 sm:h-16 text-blue-400 mb-2 sm:mb-6" />
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
              <div
                className={`${
                  isFullscreen &&
                  (shouldUseMobileBottomBar || deviceType === "tablet")
                    ? "relative mx-auto bg-black"
                    : "w-full h-full"
                }`}
                style={{
                  ...((isFullscreen && shouldUseMobileBottomBar) ||
                  deviceType === "tablet"
                    ? {
                        aspectRatio: "16/9",
                        maxHeight: "100vh",
                        width: "100%",
                      }
                    : {
                        aspectRatio: "16/9",
                        maxHeight: "100%",
                        width: "100%",
                      }),
                }}
              >
                <div className="w-full h-full">
                  <div ref={playerRef} className="w-full h-full" />
                </div>

                {/* Play/Pause/Replay Bezel Effect */}
                {showPlayBezel && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="bg-black bg-opacity-50 rounded-full p-4 sm:p-6">
                      {isEnded && !(currentTime < duration) ? (
                        <RefreshCw className="text-white w-8 h-8 sm:w-12 sm:h-12" />
                      ) : lastAction === "pause" ? (
                        <FilledPauseIcon className="text-white w-8 h-8 sm:w-12 sm:h-12" />
                      ) : (
                        <FilledPlayIcon className="text-white w-8 h-8 sm:w-12 sm:h-12 pl-1" />
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
                  className={`absolute inset-0 z-20
                transition-opacity duration-300 ${
                  showControls || isEnded ? "opacity-100" : "opacity-0"
                }`}
                >
                  {/* Bottom Controls */}
                  <div
                    ref={controlsRef}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={handleControlsMouseEnter}
                    onMouseLeave={handleControlsMouseLeave}
                  >
                    {/* Seekbar with sections */}
                    <div
                      ref={seekBarRef}
                      className="relative h-1 bg-gray-600 rounded-full mb-1 md:mb-2 cursor-pointer"
                      onClick={handleSeekClick}
                      onMouseMove={(e) => {
                        const rect =
                          seekBarRef.current?.getBoundingClientRect();
                        if (rect) {
                          const x = e.clientX - rect.left;
                          const percent = Math.max(
                            0,
                            Math.min(1, x / rect.width)
                          );
                          const time = percent * duration;
                          setHoverTime(time);
                        }
                      }}
                      onMouseLeave={() => setHoverTime(null)}
                      title={
                        hoverTime !== null
                          ? (() => {
                              const currentVerse =
                                getCurrentVerseFromTime(hoverTime);
                              const verseText = currentVerse
                                ? `Verse ${currentVerse}`
                                : "Intro";
                              return `${verseText} - ${formatTime(hoverTime)}`;
                            })()
                          : ""
                      }
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
                              }  cursor-pointer z-10 hover:w-1.5 transition-all duration-200 ease-in-out`}
                              style={{
                                left: `${versePosition}%`,
                                transform: "translateX(-50%)",
                              }}
                              onClick={(e) => handleVerseMarkerClick(verse, e)}
                              title={`Verse ${verse.verse} - ${formatTime(
                                verseTimeInSeconds
                              )}`}
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
                        {(bibleVerseMarker?.length ?? 0) > 0 &&
                          !selectedChapter?.label.includes("Intro") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToVerse("backward");
                              }}
                              className={`${
                                isFirstVerse() || !isPlayerReady
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-white hover:text-blue-400"
                              }`}
                              aria-label="Previous Verse"
                              disabled={!isPlayerReady || isFirstVerse()}
                              title={isFirstVerse() ? "" : "Previous Verse"}
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
                        {(bibleVerseMarker?.length ?? 0) > 0 &&
                          !selectedChapter?.label.includes("Intro") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToVerse("forward");
                              }}
                              className={`${
                                isLastVerse() || !isPlayerReady
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-white hover:text-blue-400"
                              }`}
                              aria-label="Next Verse"
                              disabled={!isPlayerReady || isLastVerse()}
                              title={isLastVerse() ? "" : "Next Verse"}
                            >
                              <FilledSkipForwardIcon size={24} />
                            </button>
                          )}
                        {/* Timer */}
                        <div
                          className="text-white text-sm"
                          style={{ userSelect: "none" }}
                        >
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4   ">
                        <div className="mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();

                              // Only skip if share popup is currently open and we flagged to skip

                              if (showSettingsMenu || showQualityDrawer) {
                                setShowSettingsMenu(false);
                                setShowQualityDrawer(false);
                                setShowShare(true);
                              } else {
                                // Normal toggle behavior when settings is closed
                                setShowShare((prev) => !prev);
                              }
                            }}
                            className="text-white hover:text-blue-400"
                            title="Share"
                          >
                            <FontAwesomeIcon
                              icon={faShareNodes}
                              className="w-6 h-8 text-[25px]"
                            />
                          </button>
                        </div>
                        {/* Settings Button */}
                        <div ref={containerRef} className="flex items-center">
                          <div className="mt-1 relative">
                            <SettingsButton
                              ref={settingsButtonRef}
                              onClick={() => {
                                if (showShare) {
                                  setShowShare(false);
                                  setShowSettingsMenu(true);
                                } else if (
                                  showSettingsMenu &&
                                  !showQualityDrawer
                                ) {
                                  setShowSettingsMenu(false);
                                } else if (showQualityDrawer) {
                                  setShowSettingsMenu(false);
                                  setShowQualityDrawer(false);
                                } else {
                                  setShowSettingsMenu(true);
                                }
                              }}
                              isDisabled={!isPlayerReady}
                            />
                            {isHDSelected && (
                              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-0.25 py-0.5 rounded leading-none">
                                HD
                              </span>
                            )}
                          </div>
                          <SettingsDrawer
                            isVisible={showSettingsMenu}
                            onClose={() => setShowSettingsMenu(false)}
                            selectedQuality={selectedQuality}
                            onOpenQualityDrawer={() => {
                              setShowSettingsMenu(false);
                              setShowQualityDrawer(true);
                            }}
                          />
                          <QualityDrawer
                            isVisible={showQualityDrawer}
                            selectedQuality={selectedQuality}
                            availableQualities={availableQualities}
                            onSelect={async (quality) => {
                              if (vimeoPlayerRef.current) {
                                const currentTime =
                                  await vimeoPlayerRef.current.getCurrentTime();
                                pendingQualityChangeTimeRef.current =
                                  currentTime;
                                //Save if it was playing
                                const isActuallyPlaying =
                                  await vimeoPlayerRef.current
                                    .getPaused()
                                    .then((p) => !p);
                                wasPlayingRef.current = isActuallyPlaying;
                              }
                              setSelectedQuality(quality);
                            }}
                            onClose={() => setShowQualityDrawer(false)}
                            onBackToSettings={handleChangeSettings}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          }}
                          className="text-white hover:text-blue-400"
                          aria-label={
                            isFullscreen
                              ? "Exit fullscreen"
                              : "Enter fullscreen"
                          }
                          title={
                            isFullscreen
                              ? "Exit fullscreen"
                              : "Enter fullscreen"
                          }
                          disabled={!isPlayerReady}
                        >
                          {isFullscreen ? (
                            <Minimize strokeWidth={2.5} size={24} />
                          ) : (
                            <Maximize strokeWidth={2.5} size={24} />
                          )}
                        </button>
                        {showShare && (
                          <div
                            ref={shareRef}
                            className="absolute bottom-5 right-6 "
                          >
                            <SharePopup
                              shareUrl={shareUrl}
                              onClose={() => setShowShare(false)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {!shouldUseMobileBottomBar &&
          (canGoNext ? (
            <button
              onClick={() => navigateToChapter("next")}
              className="mb-5.5 transition-all duration-200 bg-opacity-50 hover:bg-opacity-70 hover:bg-gray-200 hover:scale-120"
              title="Next Chapter"
            >
              <ChevronRight strokeWidth={2.5} size={25} />
            </button>
          ) : (
            <div className="w-6 h-6 mb-3" />
          ))}
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
