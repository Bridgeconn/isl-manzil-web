import { useEffect, useRef } from "react";

const LoopingGif = ({ src, className, alt, duration=3000}: {src: string, className: string, alt: string, duration?: number}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const restartGif = () => {
      const originalSrc = img.src;
      img.src = "";
      img.src = originalSrc;
    };

    // Start the loop
    const interval = setInterval(restartGif, duration);

    return () => clearInterval(interval);
  }, []);

  return <img ref={imgRef} src={src} alt={alt} className={className} />;
};

export default LoopingGif;