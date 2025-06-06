import { useEffect, useRef, useState } from "react";

const HoverControlledGif = ({ 
  src, 
  className, 
  alt, 
  duration = 3000,
  loopCount = 3 
}: {
  src: string, 
  className: string, 
  alt: string, 
  duration?: number,
  loopCount?: number
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loopCountRef = useRef(0);

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
      if (loopCountRef.current < loopCount) {
        restartGif();
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
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
    if (isHovered) {
      startLooping();
    } else {
      stopLooping();
    }

    return () => stopLooping();
  }, [isHovered]);

  useEffect(() => {
    return () => stopLooping();
  }, []);

  return (
    <img 
      ref={imgRef} 
      src={src} 
      alt={alt} 
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};

export default HoverControlledGif;
