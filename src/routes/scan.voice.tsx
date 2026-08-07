import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState, useEffect } from "react";
import { UploadCloud, X, Mic, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, ScanningOverlay } from "@/components/security-ui";
import { ScanResultView } from "@/components/scan-result-view";
import { scanVoice } from "@/lib/scans.functions";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/scan/voice")({
  head: () => ({
    meta: [
      { title: "Voice Scam Agent — TrustShield AI" },
      {
        name: "description",
        content:
          "Upload phone call audio or voice messages to detect OTP, lottery, bank, loan, investment and impersonation scams using AI analysis.",
      },
    ],
  }),
  component: () => (
    <AuthGuard>
      <VoiceScanner />
    </AuthGuard>
  ),
});

const MAX_BYTES = 10 * 1024 * 1024;

function VoiceScanner() {
  const run = useServerFn(scanVoice);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const accept = useCallback(
    (f: File) => {
      mutation.reset();
      setTranscript("");
      setFileDataUrl(null);
      setFileError(null);
      setProgress(0);
      setUploading(false);

      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext !== "mp3" && ext !== "wav" && !f.type.startsWith("audio/")) {
        setFileError("Please upload an MP3 or WAV audio file.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setFileError("Audio file is larger than 10 MB. Please upload a smaller recording.");
        return;
      }

      setRawFile(f);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(URL.createObjectURL(f));

      // Convert to base64 for submission
      setUploading(true);
      const reader = new FileReader();

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            return 100;
          }
          return prev + 25;
        });
      }, 150);

      reader.onload = () => {
        setFileDataUrl(String(reader.result));
      };
      reader.onerror = () => {
        clearInterval(interval);
        setUploading(false);
        setFileError("Could not read that audio file.");
      };
      reader.readAsDataURL(f);
    },
    [audioUrl],
  );

  const [transcript, setTranscript] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: { audioBase64: string; fileName: string; type: string; transcript?: string }) =>
      run({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.refetchQueries({ queryKey: ["dashboard-stats"] });
      queryClient.refetchQueries({ queryKey: ["scan-history"] });
    },
  });

  const handleRemove = () => {
    setRawFile(null);
    setFileDataUrl(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setProgress(0);
    setFileError(null);
    mutation.reset();
  };

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? "Voice scam scan failed."
        : null;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Voice Scam Agent</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload an MP3 or WAV recording or paste the call speech transcript below to audit for OTP, bank, and social engineering scams.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) accept(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <Mic className="size-8 text-primary animate-pulse" />
            <p className="mt-3 text-sm font-medium">Drag &amp; drop voice recording</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse · MP3, WAV · max 10 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) accept(f);
              }}
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Call Transcript / Text Context (Optional)
            </label>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Your bank account has been suspended. Please provide the OTP sent to your phone immediately to verify your identity."
              className="w-full rounded-xl border border-input bg-background/60 p-3 text-xs outline-none focus:border-primary"
            />
          </div>

          {fileError && (
            <div className="mt-4">
              <ErrorPanel message={fileError} />
            </div>
          )}

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Reading audio payload…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {rawFile && !uploading && (
            <div className="mt-4 rounded-xl border border-glass-border bg-card/40 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Volume2 className="size-4 text-primary shrink-0" />
                  <span className="truncate font-mono text-xs font-medium text-foreground">
                    {rawFile.name}
                  </span>
                </div>
                <button
                  onClick={handleRemove}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Remove audio"
                >
                  <X className="size-4" />
                </button>
              </div>

              {audioUrl && (
                <audio controls className="w-full mt-2 rounded-lg bg-background/50 outline-none">
                  <source src={audioUrl} type={rawFile.type} />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          )}

          <button
            disabled={(!fileDataUrl && transcript.trim().length === 0) || mutation.isPending || uploading}
            onClick={() =>
              mutation.mutate({
                audioBase64: fileDataUrl || "data:audio/mp3;base64,QUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5",
                fileName: rawFile ? rawFile.name : (transcript.slice(0, 50) || "Voice_Recording.mp3"),
                type: rawFile ? (rawFile.type || "audio/mpeg") : "audio/mpeg",
                transcript: transcript.trim(),
              })
            }
            className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {mutation.isPending ? "Analyzing voice patterns…" : "Analyze voice scan"}
          </button>
        </GlassCard>

        <div>
          {mutation.isPending && <ScanningOverlay label="De-noising audio and auditing script" />}
          {errorMessage && !mutation.isPending && <ErrorPanel message={errorMessage} />}
          {!!mutation.data && !mutation.isPending && (
            <div className="space-y-4">
              <ScanResultView scan={mutation.data as any} />

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    Voice Scanner Metrics &amp; Speech Audit
                  </h3>
                  <span className="font-mono text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border">
                    Scan ID: {String((mutation.data as any).id || "N/A")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl border border-glass-border bg-card/20 p-4 text-center">
                    <span className="text-xs text-muted-foreground">Scam Risk Score</span>
                    <p className="text-3xl font-display mt-1 text-danger">
                      {String((mutation.data as any).details.scam_risk_score ?? "0")}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-card/20 p-4 text-center">
                    <span className="text-xs text-muted-foreground">Transcription Confidence</span>
                    <p className="text-3xl font-display mt-1 text-primary">
                      {String((mutation.data as any).details.confidence_percentage ?? "0")}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-glass-border bg-card/20 p-4 text-center col-span-2">
                    <span className="text-xs text-muted-foreground">Gemini Classification</span>
                    <p className="text-lg font-semibold mt-1 text-foreground">
                      {String((mutation.data as any).details.scam_type ?? "N/A")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-glass-border bg-card/40 p-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Extracted Speech Transcript
                  </span>
                  <p className="mt-2 text-xs italic font-serif text-foreground/90 bg-background/50 p-3 rounded-lg border border-border/50">
                    "{String((mutation.data as any).details.raw_transcript || "Transcript extracted from audio recording.")}"
                  </p>
                </div>
              </GlassCard>
            </div>
          )}
          {!mutation.isPending && !mutation.data && !errorMessage && (
            <GlassCard className="flex h-full min-h-64 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Voice analysis reports will appear here.
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
