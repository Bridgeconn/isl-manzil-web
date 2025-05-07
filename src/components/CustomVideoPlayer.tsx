import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const bibleVerses = [
  {
    id: 0,
    time: "0:00",
    title: "Titus Chapter 01",
    description: "Paul explains Titus's Responsibility in Crete Island",
  },
  {
    id: 1,
    time: "0:17",
    title: "Verse 01",
    description:
      "Greetings from Paul, a servant belonging to God and an apostle sent out by Jesus Christ...",
  },
  {
    id: 2,
    time: "1:14",
    title: "Verse 02",
    description: "And then they can expect to live with God forever...",
  },
  {
    id: 3,
    time: "1:46",
    title: "Verse 03",
    description: "At the right time, he made that Good News known...",
  },
  {
    id: 4,
    time: "2:06",
    title: "Verse 04",
    description: "I write to you, Titus...",
  },
  {
    id: 5,
    time: "2:37",
    title: "Verse 05",
    description: "I left you there in Crete...",
  },
  {
    id: 6,
    time: "3:19",
    title: "Verse 06",
    description: "Look for someone who is not known for doing wrong...",
  },
  {
    id: 7,
    time: "3:53",
    title: "Verse 07",
    description: "Every elder has the duty of taking care of God's work...",
  },
  {
    id: 8,
    time: "4:35",
    title: "Verse 08",
    description: "An elder must be a person who welcomes people...",
  },
  {
    id: 9,
    time: "5:14",
    title: "Verse 09",
    description: "He must be faithful to the same true message...",
  },
  {
    id: 10,
    time: "5:55",
    title: "Verse 10",
    description: "That kind of teaching is important...",
  },
  {
    id: 11,
    time: "6:23",
    title: "Verse 11",
    description: "You must stop these people...",
  },
  {
    id: 12,
    time: "6:49",
    title: "Verse 12",
    description: "Even one of their own people...",
  },
  {
    id: 13,
    time: "7:19",
    title: "Verse 13",
    description: "And every word he said is true...",
  },
  {
    id: 14,
    time: "7:47",
    title: "Verse 14",
    description: "Then they will stop paying attention...",
  },
  {
    id: 15,
    time: "8:19",
    title: "Verse 15",
    description: "To people whose thinking is pure...",
  },
  {
    id: 16,
    time: "8:52",
    title: "Verse 16",
    description: "They say they know God...",
  },
];

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

  const videoId = "pcaZRtDZtaU";

  const timeToSeconds = (timeStr) => {
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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    // Include hours only if needed
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
  };

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
        cc_load_policy: 1, // Show closed captions by default (important for deaf users)
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

  const onPlayerStateChange = (event: { data: number }) => {
    // YT.PlayerState values: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2)
    if (event.data === 0) {
      // ENDED
      setIsPlaying(false);
      setShowControls(true);
    } else if (event.data === 1) {
      // PLAYING
      setIsPlaying(true);
    } else if (event.data === 2) {
      // PAUSED
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  const onPlayerError = (event: { data: number }) => {
    console.error("YouTube Player Error:", event.data);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!ytPlayerRef.current) return;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      ytPlayerRef.current.playVideo();
    } else {
      ytPlayerRef.current.pauseVideo();
    }

    setIsPlaying(newIsPlaying);

    // Show play/pause bezel effect
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
  };

  const handleVerseMarkerClick = (verse, event) => {
    event.stopPropagation();
    if (!ytPlayerRef.current) return;

    const seekTime = timeToSeconds(verse.time);

    ytPlayerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  // Calculate progress as percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() =>
        isPlaying && setTimeout(() => setShowControls(false), 2000)
      }
    >
      {/* YouTube Player Container */}
      <div className="w-full h-full">
        {/* This div will be replaced by the YouTube iframe */}
        <div ref={playerRef} className="w-full h-full" />
      </div>

      <div className="absolute top-0 right-0 bg-black bg-opacity-50 p-2 text-xs text-white">
        Playing: youtube.com/watch?v={videoId}
      </div>

      {/* Play/Pause Bezel Effect */}
      {showPlayBezel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black bg-opacity-50 rounded-full p-6">
            {isPlaying ? (
              <Pause size={48} className="text-white" />
            ) : (
              <Play size={48} className="text-white" />
            )}
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        } z-20`}
      >
        {/* Bottom Controls */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seekbar with chapters */}
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

            {bibleVerses.map((verse) => {
              const verseTimeInSeconds = timeToSeconds(verse.time);
              const versePosition = (verseTimeInSeconds / duration) * 100;

              return (
                <div
                  key={verse.id}
                  className="absolute top-0 w-3 h-3 bg-yellow-400 border border-white rounded-full cursor-pointer z-10"
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
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
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
