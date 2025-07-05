"use client";

import React, { useState } from "react";
import axios from "axios";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

interface ThumbnailResponse {
  shortcode: string;
  thumbnail_url: string;
  thumbnail_base64: string;
}

export default function DownloadOptions() {
  const [url, setUrl] = useState<string>("");
  const [thumbnail, setThumbnail] = useState<string>("");
  const [shortcode, setShortcode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);

  // const API_BASE = "http://127.0.0.1:5000/";
  const API_BASE = "https://instaloader-backend-rkzf.onrender.com/";

  const fetchThumbnail = async () => {
    setLoading(true);
    setError("");
    setThumbnail("");
    setShortcode("");
    try {
      const response = await axios.post<ThumbnailResponse>(
        `${API_BASE}/get-reel-thumbnail`,
        { url }
      );
      setThumbnail(response.data.thumbnail_base64);
      setShortcode(response.data.shortcode);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to get thumbnail.");
    }
    setLoading(false);
  };

 const downloadReel = async () => {
  setLoading(true);
  setError("");
  try {
    const response = await axios.post(
      `${API_BASE}/download-reel`,
      { url },
      { responseType: "blob" }
    );

    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("application/json")) {
      // Error from backend
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          setError(json.error || "Download failed (json error).");
        } catch {
          setError("Download failed (bad json error).");
        }
        setLoading(false);
      };
      reader.readAsText(response.data);
      return;
    }

    // Try to get filename from content-disposition
    let filename = `${shortcode || "reel"}.mp4`;
    const disposition = response.headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = new Blob([response.data], { type: "video/mp4" });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 3000);
  } catch (e: any) {
    setError(e?.message || "Download failed.");
    setLoading(false);
  }
  setLoading(false);
};

  const resetAll = () => {
    setUrl("");
    setThumbnail("");
    setShortcode("");
    setStep(1);
    setError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-gradient-to-br from-indigo-100 to-white">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-extrabold text-indigo-800 mb-2">
          Instagram Reel Downloader
        </h1>
        <p className="text-gray-500 text-center mb-4">
          Paste an Instagram Reel URL below to get its thumbnail and download the video.
        </p>

        {step === 1 && (
          <>
            <div className="w-full flex gap-2">
              <Input
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="flex-1 border-2 border-indigo-300 focus:border-indigo-500 rounded-lg"
              />
              <Button
                onClick={fetchThumbnail}
                disabled={loading || !url.includes("/reel/")}
                className="font-semibold"
              >
                {loading ? "Loading..." : "Get Thumbnail"}
              </Button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </>
        )}

        {step === 2 && (
          <>
            <img src={thumbnail} alt="Reel thumbnail" className="w-full rounded-lg shadow" />
            <p className="text-sm text-gray-700">Shortcode: {shortcode}</p>
            <div className="flex gap-4 w-full justify-center">
              <Button onClick={downloadReel} disabled={loading}>
                {loading ? "Downloading..." : "Download Reel"}
              </Button>
              <Button variant="secondary" onClick={resetAll} disabled={loading}>
                Cancel
              </Button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
