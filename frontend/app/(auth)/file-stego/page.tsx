"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  FileKey,
  Upload,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  FileCode,
  FileVideo,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Info,
  Paperclip,
  Trash2,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  embedEnvelopeStego,
  embedImageLsb,
  detectStego,
  universalExtract,
  StegoPayload,
  StegoDetectionResult,
} from "@/lib/universalStego";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileCategory(file: File | { type: string; name: string }) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return { label: "PDF Document", icon: FileText, color: "text-red-400 bg-red-500/10 border-red-500/30" };
  }
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|svg)$/.test(name)) {
    return { label: "Image Asset", icon: FileKey, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
  }
  if (type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) {
    return { label: "Video Container", icon: FileVideo, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
  }
  if (type.startsWith("text/") || /\.(txt|md|csv|json|xml|fasta|fna)$/.test(name)) {
    return { label: "Text / Genomic Stream", icon: FileCode, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  }
  return { label: "Binary / Archive", icon: FileSpreadsheet, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
}

async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const cryptoObj = typeof window !== "undefined" && window.crypto ? window.crypto : (globalThis as any).crypto;
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function UniversalFileStegoPage() {
  const [activeTab, setActiveTab] = useState<"embed" | "extract" | "architecture">("embed");

  // -------------------------------------------------------------------------
  // EMBED STATE
  // -------------------------------------------------------------------------
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [carrierPreviewUrl, setCarrierPreviewUrl] = useState<string | null>(null);
  const [secretMessage, setSecretMessage] = useState<string>(
    "CONFIDENTIAL: HelixSign Genomic Provenance Certificate #HS-2026-X81\nIntegrity: Uncompromised\nAuthorized Personnel: Principal Investigator"
  );
  const [author, setAuthor] = useState<string>("HelixSign Synthetic Bio Core");
  const [secretFile, setSecretFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>("HelixSign-QuantumBio-2026-MasterKey");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [stegoMode, setStegoMode] = useState<"envelope" | "image_lsb">("envelope");

  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedSuccess, setEmbedSuccess] = useState<{
    fileName: string;
    fileSize: number;
    originalSize: number;
    deltaBytes: number;
    sha256: string;
    blob: Blob;
    mode: string;
  } | null>(null);

  const carrierInputRef = useRef<HTMLInputElement>(null);
  const secretFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // EXTRACT STATE
  // -------------------------------------------------------------------------
  const [stegoExtractFile, setStegoExtractFile] = useState<File | null>(null);
  const [extractPassword, setExtractPassword] = useState<string>("HelixSign-QuantumBio-2026-MasterKey");
  const [showExtractPassword, setShowExtractPassword] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedPayload, setExtractedPayload] = useState<StegoPayload | null>(null);
  const [extractedMode, setExtractedMode] = useState<string | null>(null);
  const [detectionInfo, setDetectionInfo] = useState<StegoDetectionResult | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  const extractInputRef = useRef<HTMLInputElement>(null);

  // Carrier selection handler
  const handleCarrierSelect = (file: File) => {
    setCarrierFile(file);
    setEmbedSuccess(null);
    setEmbedError(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setCarrierPreviewUrl(url);
    } else {
      setCarrierPreviewUrl(null);
    }

    // Default to envelope, but if lossless image, allow LSB
    if (file.type === "image/png" || file.type === "image/bmp" || file.type === "image/webp") {
      // User can switch if preferred
    } else {
      setStegoMode("envelope");
    }
  };

  // Drag and drop for carrier
  const handleCarrierDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCarrierSelect(e.dataTransfer.files[0]);
    }
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const b64 = res.split(",")[1] || res;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Run Embedding
  const handleRunEmbedding = async () => {
    if (!carrierFile) {
      setEmbedError("Please select a carrier file first (PDF, Image, Video, Text, or Document).");
      return;
    }
    if (!password) {
      setEmbedError("Please provide an encryption passphrase to lock the steganographic payload.");
      return;
    }

    setIsEmbedding(true);
    setEmbedError(null);
    setEmbedSuccess(null);

    try {
      let secretFileDataBase64: string | undefined = undefined;
      let secretFileName: string | undefined = undefined;
      let secretFileType: string | undefined = undefined;

      if (secretFile) {
        secretFileDataBase64 = await fileToBase64(secretFile);
        secretFileName = secretFile.name;
        secretFileType = secretFile.type;
      }

      const payload: StegoPayload = {
        message: secretMessage,
        author: author.trim() || undefined,
        timestamp: new Date().toISOString(),
        secretFileName,
        secretFileType,
        secretFileDataBase64,
        carrierType: carrierFile.type || "application/octet-stream",
      };

      let outputBlob: Blob;
      let usedMode = "";

      if (stegoMode === "image_lsb" && carrierFile.type.startsWith("image/")) {
        // Pixel LSB mode via OffscreenCanvas / Canvas
        const bitmap = await createImageBitmap(carrierFile);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not initialize 2D image rasterizer context.");
        ctx.drawImage(bitmap, 0, 0);

        outputBlob = await embedImageLsb(canvas, payload, password);
        usedMode = "Pixel-Level LSB Steganography (RGB Modulation)";
      } else {
        // Universal Envelope mode (works on ALL files)
        const carrierBuffer = await carrierFile.arrayBuffer();
        outputBlob = await embedEnvelopeStego(
          carrierBuffer,
          payload,
          password,
          carrierFile.type || "application/octet-stream"
        );
        usedMode = "Universal Polyglot Envelope (AES-256-GCM)";
      }

      const blobBuffer = await outputBlob.arrayBuffer();
      const sha256 = await computeSha256(blobBuffer);

      // Name output file e.g., "stego_document.pdf"
      const originalName = carrierFile.name;
      const dotIndex = originalName.lastIndexOf(".");
      const outName =
        dotIndex !== -1
          ? `${originalName.substring(0, dotIndex)}_watermarked${originalName.substring(dotIndex)}`
          : `${originalName}_watermarked`;

      setEmbedSuccess({
        fileName: outName,
        fileSize: outputBlob.size,
        originalSize: carrierFile.size,
        deltaBytes: outputBlob.size - carrierFile.size,
        sha256,
        blob: outputBlob,
        mode: usedMode,
      });
    } catch (err: any) {
      setEmbedError(err.message || "Failed to embed payload into carrier file.");
    } finally {
      setIsEmbedding(false);
    }
  };

  // Trigger download of the watermarked file
  const handleDownloadWatermarked = () => {
    if (!embedSuccess) return;
    const url = URL.createObjectURL(embedSuccess.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = embedSuccess.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pre-load watermarked file directly into extract tab
  const handleTransferToExtract = () => {
    if (!embedSuccess) return;
    const file = new File([embedSuccess.blob], embedSuccess.fileName, {
      type: embedSuccess.blob.type,
    });
    setStegoExtractFile(file);
    setExtractPassword(password);
    setActiveTab("extract");
    handleDetectFile(file);
  };

  // Inspect file for watermark before extracting
  const handleDetectFile = async (file: File) => {
    try {
      const res = await detectStego(file);
      setDetectionInfo(res);
    } catch (e) {
      setDetectionInfo(null);
    }
  };

  // Extract / Decrypt handler
  const handleRunExtraction = async () => {
    if (!stegoExtractFile) {
      setExtractError("Please select or drop a watermarked file to extract.");
      return;
    }
    if (!extractPassword) {
      setExtractError("Please enter the decryption password.");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractedPayload(null);
    setExtractedMode(null);

    try {
      const result = await universalExtract(stegoExtractFile, extractPassword);
      setExtractedPayload(result.payload);
      setExtractedMode(result.mode);
    } catch (err: any) {
      setExtractError(
        err.message || "Decryption failed. Ensure the password is correct and this file contains a HelixSign watermark."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Download hidden attached file from extracted payload
  const handleDownloadExtractedSecretFile = () => {
    if (!extractedPayload || !extractedPayload.secretFileDataBase64 || !extractedPayload.secretFileName) return;
    const byteCharacters = atob(extractedPayload.secretFileDataBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: extractedPayload.secretFileType || "application/octet-stream",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = extractedPayload.secretFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-mono">
              Universal File Stego v1.5.0
            </Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/5 text-xs font-mono">
              AES-256-GCM + PBKDF2
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <FileKey className="w-6 h-6 text-primary" />
            Universal File Steganography Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Embed & extract authenticated encrypted secrets inside any file format (PDF, images, video, text, audio,
            or binary) with zero perceptual degradation and 100% host file playback compatibility.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/40">
          <Button
            size="sm"
            variant={activeTab === "embed" ? "default" : "ghost"}
            onClick={() => setActiveTab("embed")}
            className="text-xs h-8 gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Embed & Watermark
          </Button>
          <Button
            size="sm"
            variant={activeTab === "extract" ? "default" : "ghost"}
            onClick={() => setActiveTab("extract")}
            className="text-xs h-8 gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5" />
            Extract & Recover
          </Button>
          <Button
            size="sm"
            variant={activeTab === "architecture" ? "default" : "ghost"}
            onClick={() => setActiveTab("architecture")}
            className="text-xs h-8 gap-1.5"
          >
            <Info className="w-3.5 h-3.5" />
            Technical Spec
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EMBED & WATERMARK                                              */}
      {/* ===================================================================== */}
      {activeTab === "embed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Carrier & Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Carrier File Selector Dropzone */}
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    1. Carrier Host File
                  </span>
                  {carrierFile && (
                    <Badge variant="outline" className={getFileCategory(carrierFile).color}>
                      {getFileCategory(carrierFile).label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload ANY file to serve as the innocent carrier: PDF report, PNG/JPG photo, MP4 video, genomic FASTA, or source code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  ref={carrierInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCarrierSelect(e.target.files[0])}
                />

                {!carrierFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleCarrierDrop}
                    onClick={() => carrierInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 group flex flex-col items-center justify-center gap-2.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Click or drag & drop carrier file here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF, PNG, JPG, MP4, MKV, MP3, TXT, DOCX, ZIP, FASTA (any size)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/70 rounded-xl p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <FileKey className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground truncate max-w-[280px] md:max-w-[360px]">
                            {carrierFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatBytes(carrierFile.size)} • {carrierFile.type || "application/octet-stream"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCarrierFile(null);
                          setCarrierPreviewUrl(null);
                          setEmbedSuccess(null);
                        }}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Image Preview if applicable */}
                    {carrierPreviewUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-border/50 max-h-48 flex items-center justify-center bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={carrierPreviewUrl}
                          alt="Carrier Preview"
                          className="max-h-48 object-contain"
                        />
                      </div>
                    )}

                    {/* Stego Mode Selector (if image) */}
                    {carrierFile.type.startsWith("image/") && (
                      <div className="pt-2 border-t border-border/40 space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Steganography Embedding Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setStegoMode("envelope")}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              stegoMode === "envelope"
                                ? "border-primary bg-primary/10 text-foreground font-medium shadow-sm"
                                : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <div className="font-semibold text-primary flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" />
                              Polyglot Container
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Infinite capacity. Universal compatibility across all viewers.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStegoMode("image_lsb")}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              stegoMode === "image_lsb"
                                ? "border-primary bg-primary/10 text-foreground font-medium shadow-sm"
                                : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" />
                              Pixel LSB Modulation
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Hides bits inside raw RGB pixel values. Ideal for PNG/BMP images.
                            </p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secret Payload Inputs */}
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  2. Secret Hidden Payload
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure the confidential message, metadata, and optional secret file to conceal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Secret Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Confidential Secret Message / Watermark Text
                    </label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {secretMessage.length} chars
                    </span>
                  </div>
                  <Textarea
                    rows={4}
                    value={secretMessage}
                    onChange={(e) => setSecretMessage(e.target.value)}
                    placeholder="Enter confidential watermark text, hash digests, proprietary instructions, or identity claims..."
                    className="font-mono text-xs resize-none bg-muted/20"
                  />
                </div>

                {/* Author & Attached Secret File */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Author / Signer Identity</label>
                    <Input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. HelixSign Core Lab"
                      className="text-xs bg-muted/20 h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span>Attach Secret File (Optional)</span>
                      {secretFile && (
                        <button
                          type="button"
                          onClick={() => setSecretFile(null)}
                          className="text-[11px] text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </label>
                    <input
                      type="file"
                      ref={secretFileInputRef}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setSecretFile(e.target.files[0])}
                    />
                    {!secretFile ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => secretFileInputRef.current?.click()}
                        className="w-full h-9 text-xs justify-start text-muted-foreground border-dashed bg-muted/10 gap-2"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        Hide an entire second file inside...
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-xs text-foreground truncate">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{secretFile.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          ({formatBytes(secretFile.size)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Encryption Password */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-primary" />
                      AES-256-GCM Passphrase
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      PBKDF2-SHA256 • 100,000 rounds
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passphrase used to derive 256-bit AES key..."
                      className="font-mono text-xs bg-muted/20 h-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {embedError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{embedError}</span>
                  </div>
                )}

                {/* Embed Action Button */}
                <Button
                  onClick={handleRunEmbedding}
                  disabled={!carrierFile || isEmbedding}
                  className="w-full gap-2 font-medium"
                >
                  {isEmbedding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deriving Key & Encrypting Payload...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Embed Encrypted Watermark & Generate File
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Watermarked Output & Verification (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Watermarked Artifact
                </CardTitle>
                <CardDescription className="text-xs">
                  Resulting carrier file ready for distribution, native playback, and extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                {!embedSuccess ? (
                  <div className="border border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[320px] bg-muted/10">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No Watermarked File Generated Yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                      Select a carrier file on the left, enter your secret message and passphrase, and click
                      &quot;Embed Encrypted Watermark&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Watermark Successfully Embedded & Authenticated
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Output File:</span>
                          <span className="font-mono font-medium text-foreground truncate max-w-[200px]">
                            {embedSuccess.fileName}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Original Size:</span>
                          <span className="font-mono">{formatBytes(embedSuccess.originalSize)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Watermarked Size:</span>
                          <span className="font-mono text-emerald-400 font-medium">
                            {formatBytes(embedSuccess.fileSize)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Payload Overhead:</span>
                          <span className="font-mono text-cyan-400">+{formatBytes(embedSuccess.deltaBytes)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Algorithm Mode:</span>
                          <span className="font-mono text-[11px] text-foreground">{embedSuccess.mode}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 space-y-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" /> SHA-256 Provenance Fingerprint:
                        </span>
                        <div className="p-2 rounded bg-black/40 font-mono text-[10px] text-muted-foreground break-all border border-border/30">
                          {embedSuccess.sha256}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button
                        onClick={handleDownloadWatermarked}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download Watermarked File
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleTransferToExtract}
                        className="w-full gap-2 text-xs border-primary/40 hover:bg-primary/10 text-primary"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Verify & Test Recovery Now
                      </Button>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>Native Application Fidelity:</strong> This file can be opened directly in Adobe Acrobat,
                      Apple Preview, VLC Player, Chrome, or Windows Photo Viewer. The encrypted watermark is transparent to
                      normal parsers.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: EXTRACT & RECOVER                                              */}
      {/* ===================================================================== */}
      {activeTab === "extract" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Watermarked File Upload & Passphrase (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Upload Watermarked Carrier File
                  </span>
                  {detectionInfo?.hasStego && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      Watermark Signature Detected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide any file previously watermarked by HelixSign to extract and decrypt the concealed payload.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  ref={extractInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setStegoExtractFile(f);
                      setExtractError(null);
                      setExtractedPayload(null);
                      handleDetectFile(f);
                    }
                  }}
                />

                {!stegoExtractFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const f = e.dataTransfer.files[0];
                        setStegoExtractFile(f);
                        setExtractError(null);
                        setExtractedPayload(null);
                        handleDetectFile(f);
                      }
                    }}
                    onClick={() => extractInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-cyan-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 group flex flex-col items-center justify-center gap-2.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <FileKey className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Click or drop watermarked file here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF, PNG, JPG, MP4, MKV, MP3, TXT, DOCX, ZIP, FASTA
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/70 rounded-xl p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <FileKey className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground truncate max-w-[280px]">
                            {stegoExtractFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatBytes(stegoExtractFile.size)} • {stegoExtractFile.type || "application/octet-stream"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStegoExtractFile(null);
                          setDetectionInfo(null);
                          setExtractedPayload(null);
                        }}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Pre-flight detection status badge */}
                    {detectionInfo && (
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Pre-flight Container Scan:</span>
                        {detectionInfo.hasStego ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {detectionInfo.mode === "envelope"
                              ? "Polyglot Envelope Found"
                              : "Pixel LSB Header Found"}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Unindexed format / No header match
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Password field */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-primary" />
                      Decryption Passphrase
                    </span>
                    <span className="text-[11px] text-muted-foreground">Required for AES-256-GCM authentication</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showExtractPassword ? "text" : "password"}
                      value={extractPassword}
                      onChange={(e) => setExtractPassword(e.target.value)}
                      placeholder="Passphrase used when embedding..."
                      className="font-mono text-xs bg-muted/20 h-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExtractPassword(!showExtractPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showExtractPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {extractError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}

                <Button
                  onClick={handleRunExtraction}
                  disabled={!stegoExtractFile || isExtracting}
                  className="w-full gap-2 font-medium"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deriving Key & Verifying Auth Tag...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Extract & Decrypt Secret Payload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recovered Payload & Hidden Files (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Decrypted Payload & Provenance
                  </span>
                  {extractedPayload && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
                      GCM Tag Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Authentic secret data extracted from the carrier file container.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                {!extractedPayload ? (
                  <div className="border border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[320px] bg-muted/10">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Awaiting Decryption</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                      Upload a watermarked file on the left and submit the passphrase to extract and authenticate the
                      hidden payload.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <span className="text-[11px] text-muted-foreground block">Signer / Author</span>
                        <span className="font-semibold text-foreground">
                          {extractedPayload.author || "Anonymous / Unspecified"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <span className="text-[11px] text-muted-foreground block">Extraction Mode</span>
                        <span className="font-semibold text-cyan-400 truncate block">
                          {extractedMode || "Polyglot"}
                        </span>
                      </div>
                      <div className="col-span-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 flex justify-between items-center">
                        <span className="text-[11px] text-muted-foreground">Timestamp:</span>
                        <span className="font-mono text-[11px] text-foreground">
                          {extractedPayload.timestamp
                            ? new Date(extractedPayload.timestamp).toLocaleString()
                            : "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Recovered Secret Message */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Decrypted Secret Message
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(extractedPayload.message)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedMessage ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs whitespace-pre-wrap break-words max-h-56 overflow-y-auto">
                        {extractedPayload.message}
                      </div>
                    </div>

                    {/* Hidden Attached File if recovered */}
                    {extractedPayload.secretFileName && extractedPayload.secretFileDataBase64 && (
                      <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" />
                            Embedded Secret File Recovered
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {extractedPayload.secretFileType || "binary"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-lg border border-border/40">
                          <span className="text-xs font-medium text-foreground truncate max-w-[220px]">
                            {extractedPayload.secretFileName}
                          </span>
                          <Button
                            size="sm"
                            onClick={handleDownloadExtractedSecretFile}
                            className="h-7 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TECHNICAL ARCHITECTURE & SPEC                                  */}
      {/* ===================================================================== */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AES-256-GCM Encryption
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <p>
                  Every embedded payload is encrypted with military-grade Galois/Counter Mode (AES-256-GCM) featuring a
                  12-byte cryptographically random IV.
                </p>
                <p>
                  A 128-bit authentication tag ensures immediate detection and rejection if a single byte is tampered
                  with or altered.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  PBKDF2 Key Stretching
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <p>
                  Passphrases are hardened using 100,000 iterations of PBKDF2-HMAC-SHA-256 alongside a 16-byte random salt.
                </p>
                <p>
                  This provides strong resilience against GPU-accelerated dictionary attacks and rainbow table precomputation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Polyglot Envelope Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <p>
                  PDFs, video streams, audio, and documents terminate parsing at designated EOF/atom markers (e.g. <code>%%EOF</code>).
                </p>
                <p>
                  HelixSign appends an authenticated container with footer sentinel (<code>HELIXSIG</code>) enabling zero
                  corruption in host applications.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Container Byte Layout Specification</CardTitle>
              <CardDescription className="text-xs">
                Physical binary layout of a watermarked carrier file under HelixSign Universal Polyglot Container specification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-black/40 border border-border/40 font-mono text-xs space-y-2 text-muted-foreground">
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="p-1.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    [Carrier Host File Bytes: N bytes]
                  </span>
                  <span className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    [MAGIC: HLXSTEG1 (8B)]
                  </span>
                  <span className="p-1.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    [PBKDF2 Salt: 16B]
                  </span>
                  <span className="p-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    [GCM IV: 12B]
                  </span>
                  <span className="p-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    [Ciphertext + 16B Auth Tag: M bytes]
                  </span>
                  <span className="p-1.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    [Length uint32: 4B]
                  </span>
                  <span className="p-1.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    [SENTINEL: HELIXSIG (8B)]
                  </span>
                </div>
                <div className="text-[11px] pt-3 leading-relaxed border-t border-border/40">
                  When any file is uploaded to the extractor, HelixSign first inspects the trailing 8 bytes for <code>HELIXSIG</code>.
                  If present, it reads the 4-byte big-endian length immediately preceding the sentinel to locate the container start,
                  validates the <code>HLXSTEG1</code> magic header, and securely decrypts the AES-256-GCM payload.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
