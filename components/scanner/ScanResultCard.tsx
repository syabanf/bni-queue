"use client";

import type { ParticipantProjection, ScanResponse } from "@/lib/scans/types";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";

interface ScanResultCardProps {
  response: ScanResponse;
  boothName: string;
  onNext: () => void;
}

export function ScanResultCard({
  response,
  boothName,
  onNext,
}: ScanResultCardProps) {
  if (response.status === "success") {
    return (
      <ResultShell
        title="STAMP SUCCESSFUL"
        accentClass="bg-state-success-bg border-wit-success"
        accentText="text-wit-success"
        buttonLabel="Scan next participant"
        onNext={onNext}
      >
        <ParticipantBlock participant={response.participant} booth={boothName} />
        <p className="text-sm text-wit-muted mt-3">
          Collected at {formatJakartaTime(response.scanned_at)} {WIB_LABEL}
        </p>
        <p className="text-sm text-wit-white mt-2">
          Stamp progress:{" "}
          <span className="text-wit-red font-bold">
            {response.stamp_count}
          </span>{" "}
          collected
        </p>
      </ResultShell>
    );
  }

  if (response.status === "duplicate") {
    return (
      <ResultShell
        title="DUPLICATE STAMP DETECTED"
        accentClass="bg-state-duplicate-bg border-wit-orange"
        accentText="text-wit-orange"
        buttonLabel="Scan next participant"
        onNext={onNext}
      >
        <ParticipantBlock participant={response.participant} booth={boothName} />
        <p className="text-sm text-wit-white mt-3">
          This participant already collected a stamp from this booth.
        </p>
        {response.previous_scan_at ? (
          <p className="text-sm text-wit-muted mt-1">
            Previous scan: {formatJakartaTime(response.previous_scan_at)}{" "}
            {WIB_LABEL}
          </p>
        ) : null}
      </ResultShell>
    );
  }

  if (response.status === "invalid") {
    const reasonMessage = {
      malformed_qr: "QR could not be parsed.",
      bad_signature:
        "This QR is not registered for BNI NatCon. Check the participant badge.",
      bad_version: "This QR is from a different event.",
      unknown_participant: "Participant code not found.",
      inactive_participant: "Participant account is not active.",
    }[response.reason];

    return (
      <ResultShell
        title="INVALID QR CODE"
        accentClass="bg-state-invalid-bg border-wit-red"
        accentText="text-wit-red"
        buttonLabel="Try again"
        onNext={onNext}
      >
        <p className="text-sm text-wit-white">{reasonMessage}</p>
      </ResultShell>
    );
  }

  if (response.status === "rate_limited") {
    return (
      <ResultShell
        title="SLOW DOWN"
        accentClass="bg-state-duplicate-bg border-wit-orange"
        accentText="text-wit-orange"
        buttonLabel="OK"
        onNext={onNext}
      >
        <p className="text-sm text-wit-white">
          Scanner is throttling. Retry in{" "}
          {Math.ceil(response.retry_after_ms / 100) / 10}s.
        </p>
      </ResultShell>
    );
  }

  if (response.status === "unauthorized_pic") {
    return (
      <ResultShell
        title="NOT YOUR BOOTH"
        accentClass="bg-state-invalid-bg border-wit-red"
        accentText="text-wit-red"
        buttonLabel="OK"
        onNext={onNext}
      >
        <p className="text-sm text-wit-white">{response.message}</p>
      </ResultShell>
    );
  }

  return (
    <ResultShell
      title="SERVER ERROR"
      accentClass="bg-state-invalid-bg border-wit-red"
      accentText="text-wit-red"
      buttonLabel="OK"
      onNext={onNext}
    >
      <p className="text-sm text-wit-white">
        {"message" in response
          ? response.message
          : "Something went wrong; try again."}
      </p>
    </ResultShell>
  );
}

function ResultShell({
  title,
  accentClass,
  accentText,
  buttonLabel,
  onNext,
  children,
}: {
  title: string;
  accentClass: string;
  accentText: string;
  buttonLabel: string;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-card border ${accentClass} px-5 py-6 max-w-md mx-auto`}
    >
      <p
        className={`text-xs uppercase tracking-wider ${accentText} font-bold`}
      >
        {title}
      </p>
      <div className="mt-4">{children}</div>
      <button
        type="button"
        onClick={onNext}
        className="mt-6 w-full rounded-md bg-wit-red text-wit-onred font-bold py-2.5 hover:bg-wit-red-bright"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ParticipantBlock({
  participant,
  booth,
}: {
  participant: ParticipantProjection;
  booth: string;
}) {
  return (
    <div>
      <p className="text-lg font-bold text-wit-white">
        {participant.display_name}
      </p>
      <p className="text-sm text-wit-muted mt-1">
        City: {participant.city_name}
      </p>
      <p className="text-sm text-wit-muted">
        Chapter: {participant.chapter_name}
      </p>
      <p className="text-sm text-wit-muted">Booth: {booth}</p>
    </div>
  );
}
