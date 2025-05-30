import { useState, useRef, useEffect } from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import { bibleVerses, VerseData } from "../assets/data/bibleVersesSample";

const CustomVideoPlayer = () => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  const [showControls, setShowControls] = useState(true);
  const [showPlayBezel, setShowPlayBezel] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showYouTubeControls, setShowYouTubeControls] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [lastAction, setLastAction] = useState<
    "play" | "pause" | "replay" | null
  >(null);

  // Load YouTube API and create player
  useEffect(() => {
    // Only load the API once
    if (window.YT) {
      initializeYouTubePlayer();
      return;
    }

    // Create script tag for YouTube API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Define the callback function that YouTube API will call when ready
    window.onYouTubeIframeAPIReady = initializeYouTubePlayer;

    return () => {
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }
      // Reset callback to an empty function instead of null to avoid type errors
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  useEffect(() => {
    if (!ytPlayerRef.current) return;

    try {
      // Get all iframes in the player container
      const iframe = playerContainerRef.current?.querySelector("iframe");
      if (iframe) {
        // When showing YouTube controls, we need to make sure our overlay doesn't block interaction
        if (showYouTubeControls) {
          iframe.style.zIndex = "30"; // Put iframe above custom controls
        } else {
          iframe.style.zIndex = "10"; // Put iframe below custom controls
        }
      }
    } catch (error) {
      console.error("Error adjusting iframe z-index:", error);
    }
  }, [showYouTubeControls]);

  const videoId = "pcaZRtDZtaU";

  // Intiialize Youtube player with videoId and player options
  const initializeYouTubePlayer = () => {
    if (!playerRef.current || ytPlayerRef.current) return;

    // Make sure YT API is loaded
    if (!window.YT || !window.YT.Player) {
      console.error("YouTube API not loaded");
      return;
    }

    ytPlayerRef.current = new window.YT.Player(playerRef.current, {
      videoId: videoId,
      playerVars: {
        controls: 0, // Hide YouTube controls - important!
        modestbranding: 1, // Minimal YouTube branding
        rel: 1, // Show related videos
        showinfo: 1, // Show video info
        fs: 0, // Hide fullscreen button
        cc_load_policy: 1, // Show closed captions by default
        iv_load_policy: 1, // Show annotations
        autohide: 0, // Show controls when paused
        playsinline: 1, // Play inline on mobile
        origin: window.location.origin,
        widget_referrer: window.location.href,
        enablejsapi: 1, // Enable JS API
        disablekb: 0, // Enable keyboard controls
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  };

  // Handle player ready event
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setDuration(event.target.getDuration());

    event.target.mute();

    // Start interval to update current time
    updateIntervalRef.current = window.setInterval(() => {
      if (ytPlayerRef.current) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
    }, 500);
  };

  // Handle youtube player state changes along with custom controls state changes
  const onPlayerStateChange = (event: { data: number }) => {
    // YT.PlayerState values: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2)
    if (event.data === 0) {
      // ENDED
      setIsPlaying(false);
      setShowControls(true);
      setIsEnded(true);
      setShowYouTubeControls(false);
    } else if (event.data === 1) {
      // PLAYING
      setIsPlaying(true);
      setIsEnded(false);
      setShowYouTubeControls(false);
    } else if (event.data === 2) {
      // PAUSED
      setIsPlaying(false);
      setShowControls(true);
      setShowYouTubeControls(true);
    }
  };

  const onPlayerError = (event: { data: number }) => {
    console.error("YouTube Player Error:", event.data);
  };

  const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;

    const parts = timeStr.split(":");

    // Handle hours:minutes:seconds format (hh:mm:ss)
    if (parts.length === 3) {
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

    // Include hours only if needed
    if (hours > 0) {
      return `${padTime(hours)}:${padTime(mins)}:${padTime(secs)}`;
    } else {
      return `${padTime(mins)}:${padTime(secs)}`;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!ytPlayerRef.current) return;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      ytPlayerRef.current.playVideo();
      setShowYouTubeControls(false);
      setIsEnded(false);
      setLastAction("play");
    } else {
      ytPlayerRef.current.pauseVideo();
      setShowYouTubeControls(true);
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
    if (!ytPlayerRef.current) return;

    ytPlayerRef.current.seekTo(0, true);
    ytPlayerRef.current.playVideo();

    setCurrentTime(0);
    setIsPlaying(true);
    setIsEnded(false);
    setShowYouTubeControls(false);
    setLastAction("replay");

    // Show replay bezel effect
    setShowPlayBezel(true);
    setTimeout(() => setShowPlayBezel(false), 800);
  };

  // Handle seeking in the video
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ytPlayerRef.current || !seekBarRef.current) return;
    event.stopPropagation();

    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const seekPos = offsetX / rect.width;
    const seekTime = seekPos * duration;

    ytPlayerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  // Handle verse marker click
  const handleVerseMarkerClick = (
    verse: VerseData,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (!ytPlayerRef.current) return;

    const seekTime = timeToSeconds(verse.time);

    ytPlayerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);

    // If video was ended, update state
    if (isEnded) {
      setIsEnded(false);
    }
  };

  // Calculate progress as percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full sm:w-3/4 mx-auto bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={() => !showYouTubeControls && setShowControls(true)}
      onMouseLeave={() =>
        isPlaying &&
        !showYouTubeControls &&
        !isEnded &&
        setTimeout(() => setShowControls(false), 2000)
      }
      onClick={togglePlay}
    >
      {/* YouTube Player Container */}
      <div className="w-full h-full">
        {/* This div will be replaced by the YouTube iframe */}
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
      {isEnded && !showYouTubeControls && (
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

      {/* Controls Overlay - Always show our custom controls */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          (showControls && !showYouTubeControls) || isEnded
            ? "opacity-100"
            : "opacity-0"
        } ${
          showYouTubeControls ? "pointer-events-none" : "pointer-events-auto"
        } z-20`}
        style={{ display: showYouTubeControls ? "none" : "block" }}
      >
        {/* Bottom Controls */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seekbar with sections */}
          <div
            ref={seekBarRef}
            className="relative h-3 bg-gray-600 rounded-full mb-4 cursor-pointer"
            onClick={handleSeek}
          >
            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 h-3 bg-blue-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>

            {bibleVerses.map((verse: VerseData) => {
              const verseTimeInSeconds = timeToSeconds(verse.time);
              const versePosition = (verseTimeInSeconds / duration) * 100;
              const isPassed = currentTime >= verseTimeInSeconds;
              return (
                <div
                  key={verse.id}
                  className={`absolute top-0 w-3 h-3 ${
                    isPassed ? "bg-yellow-400" : "bg-white"
                  } border border-white rounded-full cursor-pointer z-10 transition-colors duration-200`}
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
              className="absolute top-0 w-3 h-3 bg-white rounded-full cursor-grab z-20"
              style={{
                left: `${progressPercent}%`,
                transform: "translateX(-50%)",
              }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
