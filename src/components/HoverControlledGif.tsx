import React, { useEffect, useRef, useState } from "react";

interface HoverControlledGifProps {
  src: string;
  alt: string;
  className?: string;
  duration?: number;
  loopCount?: number;
  hover?: boolean;
}

const HoverControlledGif: React.FC<HoverControlledGifProps> = ({
  src,
  alt,
  className = "",
  duration = 3000,
  loopCount = Infinity,
  hover = false,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loopCountRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const restartGif = () => {
    const img = imgRef.current;
    if (!img) return;
    const originalSrc = img.src;
    img.src = "";
    img.src = originalSrc;
  };

  const startLooping = () => {
    if (intervalRef.current) return;
    loopCountRef.current = 0;
    restartGif();

    intervalRef.current = setInterval(() => {
      loopCountRef.current++;
      if (loopCount === Infinity || loopCountRef.current < loopCount) {
        restartGif();
      } else {
        stopLooping();
      }
    }, duration);
  };

  const stopLooping = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    loopCountRef.current = 0;
  };

  useEffect(() => {
    if (hover) {
      if (isHovered) {
        startLooping();
      } else {
        stopLooping();
      }
    }
  }, [isHovered, hover]);

  useEffect(() => {
    if (!hover) {
      startLooping();
    }

    return () => stopLooping();
  }, [src, hover]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      onMouseEnter={hover ? () => setIsHovered(true) : undefined}
      onMouseLeave={hover ? () => setIsHovered(false) : undefined}
    />
  );
};

export default HoverControlledGif;
