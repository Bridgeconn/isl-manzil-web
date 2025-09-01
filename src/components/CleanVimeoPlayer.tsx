import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

const CleanVimeoPlayer = () => {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    const player = new Player(playerRef.current, {
      id: 1105756880,
      controls: true,
      title: false,
      byline: false,
      portrait: false,
      autoplay: true,
      responsive: true,
    });

    return () => {
      (async () => {
        try {
          await player.destroy();
        } catch (err) {
          console.error("Destroy failed", err);
        }
      })();
    };
  }, []);

  return (
    <div className="w-full ">
      <div
        ref={playerRef}
        className="aspect-w-16 aspect-h-9  h-[200px] sm:h-[400px] md:h-[500px]"
      />
    </div>
  );
};

export default CleanVimeoPlayer;
