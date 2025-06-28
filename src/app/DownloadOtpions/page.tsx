"use client";

import React, { useState } from "react";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import axios from "axios";

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

  // ✨ Change this to your live backend URL:
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // e.g., https://monalisa.codeseed.in
  console.log("API_BASE:", API_BASE);
  const fetchThumbnail = async () => {
    setLoading(true);
    setError("");
    setThumbnail("");
    setShortcode("");
    try {
      const response = await axios.post<ThumbnailResponse>(
        `${API_BASE}/get-reel-thumbnail`,
        { url },
        {
          withCredentials: false,
        }
      );
      if (response.data.thumbnail_base64) {
        setThumbnail(response.data.thumbnail_base64);
        setShortcode(response.data.shortcode);
        setStep(2);
      } else {
        setError("Thumbnail not found for this reel.");
      }
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
        { shortcode },
        {
          responseType: "blob",
          withCredentials: false,
        }
      );
      // Create a download link
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${shortcode}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Download failed.");
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
        <h1 className="text-3xl font-extrabold text-indigo-800 mb-2">Instagram Reel Downloader</h1>
        <p className="text-gray-500 text-center mb-4">
          Paste an Instagram Reel URL below to get its thumbnail and download the video.
        </p>
        {step === 1 && (
          <>
            <div className="w-full flex gap-2">
              <Input
                type="url"
                placeholder="https://www.instagram.com/reel/shortcode/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="flex-1 border-2 border-indigo-300 focus:border-indigo-500 rounded-lg"
              />
              <Button
                onClick={fetchThumbnail}
                disabled={
                  loading ||
                  !/^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?/.test(url)
                }
                className="font-semibold"
              >
                {loading ? "Loading..." : "Get Thumbnail"}
              </Button>
            </div>
            {error && (
              <div className="w-full bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm mt-1">
                {error}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center space-y-4 w-full">
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Thumbnail"
                className="max-w-full rounded shadow border"
              />
            )}
            <p className="text-sm text-gray-700">
              <strong className="text-indigo-700">Shortcode:</strong> {shortcode}
            </p>
            <div className="flex gap-4 w-full justify-center">
              <Button
                onClick={downloadReel}
                disabled={loading}
                className="font-semibold"
              >
                {loading ? "Downloading..." : "Download Reel"}
              </Button>
              <Button
                variant="secondary"
                onClick={resetAll}
                disabled={loading}
                className="font-semibold"
              >
                Cancel
              </Button>
            </div>
            {error && (
              <div className="w-full bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm mt-1">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
