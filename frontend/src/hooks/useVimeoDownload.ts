import { useState } from "react";

const CLIENT_ID = import.meta.env.VITE_VIMEO_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_VIMEO_CLIENT_SECRET;
const ACCESS_TOKEN = import.meta.env.VITE_VIMEO_ACCESS_TOKEN;

export function useVimeoDownload() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async () => {
    if (ACCESS_TOKEN) {
      try {
        const testResponse = await fetch("https://api.vimeo.com/me", {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            Accept: "application/vnd.vimeo.*+json;version=3.4",
          },
        });

        if (testResponse.ok) {
          console.log("Personal access token is valid");
          return ACCESS_TOKEN;
        } else if (testResponse.status === 401) {
          console.log("Personal access token has expired");
        } else {
          console.log(
            "Personal access token validation failed:",
            testResponse.status
          );
        }
      } catch (err) {
        console.log("Token validation request failed:", err);
      }
    }

    // Fallback
    try {
      const response = await fetch(
        "https://api.vimeo.com/oauth/authorize/client",
        {
          method: "POST",
          headers: {
            Authorization: `basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.vimeo.*+json;version=3.4",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            scope: "public",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get client credentials token");
      }

      return data.access_token;
    } catch (err) {
      console.error("Failed to get access token:", err);
      throw new Error("Authentication failed - unable to get any valid token");
    }
  };

  const getDownloadOptions = async (videoId: any) => {
    setLoading(true);
    setError(null);

    try {

      const accessToken = await getAccessToken();

      const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!data.privacy?.download) {
        throw new Error("Downloads are not allowed for this video");
      }

      // Extract download links from the response
      const downloadLinks = data.download || [];

      if (
        downloadLinks.length === 0 &&
        data.download &&
        data.download.length > 0
      ) {
        data.download.forEach((option: any) => {
          downloadLinks.push({
            quality: option.quality || "Unknown",
            width: option.width,
            height: option.height,
            size: option.size,
            url: option.link,
            type: "download",
            format: option.rendition || "mp4",
          });
        });
      }

      downloadLinks.sort(
        (
          a: { width?: number; height?: number },
          b: { width?: number; height?: number }
        ) => {
          const aPixels = (a.width || 0) * (a.height || 0);
          const bPixels = (b.width || 0) * (b.height || 0);
          return bPixels - aPixels;
        }
      );

      setLoading(false);

      return {
        options: downloadLinks,
        videoName: data.name,
      };
    } catch (err) {
      console.error("Download links fetch error:", err);
      if (err instanceof Error) setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const downloadVideo = async (downloadUrl: string, filename = "video.mp4") => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  };

  return {
    getAccessToken,
    getDownloadOptions,
    downloadVideo,
    loading,
    error,
  };
}
