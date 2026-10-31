// src/components/admin/FileUploadZone.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface FileUploadZoneProps {
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both";
  label?: string;
  helperText?: string;
  className?: string;
}

export default function FileUploadZone({
  value,
  onChange,
  accept = "image",
  label = "Upload Media Asset",
  helperText,
  className = "",
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [storageProvider, setStorageProvider] = useState<"cloudinary" | "cloudflare-r2" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => res.json())
      .then((data) => {
        if (data.storage === "cloudinary" || data.cloudinary?.configured) {
          setStorageProvider("cloudinary");
        } else if (data.storage === "cloudflare-r2" || data.cloudflareR2?.configured) {
          setStorageProvider("cloudflare-r2");
        }
      })
      .catch(() => {});
  }, []);

  // Accepted file types
  const acceptTypes =
    accept === "video"
      ? "video/mp4,video/webm,video/quicktime,video/mov"
      : accept === "image"
      ? "image/png,image/jpeg,image/webp,image/avif,image/gif"
      : "image/*,video/*";

  const isVideo =
    accept === "video" ||
    value.endsWith(".mp4") ||
    value.endsWith(".webm") ||
    value.endsWith(".mov") ||
    value.includes("/videos/");

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    // Only compress images exceeding 3.5MB to fit within Vercel's 4.5MB serverless payload limit
    if (!file.type.startsWith("image/") || file.size <= 3.5 * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 2560; // 2.5K crisp resolution preserved for photography exhibition
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".webp"),
              { type: "image/webp" }
            );
            resolve(compressed);
          },
          "image/webp",
          0.88
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  const handleUploadFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));

    // Zero-lag local object URL preview for immediate visual feedback (NOT sent to DB)
    const localPreviewUrl = URL.createObjectURL(file);
    setLocalPreview(localPreviewUrl);

    try {
      // 1. Direct Cloudinary Signed Upload (100% Free, No Credit Card, Bypasses Vercel 4.5MB limit, supports videos up to 100MB)
      try {
        const signRes = await fetch("/api/upload/cloudinary-sign", {
          method: "POST",
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.enabled && signData.cloudName && signData.signature) {
            const cldFormData = new FormData();
            cldFormData.append("file", file);
            cldFormData.append("api_key", signData.apiKey);
            cldFormData.append("timestamp", String(signData.timestamp));
            cldFormData.append("signature", signData.signature);
            cldFormData.append("folder", signData.folder);

            const cldRes = await fetch(
              `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`,
              {
                method: "POST",
                body: cldFormData,
              }
            );

            if (cldRes.ok) {
              const cldResult = await cldRes.json();
              if (cldResult.secure_url) {
                onChange(cldResult.secure_url);
                setLocalPreview(null);
                setUploadError(null);
                setIsUploading(false);
                return;
              }
            }
          }
        }
      } catch (cldErr) {
        console.warn("Direct Cloudinary upload skipped:", cldErr);
      }

      // 2. Direct Cloudflare R2 Presigned Upload (Bypasses Vercel 4.5MB limit)
      try {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          }),
        });

        if (presignRes.ok) {
          const presignData = await presignRes.json();
          if (presignData.enabled && presignData.uploadUrl && presignData.publicUrl) {
            const putRes = await fetch(presignData.uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
              body: file,
            });

            if (putRes.ok) {
              onChange(presignData.publicUrl);
              setLocalPreview(null);
              setUploadError(null);
              setIsUploading(false);
              return;
            }
          }
        }
      } catch (presignErr) {
        console.warn("Direct Cloudflare R2 upload skipped:", presignErr);
      }

      // 3. Standard Serverless Fallback (/api/upload)
      if (file.type.startsWith("video/") && file.size > 4.5 * 1024 * 1024) {
        setUploadError(
          `Video size (${formatBytes(file.size)}) exceeds Vercel's 4.5MB serverless limit. Configure Cloudinary in your Vercel settings for direct unlimited uploads, or click 'Paste URL instead' above.`
        );
        setLocalPreview(null);
        setIsUploading(false);
        return;
      }

      const optimizedFile = await compressImageIfNeeded(file);
      setFileSize(formatBytes(optimizedFile.size));

      const formData = new FormData();
      formData.append("file", optimizedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 413) {
        throw new Error(
          "File exceeds Vercel's 4.5MB serverless upload limit. Configure Cloudflare R2 for direct uploads or click 'Paste URL instead' above."
        );
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          `Server responded with HTTP ${res.status}. Please check your connection or use 'Paste URL instead'.`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed. Please try again.");
      }

      // Permanent public static URL saved to database state
      onChange(data.url);
      setLocalPreview(null);
      setUploadError(null);
    } catch (err: any) {
      console.error("Upload error:", err);
      setLocalPreview(null);
      setUploadError(err.message || "Failed to upload file from your device.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleUploadFile(file);
      }
    },
    [onChange]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleUploadFile(file);
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
    setLocalPreview(null);
    setFileName(null);
    setFileSize(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayAssetUrl = localPreview || value;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Label and Mode Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#2A3547]">
            {label}
          </label>
          {storageProvider === "cloudinary" && (
            <span
              style={{ padding: "1px 7px" }}
              className="rounded-full bg-[#EBF5FF] text-[#0066CC] border border-[#0066CC]/25 font-mono text-[9px] font-bold"
              title="Cloudinary Media Storage Active (25GB Free, Global CDN)"
            >
              ☁️ Cloudinary
            </span>
          )}
          {storageProvider === "cloudflare-r2" && (
            <span
              style={{ padding: "1px 7px" }}
              className="rounded-full bg-[#FFF4E6] text-[#D97706] border border-[#D97706]/25 font-mono text-[9px] font-bold"
              title="Cloudflare R2 Direct Storage Active"
            >
              ☁️ Cloudflare R2
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{ padding: "4px 8px" }}
          className="text-xs font-semibold text-[#5D87FF] hover:text-[#4570EA] transition-colors cursor-pointer flex items-center gap-1"
        >
          {showUrlInput ? "← Switch to file upload" : "Paste URL instead →"}
        </button>
      </div>

      {/* Manual URL Input Fallback */}
      {showUrlInput ? (
        <div className="space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              accept === "video"
                ? "https://... or /videos/reel-1.mp4"
                : "https://images.unsplash.com/... or /images/..."
            }
            style={{ padding: "10px 14px" }}
            className="w-full rounded-xl bg-white border border-[#DFE5EF] text-sm text-[#2A3547] placeholder-[#7C8FAC] focus:outline-none focus:border-[#5D87FF] focus:ring-2 focus:ring-[#5D87FF]/10 transition-all font-sans"
          />
          <p className="text-[11px] text-[#7C8FAC]">
            Provide an absolute image link or public asset path.
          </p>
        </div>
      ) : (
        /* Direct System Drag & Drop / File Browser Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden flex flex-col items-center justify-center ${
            isDragging
              ? "border-[#5D87FF] bg-[#ECF2FF] shadow-sm"
              : value
              ? "border-[#EAEFF4] bg-[#F8FAFC] hover:border-[#DFE5EF]"
              : "border-[#DFE5EF] bg-[#F8FAFC] hover:border-[#5D87FF]/60 hover:bg-[#ECF2FF]/30"
          } min-h-[190px]`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* ACTIVE PREVIEW (Image or Video) */}
          {displayAssetUrl ? (
            <div className="w-full flex flex-col">
              <div className="relative w-full h-52 bg-[#0F172A] flex items-center justify-center overflow-hidden group">
              {isVideo ? (
                <video
                  src={displayAssetUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={displayAssetUrl}
                  alt="Asset Preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                  unoptimized
                />
              )}

              {/* Uploading Spinner Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20">
                  <div className="w-6 h-6 rounded-full border-2 border-[#5D87FF] border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold text-[#5D87FF]">
                    Uploading file to server...
                  </span>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{ padding: "8px 16px" }}
                  className="rounded-lg bg-white text-[#2A3547] text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer border border-[#EAEFF4]"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ padding: "8px 16px" }}
                  className="rounded-lg bg-[#FDEDE8] text-[#FA896B] border border-[#FDEDE8] text-xs font-semibold hover:bg-[#FA896B] hover:text-white transition-colors shadow-sm cursor-pointer"
                >
                  Remove
                </button>
              </div>

              {/* File details pill */}
              <div
                style={{ padding: "6px 12px", bottom: "10px", left: "10px" }}
                className="absolute z-10 rounded-md bg-white/95 border border-[#EAEFF4] shadow-xs text-[11px] text-[#2A3547] font-medium flex items-center gap-2 max-w-[85%]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#13DEB9] shrink-0" />
                <span className="truncate">{fileName || value.split("/").pop()}</span>
                {fileSize && (
                  <span className="text-[#7C8FAC] shrink-0">({fileSize})</span>
                )}
              </div>
            </div>

            {/* Mobile Touch Action Bar */}
            <div className="flex sm:hidden items-center justify-between gap-2 p-2 bg-white border-t border-[#EAEFF4] z-10 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#2A3547] text-xs font-semibold text-center transition-colors"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="py-1.5 px-3 rounded-lg bg-[#FDEDE8] hover:bg-[#FA896B] hover:text-white text-[#FA896B] text-xs font-semibold text-center transition-colors"
              >
                Remove
              </button>
            </div>
            </div>
          ) : (
            /* EMPTY UPLOAD PROMPT */
            <div
              style={{ padding: "28px 24px" }}
              className="flex flex-col items-center justify-center text-center space-y-2.5"
            >
              <div
                style={{ width: "44px", height: "44px" }}
                className="rounded-full bg-[#ECF2FF] border border-[#D3E2FF] flex items-center justify-center text-[#5D87FF] transition-transform duration-200"
              >
                {accept === "video" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#2A3547]">
                  Click to upload{" "}
                  <span className="text-[#7C8FAC] font-normal">or drag and drop</span>
                </p>
                <p
                  style={{ marginTop: "4px" }}
                  className="text-xs text-[#7C8FAC]"
                >
                  {helperText ||
                    (accept === "video"
                      ? "MP4, WebM or QuickTime (max 100MB)"
                      : "PNG, JPG, WebP or AVIF (max 25MB)")}
                </p>
              </div>

              <div style={{ paddingTop: "6px" }}>
                <span
                  style={{ padding: "6px 14px" }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#DFE5EF] text-[11px] font-bold text-[#5D87FF] shadow-xs"
                >
                  <span>Browse Device</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div
          style={{ padding: "12px 14px" }}
          className="rounded-xl bg-[#FDEDE8] border border-[#FA896B]/40 text-xs font-semibold text-[#C2410C] flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-[#FA896B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[#FA896B] hover:text-[#C2410C] font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
