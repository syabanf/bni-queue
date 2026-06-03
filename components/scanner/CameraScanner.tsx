"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface CameraScannerProps {
  /** Called when a QR code is decoded. Throttled — won't fire more than once per `throttleMs`. */
  onDetect: (token: string) => void;
  /** Whether the scanner should actively decode (false freezes the camera UI without tearing down). */
  enabled: boolean;
  /** Minimum gap between successful detections in ms. Default 1500. */
  throttleMs?: number;
}

/**
 * @zxing/browser wrapper. iOS Safari requires a user gesture before
 * getUserMedia, so the first interaction shows a "Tap to enable camera" button
 * and only requests permission on click.
 */
export function CameraScanner({
  onDetect,
  enabled,
  throttleMs = 1500,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastDetectAtRef = useRef<number>(0);
  const lastDetectTokenRef = useRef<string>("");

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [permissionState, setPermissionState] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleDecode = useCallback(
    (text: string) => {
      const now = Date.now();
      if (
        text === lastDetectTokenRef.current &&
        now - lastDetectAtRef.current < throttleMs
      ) {
        return;
      }
      lastDetectAtRef.current = now;
      lastDetectTokenRef.current = text;
      onDetect(text);
    },
    [onDetect, throttleMs],
  );

  const requestCamera = useCallback(async () => {
    setPermissionState("requesting");
    setError(null);

    try {
      // Touch getUserMedia first so iOS Safari is satisfied.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      // Immediately release; zxing will open its own stream below.
      stream.getTracks().forEach((t) => t.stop());

      const list = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(list);
      // Prefer back camera if labels are available.
      const back = list.findIndex((d) =>
        /back|rear|environment/i.test(d.label),
      );
      setDeviceIndex(back >= 0 ? back : 0);

      setPermissionState("granted");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Camera permission denied.";
      setError(message);
      setPermissionState("denied");
    }
  }, []);

  // Start / stop decoding based on `enabled` and permission.
  useEffect(() => {
    if (!enabled || permissionState !== "granted") {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    let cancelled = false;
    const deviceId = devices[deviceIndex]?.deviceId;

    reader
      .decodeFromVideoDevice(deviceId ?? null, video, (result) => {
        if (cancelled) return;
        if (result) handleDecode(result.getText());
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Could not start camera.",
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [enabled, permissionState, devices, deviceIndex, handleDecode]);

  if (permissionState === "idle" || permissionState === "denied") {
    return (
      <div className="relative aspect-square w-full max-w-md mx-auto rounded-scanner glass-panel flex flex-col items-center justify-center p-8 gap-4 overflow-hidden">
        {/* faint reticle corners on the idle frame */}
        <div className="absolute top-6 left-6 w-9 h-9 border-t-4 border-l-4 border-wit-red/40 rounded-tl-2xl" />
        <div className="absolute top-6 right-6 w-9 h-9 border-t-4 border-r-4 border-wit-red/40 rounded-tr-2xl" />
        <div className="absolute bottom-6 left-6 w-9 h-9 border-b-4 border-l-4 border-wit-red/40 rounded-bl-2xl" />
        <div className="absolute bottom-6 right-6 w-9 h-9 border-b-4 border-r-4 border-wit-red/40 rounded-br-2xl" />
        <p className="text-wit-white text-base text-center">
          {permissionState === "denied"
            ? "Camera permission denied."
            : "Tap to enable camera."}
        </p>
        {error ? (
          <p className="text-wit-red text-xs text-center">{error}</p>
        ) : null}
        <button
          type="button"
          onClick={requestCamera}
          className="rounded-md bg-wit-red text-wit-onred font-bold px-5 py-2 hover:bg-wit-red-bright glow-red transition-colors"
        >
          {permissionState === "denied" ? "Try again" : "Enable camera"}
        </button>
        <p className="text-wit-muted text-xs text-center">
          iOS Safari requires a tap to start the camera.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto rounded-scanner overflow-hidden border border-wit-red/50 bg-wit-black glow-red">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      {/* Reticle + animated scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-6 border border-wit-red/30 rounded-2xl" />
        <div className="absolute top-6 left-6 w-9 h-9 border-t-4 border-l-4 border-wit-red rounded-tl-2xl" />
        <div className="absolute top-6 right-6 w-9 h-9 border-t-4 border-r-4 border-wit-red rounded-tr-2xl" />
        <div className="absolute bottom-6 left-6 w-9 h-9 border-b-4 border-l-4 border-wit-red rounded-bl-2xl" />
        <div className="absolute bottom-6 right-6 w-9 h-9 border-b-4 border-r-4 border-wit-red rounded-br-2xl" />
        {/* Sweeping scan beam */}
        <div className="absolute inset-x-6 top-6 h-16 animate-scanline">
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-wit-red), transparent)",
              boxShadow: "0 0 16px 2px rgba(245,51,61,0.7)",
            }}
          />
        </div>
      </div>

      {devices.length > 1 ? (
        <button
          type="button"
          onClick={() => setDeviceIndex((i) => (i + 1) % devices.length)}
          className="absolute bottom-3 right-3 rounded-md bg-wit-charcoal/80 px-3 py-1.5 text-xs text-wit-white border border-wit-border"
        >
          Switch camera
        </button>
      ) : null}
    </div>
  );
}
