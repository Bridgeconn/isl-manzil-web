import React, { useEffect, useRef } from "react";

interface LoopingGifProps {
  src: string;
  alt: string;
  className?: string;
  duration?: number;
  loopCount?: number;
}

const LoopingGif: React.FC<LoopingGifProps> = ({
  src,
  alt,
  className = "",
  duration = 3000,
  loopCount = Infinity,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loopCountRef = useRef(0);

  const restartGif = () => {
    const img = imgRef.current;
    if (!img) return;
    const originalSrc = img.src;
    img.src = "";
    img.src = originalSrc;
  };

  useEffect(() => {
    loopCountRef.current = 0;
    restartGif();

    intervalRef.current = setInterval(() => {
      loopCountRef.current++;
      if (loopCount === Infinity || loopCountRef.current < loopCount) {
        restartGif();
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, duration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [src]);

  return <img ref={imgRef} src={src} alt={alt} className={className} />;
};

export default LoopingGif;
