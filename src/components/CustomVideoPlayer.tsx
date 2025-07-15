import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  RefreshCw,
  Maximize,
  Minimize,
  Loader2,
  Clock,
  Loader,
  Download,
} from "lucide-react";
import SettingsButton from "../components/SettingsButton";
import SharePopup from "../components/SharePopUp";
import SettingsDrawer from "../components/SettingsDrawer";
import QualityDrawer from "../components/QualityDrawer";
import PlaybackDrawer from "./PlayBackDrawer";
import { Options as VimeoPlayerOptions } from "@vimeo/player";
import Player from "@vimeo/player";
import useBibleStore, { VerseMarkerType } from "@/store/useBibleStore";
import useDeviceDetection from "@/hooks/useDeviceDetection";
import { useVimeoDownload } from "@/hooks/useVimeoDownload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { useLayoutControl } from "@/hooks/useLayoutControl";
import versificationData from "../assets/data/versification.json";
import { VersificationData } from "../types/bible";

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

const getViewportHeight = () => {
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
};

const getViewportWidth = () => {
  if (window.visualViewport) {
    return window.visualViewport.width;
  }
  return window.innerWidth;
};

const CustomVideoPlayer = () => {
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
    isManualVerseSelection,
  } = useBibleStore();

  const { deviceType, shouldUseMobileBottomBar } = useDeviceDetection();
  const { textPosition } = useLayoutControl();
  const { getDownloadOptions, downloadVideo, error, loading } =
    useVimeoDownload();

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
  const pendingVerseSeekRef = useRef<number | null>(null);

  const playbackRef = useRef<HTMLDivElement | null>(null);

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
  const [showPlaybackDrawer, setShowPlaybackDrawer] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState("Auto");
  const [availableQualities, setAvailableQualities] = useState<
    { id: string; label: string }[]
  >([]);
  const [isSmallerScreen, setIsSmallerScreen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const singleClickTimeoutRef = useRef<number | null>(null);
  const isDoubleTapRef = useRef<boolean>(false);
  const [showSeekFeedback, setShowSeekFeedback] = useState<{
    show: boolean;
    direction: "forward" | "backward";
    seconds: number;
  }>({ show: false, direction: "forward", seconds: 10 });
  const [tooltipWidth, setTooltipWidth] = useState(0);

  const tooltipRef = useRef<HTMLDivElement>(null);

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState([]);

  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  //versedemarcation

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const HD_QUALITIES = ["1080p", "1440p", "2160p"];
  const isHDSelected = HD_QUALITIES.includes(selectedQuality);

  // const [shareUrl, setShareUrl] = useState<string>("");

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const width = tooltipRef.current.offsetWidth;
      if (width !== tooltipWidth) {
        setTooltipWidth(width);
      }
    }
  }, [hoverTime, tooltipWidth]);

  const BASE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173";

  const shareUrl = useMemo(() => {
    const chapterLabel = ["0", "Intro"].includes(
      selectedChapter! && selectedChapter?.label
    )
      ? "Introduction"
      : selectedChapter?.label;

    return selectedBook?.value && selectedChapter?.value.toString()
      ? `${BASE_URL}/bible/${selectedBook.value}/${chapterLabel}`
      : `${BASE_URL}/bible`;
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const bookCode = pathParts[2];
    const chapterNumber = pathParts[3] === "Introduction" ? "0" : pathParts[3];

    if (!bookCode || !chapterNumber || availableData.books.length === 0) return;

    const matchedBook = availableData.books?.find((b) => b.value === bookCode);
    const chapterList = matchedBook
      ? availableData.chapters[matchedBook.value]
      : [];
    const matchedChapter = chapterList?.find(
      (c) => String(c.value) === String(chapterNumber)
    );
    const typedVersificationData = versificationData as VersificationData;
    const checkMaxChapters =
      typedVersificationData?.maxVerses[matchedBook!.value.toUpperCase()]
        .length;

    const isValidChapter =
      Number(chapterNumber) >= 0 && Number(chapterNumber) <= checkMaxChapters;

    const chapterOption = {
      label:
        chapterNumber.toString() === "0" ? "Intro" : chapterNumber.toString(),
      value: Number(chapterNumber),
    };
    if (matchedBook) setBook(matchedBook, true);
    if (matchedChapter) {
      setChapter(matchedChapter);
    } else if (isValidChapter) {
      setChapter(chapterOption);
    } else {
      setChapter({
        label: "Intro",
        value: 0,
      });
    }
  }, [availableData.books, availableData.chapters, setBook, setChapter]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      setCurrentVideoId(null);
      setIsPlayerReady(false);
      loadVideoForCurrentSelection();
      getBibleVerseMarker();
      setSelectedQuality("Auto");
      setPlaybackSpeed(1);
      setShowDownloadDropdown(false);
      setDownloadOptions([]);
    }
  }, [
    selectedBook,
    selectedChapter,
    setCurrentVideoId,
    loadVideoForCurrentSelection,
    getBibleVerseMarker,
  ]);

  useEffect(() => {
    return () => {
      if (singleClickTimeoutRef.current) {
        clearTimeout(singleClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    isDoubleTapRef.current = false;
    skipNextClickRef.current = false;

    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
  }, [currentVideoId]);

  useEffect(() => {
    let feedbackTimeout: number;

    if (showSeekFeedback.show) {
      feedbackTimeout = window.setTimeout(() => {
        setShowSeekFeedback({
          show: false,
          direction: showSeekFeedback.direction,
          seconds: 10,
        });
      }, 700);
    }

    return () => {
      if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
      }
    };
  }, [showSeekFeedback.show, showSeekFeedback.direction]);

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
  const handleChangeQuality = () => {
    setShowPlaybackDrawer(false);
    setShowSettingsMenu(true);
  };

  const updateVerseDropdown = useCallback(
    (verseNumber: string | number) => {
      const verseStr = verseNumber.toString();
      const verseValue = ["Intro", "0"].includes(verseStr)
        ? 0
        : verseStr.includes("-")
        ? parseInt(verseStr.split("-")[0])
        : parseInt(verseStr) || 0;

      if (prevSelectedVerse.current !== verseValue) {
        setVerse({
          value: verseValue,
          label: verseStr,
        });
        prevSelectedVerse.current = verseValue;
      }

      // setTimeout(() => {
      //   isManualSeekingRef.current = false;
      // }, 200);
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

  useEffect(() => {
    const addViewportMeta = () => {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        document.head.appendChild(viewport);
      }

      if (isFullscreen && deviceType === "mobile") {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        );
      } else {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, viewport-fit=cover"
        );
      }
    };

    addViewportMeta();
  }, [isFullscreen, deviceType]);

  useEffect(() => {
    const checkOrientation = () => {
      const viewportWidth = getViewportWidth();
      const viewportHeight = getViewportHeight();
      const isSmallerScreen =
        ["tablet", "laptop", "desktop"].includes(deviceType) &&
        viewportWidth > viewportHeight &&
        viewportHeight < 600;
      setIsSmallerScreen(isSmallerScreen);
    };

    // Debounce the orientation check to prevent rapid state changes
    let orientationTimeout: number;
    let resizeTimeout: number;

    const debouncedCheckOrientation = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = window.setTimeout(checkOrientation, 100);
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(checkOrientation, 100);
    };

    checkOrientation();

    // Listen for orientation changes with debouncing
    const handleOrientationChange = () => {
      // Add a longer delay for orientation change events
      setTimeout(debouncedCheckOrientation, 300);
    };

    const handleResize = () => {
      debouncedResize();
    };

    const handleVisualViewportChange = () => {
      debouncedCheckOrientation();
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange
      );
    }

    return () => {
      clearTimeout(orientationTimeout);
      clearTimeout(resizeTimeout);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange
        );
      }
    };
  }, [deviceType]);

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

    if (!isPlayerReady || pendingVerseSeekRef.current !== null) {
      return;
    }

    // Set up interval for time updates
    updateIntervalRef.current = window.setInterval(async () => {
      if (
        vimeoPlayerRef.current &&
        isPlayerReady &&
        !isManualSeekingRef.current
      ) {
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
        !isManualSeekingRef.current &&
        !isManualVerseSelection &&
        pendingVerseSeekRef.current === null
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
    isManualVerseSelection,
  ]);

  useEffect(() => {
    let timeUpdateInterval: NodeJS.Timeout;

    if (isPlayerReady && vimeoPlayerRef.current) {
      timeUpdateInterval = setInterval(async () => {
        try {
          const time = await vimeoPlayerRef.current?.getCurrentTime();
          setCurrentTime(time!);
        } catch (error) {
          console.error("Error updating time:", error);
        }
      }, 500);
    }

    return () => {
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
    };
  }, [isPlayerReady]);

  // Helper function to jump to a specific verse
  const jumpToVerse = useCallback(
    async (verseNumber: number) => {
      if (!vimeoPlayerRef.current || !isPlayerReady) return;
      const verseMarker = await findVerseMarkerForVerse(verseNumber);
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
        pendingVerseSeekRef.current = null;

        // Don't jump on book change
        if (currentVerse === 0) {
          prevSelectedVerse.current = 0;
          prevSelectedChapter.current = currentChapter;
          return;
        }
      }

      if (prevSelectedChapter.current !== currentChapter) {
        prevSelectedChapter.current = currentChapter;
        prevSelectedVerse.current = null;
        pendingVerseSeekRef.current = null;
        if (currentVerse === 0) {
          prevSelectedVerse.current = 0;
          return;
        }
      }

      if (!isPlayerReady || isManualSeekingRef.current) {
        if (
          currentVerse !== 0 &&
          (isManualVerseSelection ||
            (prevSelectedBook.current === currentBook &&
              prevSelectedChapter.current === currentChapter))
        ) {
          pendingVerseSeekRef.current = currentVerse;
        }
        return;
      }

      if (prevSelectedVerse.current !== currentVerse) {
        await jumpToVerse(currentVerse);
        prevSelectedVerse.current = currentVerse;
        userInteractedRef.current = false;
        pendingVerseSeekRef.current = null;
      }
    };

    handleVerseChange();
  }, [
    selectedBook,
    selectedVerse,
    selectedChapter,
    jumpToVerse,
    isPlayerReady,
    isManualVerseSelection,
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
          autoplay: true,
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
        if (pendingVerseSeekRef.current !== null) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          await jumpToVerse(pendingVerseSeekRef.current);
          pendingVerseSeekRef.current = null;
        }
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      const clickedOutsideSettings =
        containerRef.current && !containerRef.current.contains(target);

      const clickedOutsideShare =
        shareRef.current && !shareRef.current.contains(target);

      const clickedOutsideDownload =
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(target);

      const clickedOnShareButton =
        shareButtonRef.current && shareButtonRef.current.contains(target);

      const clickedOutsidePlayback =
        playbackRef.current && !playbackRef.current.contains(target);
      const clickedOnChapterChevron = (target as Element)?.closest(
        'button[title*="Chapter"]'
      );

      if (
        showPlaybackDrawer &&
        (clickedOutsidePlayback || clickedOnChapterChevron)
      ) {
        setShowPlaybackDrawer(false);
      }

      const clickedOnSettingsButton =
        settingsButtonRef.current && settingsButtonRef.current.contains(target);

      const clickedOnChevronButton = (target as Element)?.closest(
        'button[title*="Chapter"]'
      );

      if (
        (showSettingsMenu || showQualityDrawer) &&
        (clickedOutsideSettings || clickedOnChapterChevron)
      ) {
        setShowSettingsMenu(false);
        setShowQualityDrawer(false);
        skipNextClickRef.current = true;
      }

      if (
        showShare &&
        (clickedOutsideShare || clickedOnChapterChevron) &&
        !clickedOnShareButton
      ) {
        setShowShare(false);
      }

      if (
        showDownloadDropdown &&
        (clickedOutsideDownload ||
          clickedOnShareButton ||
          clickedOnSettingsButton ||
          clickedOnChevronButton)
      ) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showSettingsMenu, showQualityDrawer, showShare, showDownloadDropdown]);

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
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (isCurrentlyFullscreen !== isFullscreen) {
        setIsFullscreen(isCurrentlyFullscreen);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

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
          isManualSeekingRef.current = true;
          clearIntervals();
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
            if (newCurrentVerse && newCurrentVerse !== currentPlayingVerse) {
              setCurrentPlayingVerse(newCurrentVerse);
              const verseStr = newCurrentVerse.toString();
              const verseValue = ["Intro", "0"].includes(verseStr)
                ? 0
                : verseStr.includes("-")
                ? parseInt(verseStr.split("-")[0])
                : parseInt(verseStr) || 0;

              setVerse({
                value: verseValue,
                label: verseStr,
              });
              prevSelectedVerse.current = verseValue;
            }
          }
          setTimeout(() => {
            isManualSeekingRef.current = false;
            if (isPlaying && !isEnded) {
              setupIntervals();
            }
          }, 300);
          break;
        }
        case "ArrowRight": {
          isManualSeekingRef.current = true;
          clearIntervals();
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
            if (newCurrentVerse && newCurrentVerse !== currentPlayingVerse) {
              setCurrentPlayingVerse(newCurrentVerse);
              const verseStr = newCurrentVerse.toString();
              const verseValue = ["Intro", "0"].includes(verseStr)
                ? 0
                : verseStr.includes("-")
                ? parseInt(verseStr.split("-")[0])
                : parseInt(verseStr) || 0;

              setVerse({
                value: verseValue,
                label: verseStr,
              });
              prevSelectedVerse.current = verseValue;
            }
          }
          setTimeout(() => {
            isManualSeekingRef.current = false;
            if (isPlaying && !isEnded) {
              setupIntervals();
            }
          }, 300);
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
    setupIntervals,
    clearIntervals,
  ]);

  // Setup global mouse events for seek bar dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && seekBarRef.current && isVideoAvailable) {
        handleSeekPosition(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && seekBarRef.current && isVideoAvailable) {
        const touch = e.touches[0];
        const touchX = touch.clientX;
        handleSeekPosition(touchX);
        const rect = seekBarRef.current.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (touchX - rect.left) / rect.width)
        );
        const time = percent * duration;

        setHoverTime(time);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setTimeout(() => {
          isManualSeekingRef.current = false;
          if (isPlaying && !isEnded) {
            setupIntervals();
            setControlsHideTimeout();
          }
        }, 500);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setHoverTime(null);
        setControlsHideTimeout();
        setTimeout(() => {
          isManualSeekingRef.current = false;
          if (isPlaying && !isEnded) {
            setupIntervals();
          }
        }, 500);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
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
      if (
        (deviceType === "mobile" || deviceType === "tablet") &&
        !isDraggingRef.current
      ) {
        setControlsHideTimeout();
      }
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
    if (
      showShare ||
      showSettingsMenu ||
      showQualityDrawer ||
      showPlaybackDrawer
    ) {
      return;
    }

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      if (
        isPlayerReady &&
        selectedVerse &&
        selectedVerse.value !== 0 &&
        !isManualSeekingRef.current &&
        !userInteractedRef.current &&
        currentTime === 0
      ) {
        jumpToVerse(selectedVerse.value).then(() => {
          vimeoPlayerRef.current?.play();
        });
      } else {
        vimeoPlayerRef.current.play();
      }
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
      const verseStr = newCurrentVerse.toString();
      const verseValue = ["Intro", "0"].includes(verseStr)
        ? 0
        : verseStr.includes("-")
        ? parseInt(verseStr.split("-")[0])
        : parseInt(verseStr) || 0;
      setVerse({
        value: verseValue,
        label: verseStr,
      });

      prevSelectedVerse.current = verseValue;
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
      hideControlsIfTouch();
    }
  };

  const handleSeekMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (isVideoAvailable) {
      isDraggingRef.current = true;
      isManualSeekingRef.current = true;
      userInteractedRef.current = true;
      setShowControls(true);
      clearControlsTimeout();
    }
  };

  const handleSeekTouchStart = (event: React.TouchEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (isVideoAvailable) {
      isDraggingRef.current = true;
      isManualSeekingRef.current = true;
      userInteractedRef.current = true;
      setShowControls(true);
      clearControlsTimeout();
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

    const verseStr = verse.verse.toString();
    const verseValue = ["Intro", "0"].includes(verseStr)
      ? 0
      : verseStr.includes("-")
      ? parseInt(verseStr.split("-")[0])
      : parseInt(verseStr) || 0;

    setVerse({
      value: verseValue,
      label: verseStr,
    });

    prevSelectedVerse.current = verseValue;

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
    setTimeout(() => {
      isManualSeekingRef.current = false;
      hideControlsIfTouch();
    }, 500);
  };

  const handleDoubleTapSeek = async (direction: "forward" | "backward") => {
    if (!vimeoPlayerRef.current || !isPlayerReady || !isVideoAvailable) return;

    if (isManualSeekingRef.current) return;

    userInteractedRef.current = true;
    isManualSeekingRef.current = true;

    clearIntervals();

    const seekSeconds = 10;

    try {
      const currentTime = await vimeoPlayerRef.current.getCurrentTime();
      const newTime =
        direction === "forward"
          ? Math.min(duration, currentTime + seekSeconds)
          : Math.max(0, currentTime - seekSeconds);
      if (
        (direction === "backward" && (currentTime <= 5 || currentTime === 0)) ||
        (direction === "forward" && (currentTime >= duration - 5 || isEnded))
      ) {
        isManualSeekingRef.current = false;
        return;
      }

      setShowSeekFeedback({ show: true, direction, seconds: seekSeconds });
      setTimeout(() => {
        setShowSeekFeedback({ show: false, direction, seconds: 10 });
      }, 700);
      await vimeoPlayerRef.current.setCurrentTime(newTime);
      setCurrentTime(newTime);

      if (bibleVerseMarker?.length) {
        const newCurrentVerse = getCurrentVerseFromTime(newTime);
        if (newCurrentVerse && newCurrentVerse !== currentPlayingVerse) {
          setCurrentPlayingVerse(newCurrentVerse);
          const verseStr = newCurrentVerse.toString();
          const verseValue = ["Intro", "0"].includes(verseStr)
            ? 0
            : verseStr.includes("-")
            ? parseInt(verseStr.split("-")[0])
            : parseInt(verseStr) || 0;

          setVerse({
            value: verseValue,
            label: verseStr,
          });
          prevSelectedVerse.current = verseValue;
        }
      }

      // Reset ended state if seeking
      if (isEnded) {
        setIsEnded(false);
      }
    } catch (error) {
      console.error("Error seeking video:", error);
    } finally {
      setTimeout(() => {
        isManualSeekingRef.current = false;
        skipNextClickRef.current = false;
        if (isPlaying && !isEnded) {
          setupIntervals();
        }
      }, 500);
    }
  };

  const handleDoubleTapTouch = (e: React.TouchEvent) => {
    const target = e.target;
    const isControlButton =
      (target as Element)?.closest("button") ||
      (target as Element)?.closest('[role="button"]');
    if (isControlButton) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;

    if (timeDiff < 300) {
      if (singleClickTimeoutRef.current) {
        clearTimeout(singleClickTimeoutRef.current);
        singleClickTimeoutRef.current = null;
      }
      isDoubleTapRef.current = true;
      const touch = e.changedTouches[0];
      const rect = playerContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const tapX = touch.clientX - rect.left;
      const direction = tapX < rect.width / 2 ? "backward" : "forward";

      skipNextClickRef.current = true;

      handleDoubleTapSeek(direction);
      lastTapRef.current = 0;
      setTimeout(() => {
        isDoubleTapRef.current = false;
        skipNextClickRef.current = false;
      }, 800);
    } else {
      lastTapRef.current = now;
      isDoubleTapRef.current = false;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }

    const rect = playerContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tapX = e.clientX - rect.left;
    const direction = tapX < rect.width / 2 ? "backward" : "forward";

    skipNextClickRef.current = true;

    handleDoubleTapSeek(direction);

    setTimeout(() => {
      skipNextClickRef.current = false;
      isDoubleTapRef.current = false;
    }, 800);
  };

  const handlePlayerClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (
      skipNextClickRef.current ||
      isManualSeekingRef.current ||
      isDoubleTapRef.current
    ) {
      return;
    }
    const target = e.target;
    const isControlButton =
      (target as Element)?.closest("button") ||
      (target as Element)?.closest('[role="button"]');
    if (isControlButton) {
      return;
    }
    const clickedInsideDrawer =
      containerRef.current?.contains(e.target as Node) ?? false;

    if (!clickedInsideDrawer && isVideoAvailable) {
      singleClickTimeoutRef.current = window.setTimeout(() => {
        if (!skipNextClickRef.current && !isDoubleTapRef.current) {
          if (!showControls) {
            setShowControls(true);
          } else {
            togglePlay();
          }
          if (isPlaying && !isEnded) {
            setControlsHideTimeout();
          }
        }
        singleClickTimeoutRef.current = null;
      }, 200);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log("event", e);
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTimeRef.current;

    const target = e.target;
    const isControlButton =
      (target as Element)?.closest("button") ||
      (target as Element)?.closest('[role="button"]');
    if (isControlButton) {
      return;
    }

    if (touchDuration < 500) {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;

      if (timeDiff < 300) {
        e.preventDefault();
        e.stopPropagation();
        handleDoubleTapTouch(e);
      } else {
        lastTapRef.current = now;
        setTimeout(() => {
          if (!isDoubleTapRef.current && !skipNextClickRef.current) {
            handlePlayerClick(e);
          }
        }, 300);
      }
    }
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

      const verseStr = nextVerse.verse.toString();
      const verseValue = ["Intro", "0"].includes(verseStr)
        ? 0
        : verseStr.includes("-")
        ? parseInt(verseStr.split("-")[0])
        : parseInt(verseStr) || 0;
      setVerse({
        value: verseValue,
        label: verseStr,
      });

      prevSelectedVerse.current = verseValue;

      if (isEnded) {
        setIsEnded(false);
      }
      setTimeout(() => {
        isManualSeekingRef.current = false;
        hideControlsIfTouch();
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

  const handleFetchDownloadLinks = async () => {
    if (showDownloadDropdown) {
      setShowDownloadDropdown(false);
      return;
    }

    if (downloadOptions.length > 0) {
      setShowDownloadDropdown(true);
      return;
    }

    try {
      const result = await getDownloadOptions(currentVideoId);
      setDownloadOptions(result.options || []);
      setShowDownloadDropdown(true);
    } catch (err) {
      console.error("Failed to fetch download links:", err);
    }
  };

  const handleDownloadVideo = async (option: any) => {
    try {
      const filename = `${selectedBook?.label || "video"}_Chapter_${
        selectedChapter?.label || "1"
      }_${option.quality}.${option.format || "mp4"}`;
      setShowDownloadDropdown(false);
      await downloadVideo(option.link, filename);
    } catch (err) {
      console.error("Download failed:", err);
    }
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

  const hideControlsIfTouch = () => {
    if (
      (deviceType === "mobile" || deviceType === "tablet") &&
      isPlaying &&
      !isEnded &&
      !showDownloadDropdown &&
      !showPlaybackDrawer &&
      !showQualityDrawer &&
      !showSettingsMenu &&
      !showShare
    ) {
      setControlsHideTimeout();
    }
  };

  const getVideoContainerStyles = (): React.CSSProperties => {
    if (!isFullscreen) return {};

    const viewportWidth = getViewportWidth();
    const viewportHeight = getViewportHeight();

    if (
      deviceType === "mobile" &&
      viewportWidth > viewportHeight &&
      viewportWidth < 640
    ) {
      // Calculate available space considering safe areas
      const availableHeight =
        viewportHeight -
        (parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "env(safe-area-inset-top)"
          ) || "0"
        ) +
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "env(safe-area-inset-bottom)"
            ) || "0"
          ));

      const availableWidth =
        viewportWidth -
        (parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "env(safe-area-inset-left)"
          ) || "0"
        ) +
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "env(safe-area-inset-right)"
            ) || "0"
          ));

      return {
        width: availableWidth,
        height: availableHeight,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      };
    }

    return {};
  };

  // Calculate progress as percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const SeekFeedbackOverlay = () => {
    if (!showSeekFeedback.show) return null;

    const getPositionClasses = () => {
      const isMobile = deviceType === "mobile";
      const baseClasses = "flex items-center justify-center";

      if (isMobile) {
        return showSeekFeedback.direction === "forward"
          ? `${baseClasses} ml-auto mr-20 mb-4`
          : `${baseClasses} mr-auto ml-20 mb-4`;
      } else {
        return showSeekFeedback.direction === "forward"
          ? `${baseClasses} ml-auto mr-50 mb-4`
          : `${baseClasses} mr-auto ml-50 mb-4`;
      }
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className={getPositionClasses()}>
          <div className="flex flex-col items-center">
            <div className="mb-1 sm:mb-2">
              {showSeekFeedback.direction === "backward" ? (
                <FilledSkipBackIcon
                  className={`text-white drop-shadow-lg ${
                    deviceType === "mobile" ? "w-8 h-8" : "w-12 h-12"
                  } `}
                />
              ) : (
                <FilledSkipForwardIcon
                  className={`text-white drop-shadow-lg ${
                    deviceType === "mobile" ? "w-8 h-8" : "w-12 h-12"
                  } `}
                />
              )}
            </div>
            <div className="text-white font-bold text-base sm:text-lg drop-shadow-lg">
              {showSeekFeedback.seconds}s
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSeekbarTooltip = () => {
    if (hoverTime === null || duration === 0 || !seekBarRef.current)
      return null;

    const currentVerse = getCurrentVerseFromTime(hoverTime);
    const verseText = currentVerse ? `Verse ${currentVerse}` : "Intro";
    const tooltipText = `${verseText} - ${formatTime(hoverTime)}`;

    const seekbarRect = seekBarRef.current.getBoundingClientRect();
    const seekbarWidth = seekbarRect.width;

    const hoverX = (hoverTime / duration) * seekbarWidth;

    const halfTooltip = tooltipWidth / 2;
    const leftPx = Math.max(
      0,
      Math.min(hoverX - halfTooltip, seekbarWidth - tooltipWidth)
    );
    const leftPercent = (leftPx / seekbarWidth) * 100;

    const arrowOffsetFromTooltipLeft = hoverX - leftPx;
    const clampedArrow = Math.max(
      8,
      Math.min(tooltipWidth - 8, arrowOffsetFromTooltipLeft)
    );

    return (
      <div
        ref={tooltipRef}
        className="absolute bottom-full mb-2 px-2 py-1 text-sm rounded bg-black text-white whitespace-nowrap z-50"
        style={{
          left: `${leftPercent}%`,
          transform: "translateX(0%)",
          maxWidth: "200px",
        }}
      >
        {tooltipText}
        <div
          className="w-2 h-2 bg-black rotate-45 absolute -bottom-1"
          style={{
            left: `${clampedArrow}px`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
    );
  };

  return (
    <div className="w-full mx-auto my-auto">
      <div className="flex items-end justify-center gap-2 w-full">
        <div
          ref={playerContainerRef}
          className={`video-player-container relative w-full ${
            shouldUseMobileBottomBar || textPosition === "below"
              ? "max-w-6xl"
              : "max-w-7xl"
          } mx-auto overflow-hidden ${
            isFullscreen &&
            (shouldUseMobileBottomBar ||
              ["tablet", "laptop"].includes(deviceType))
              ? "h-screen flex flex-col justify-center bg-black"
              : ""
          }`}
          style={{
            aspectRatio: "16/9",
            maxHeight:
              isFullscreen &&
              (shouldUseMobileBottomBar ||
                ["tablet", "laptop"].includes(deviceType))
                ? "100vh"
                : "80vh",
            touchAction: "manipulation",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => {
            e.preventDefault();
            if (showControls) {
              setShowControls(false);
              clearControlsTimeout();
            }
            if (!skipNextClickRef.current && !isDoubleTapRef.current) {
              handlePlayerClick(e);
            }
          }}
        >
          {(isVideoLoading || !isPlayerReady) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-spin mb-2 sm:mb-4" />
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
                  (shouldUseMobileBottomBar ||
                    ["tablet", "laptop"].includes(deviceType))
                    ? "relative mx-auto bg-black overflow-hidden"
                    : "w-full h-full"
                }`}
                style={{
                  ...getVideoContainerStyles(),
                  ...(isFullscreen || shouldUseMobileBottomBar
                    ? {
                        aspectRatio: "16/9",
                        maxHeight: "100vh",
                        width: isSmallerScreen ? "80%" : "100%",
                      }
                    : {}),
                }}
              >
                <div className="w-full h-full">
                  <div ref={playerRef} className="w-full h-full" />
                </div>

                <SeekFeedbackOverlay />

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
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto
                      ${
                        isFullscreen && deviceType === "mobile"
                          ? "p-2 pb-safe-bottom"
                          : "p-2 md:p-4"
                      }`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={handleControlsMouseEnter}
                    onMouseLeave={handleControlsMouseLeave}
                  >
                    {/* Seekbar with sections */}
                    <div
                      ref={seekBarRef}
                      className="relative h-1 bg-gray-600 rounded-full px-2 ml-0.5 mb-1 md:mb-2 cursor-pointer"
                      onClick={(e) => {
                        if (!showControls) {
                          setShowControls(true);
                          return;
                        }
                        handleSeekClick(e);
                      }}
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
                    >
                      {renderSeekbarTooltip()}

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
                              onClick={(e) => {
                                if (!showControls) {
                                  setShowControls(true);
                                  return;
                                }
                                handleVerseMarkerClick(verse, e);
                              }}
                              data-tooltip={`Verse ${
                                verse.verse
                              } - ${formatTime(verseTimeInSeconds)}`}
                            ></div>
                          );
                        })}
                      {/* Current Time Indicator */}
                      <div
                        className="absolute top-0 w-10 h-10 z-30 flex items-center justify-center -mt-4.5"
                        style={{
                          left: `${progressPercent}%`,
                          transform: "translateX(-50%)",
                          touchAction: "none",
                        }}
                        onMouseDown={handleSeekMouseDown}
                        onTouchStart={handleSeekTouchStart}
                      >
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full cursor-grab" />
                      </div>
                    </div>
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Play/Pause/Replay Button */}
                        {(bibleVerseMarker?.length ?? 0) > 0 &&
                          !selectedChapter?.label.includes("Intro") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!showControls) {
                                  setShowControls(true);
                                  clearControlsTimeout();
                                  return;
                                }
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
                            if (!showControls) {
                              setShowControls(true);
                              clearControlsTimeout();
                              return;
                            }
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
                                if (!showControls) {
                                  setShowControls(true);
                                  clearControlsTimeout();
                                  return;
                                }
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
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!showControls) {
                                setShowControls(true);
                                clearControlsTimeout();
                                return;
                              }
                              if (
                                showSettingsMenu ||
                                showShare ||
                                showQualityDrawer
                              ) {
                                setShowSettingsMenu(false);
                                setShowShare(false);
                                setShowQualityDrawer(false);
                              }
                              handleFetchDownloadLinks();
                            }}
                            disabled={loading || !currentVideoId}
                            className="text-white hover:text-blue-400"
                            title="Download Video"
                          >
                            {loading ? (
                              <Loader className="animate-spin" size={24} />
                            ) : (
                              <Download strokeWidth={2.5} size={24} />
                            )}
                          </button>

                          {/* Download Dropdown */}
                          {showDownloadDropdown && (
                            <div
                              className="absolute bottom-full right-0 bg-black border border-gray-600 rounded-lg shadow-lg min-w-50 max-w-80 z-50"
                              ref={downloadDropdownRef}
                            >
                              <div className="p-3">
                                <div className="text-white font-semibold mb-2 border-b border-gray-600 pb-2">
                                  Download Options
                                </div>

                                {downloadOptions.length === 0 ? (
                                  <div className="text-gray-400 text-sm py-2">
                                    No download options available
                                  </div>
                                ) : (
                                  <div className="space-y-1 max-h-25 md:max-h-60 overflow-y-auto custom-scroll-ultra-thin">
                                    {downloadOptions.map(
                                      (
                                        option: {
                                          quality: string;
                                          width?: number;
                                          height?: number;
                                          format?: string;
                                        },
                                        index
                                      ) => (
                                        <button
                                          key={index}
                                          onClick={() =>
                                            handleDownloadVideo(option)
                                          }
                                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-between"
                                        >
                                          <div className="font-medium flex flex-col">
                                            <span>
                                              {option.quality || "Unknown"}
                                              {option.width &&
                                                option.height && (
                                                  <span className="text-gray-400 ml-1">
                                                    ({option.width}×
                                                    {option.height})
                                                  </span>
                                                )}
                                            </span>
                                            <span>
                                              {option.format?.toUpperCase() ||
                                                "MP4"}
                                            </span>
                                          </div>
                                          <Download size={16} />
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}

                                {error && (
                                  <div className="text-red-400 text-xs mt-2 p-2 bg-red-900/20 rounded">
                                    {error}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (!showControls) {
                                setShowControls(true);
                                clearControlsTimeout();
                                return;
                              }
                              if (showPlaybackDrawer) {
                                setShowPlaybackDrawer(false);
                              }

                              // Only skip if share popup is currently open and we flagged to skip

                              if (
                                showSettingsMenu ||
                                showQualityDrawer ||
                                showDownloadDropdown
                              ) {
                                setShowSettingsMenu(false);
                                setShowQualityDrawer(false);
                                setShowDownloadDropdown(false);

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
                                if (!showControls) {
                                  setShowControls(true);
                                  clearControlsTimeout();
                                  return;
                                }
                                if (showShare || showDownloadDropdown) {
                                  setShowShare(false);
                                  setShowDownloadDropdown(false);
                                  setShowSettingsMenu(true);
                                } else if (
                                  showSettingsMenu &&
                                  !showQualityDrawer
                                ) {
                                  setShowSettingsMenu(false);
                                } else if (showQualityDrawer) {
                                  setShowSettingsMenu(false);
                                  setShowQualityDrawer(false);
                                } else if (showPlaybackDrawer) {
                                  setShowSettingsMenu(false);
                                  setShowPlaybackDrawer(false);
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
                            onOpenPlaybackDrawer={() => {
                              setShowSettingsMenu(false);
                              setShowPlaybackDrawer(true);
                            }}
                            playbackSpeed={playbackSpeed}
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
                          <PlaybackDrawer
                            ref={playbackRef}
                            isVisible={showPlaybackDrawer}
                            onClose={() => setShowPlaybackDrawer(false)}
                            playbackSpeed={playbackSpeed}
                            onChangeSpeed={async (speed) => {
                              if (vimeoPlayerRef.current) {
                                await vimeoPlayerRef.current.setPlaybackRate(
                                  speed
                                );
                              }
                              setPlaybackSpeed(speed);
                            }}
                            onBackToSettings={handleChangeQuality}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.stopPropagation();
                            if (!showControls) {
                              setShowControls(true);
                              clearControlsTimeout();
                              return;
                            }
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
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
