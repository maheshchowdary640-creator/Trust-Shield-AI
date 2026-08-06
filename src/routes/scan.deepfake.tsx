import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState, useEffect } from "react";
import { UploadCloud, X, ScanEye, Film, FileImage } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, ScanningOverlay } from "@/components/security-ui";
import { ScanResultView } from "@/components/scan-result-view";
import { scanDeepfake } from "@/lib/scans.functions";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/scan/deepfake")({
  head: () => ({
    meta: [
      { title: "Deepfake Detection Agent — TrustShield AI" },
      {
        name: "description",
        content:
          "Upload images or videos to inspect facial borders, eyes, lighting, texture, and AI artifacts to determine authenticity.",
      },
    ],
  }),
  component: () => (
    <AuthGuard>
      <DeepfakeScanner />
    </AuthGuard>
  ),
});

const MAX_BYTES = 12 * 1024 * 1024;

function DeepfakeScanner() {
  const run = useServerFn(scanDeepfake);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const accept = useCallback(
    (f: File) => {
      setFileError(null);
      setProgress(0);
      setUploading(false);

      const ext = f.name.split(".").pop()?.toLowerCase();
      const validExts = ["jpg", "jpeg", "png", "mp4", "mov", "webm"];
      const isImage = f.type.startsWith("image/");
      const isVideo = f.type.startsWith("video/");

      if (!validExts.includes(ext ?? "") && !isImage && !isVideo) {
        setFileError("Supported formats: JPG, JPEG, PNG, MP4, MOV, WEBM.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setFileError("File is larger than 12 MB. Please upload a smaller file.");
        return;
      }

      setRawFile(f);
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
      setMediaUrl(URL.createObjectURL(f));

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
        setFileError("Could not read that media file.");
      };
      reader.readAsDataURL(f);
    },
    [mediaUrl],
  );

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: { mediaBase64: string; fileName: string; type: string }) =>
      run({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const handleRemove = () => {
    setRawFile(null);
    setFileDataUrl(null);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
    }
    setProgress(0);
    setFileError(null);
    mutation.reset();
  };

  const isImg = rawFile?.type.startsWith("image/");
  const isVid = rawFile?.type.startsWith("video/");

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? "Deepfake scan failed."
        : null;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Deepfake Detection Agent</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload any profile image, proof-of-identity photo, or short video clip. We audit lighting
          coherence, facial borders, pupil reflections, and skin textures.
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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <ScanEye className="size-8 text-primary animate-pulse" />
            <p className="mt-3 text-sm font-medium">Drag &amp; drop profile media</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse · JPG, PNG, MP4, MOV, WEBM · max 12 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) accept(f);
              }}
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
                <span>Reading media buffer…</span>
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
                  {isImg ? (
                    <FileImage className="size-4 text-primary shrink-0" />
                  ) : (
                    <Film className="size-4 text-primary shrink-0" />
                  )}
                  <span className="truncate font-mono text-xs font-medium text-foreground">
                    {rawFile.name}
                  </span>
                </div>
                <button
                  onClick={handleRemove}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Remove media"
                >
                  <X className="size-4" />
                </button>
              </div>

              {mediaUrl && isImg && (
                <img
                  src={mediaUrl}
                  alt="Uploaded target preview"
                  className="max-h-72 w-full rounded-lg object-contain mt-2"
                />
              )}

              {mediaUrl && isVid && (
                <video controls className="max-h-72 w-full rounded-lg mt-2 bg-background/50">
                  <source src={mediaUrl} type={rawFile.type} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}

          <button
            disabled={!fileDataUrl || mutation.isPending || uploading}
            onClick={() =>
              fileDataUrl &&
              rawFile &&
              mutation.mutate({
                mediaBase64: fileDataUrl,
                fileName: rawFile.name,
                type: rawFile.type || "image/png",
              })
            }
            className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {mutation.isPending ? "Auditing biological markers…" : "Analyze deepfake scan"}
          </button>
        </GlassCard>

        <div>
          {mutation.isPending && (
            <ScanningOverlay label="Scanning facial vectors & frequency domains" />
          )}
          {errorMessage && !mutation.isPending && <ErrorPanel message={errorMessage} />}
          {!!mutation.data && !mutation.isPending && (
            <div className="space-y-4">
              <ScanResultView scan={mutation.data as any} />

              <GlassCard className="p-6">
                <h3 className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Deepfake Diagnostic Breakdown
                </h3>
                <ul className="mt-4 space-y-3 font-sans text-sm">
                  <li className="flex flex-col gap-1 rounded-xl border border-glass-border bg-card/20 p-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-display font-medium">
                      Facial Consistency
                    </span>
                    <p className="text-foreground mt-0.5">
                      {String((mutation.data as any).details.facial_consistency ?? "Normal")}
                    </p>
                  </li>
                  <li className="flex flex-col gap-1 rounded-xl border border-glass-border bg-card/20 p-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-display font-medium">
                      Eye Analysis
                    </span>
                    <p className="text-foreground mt-0.5">
                      {String((mutation.data as any).details.eye_analysis ?? "Normal")}
                    </p>
                  </li>
                  <li className="flex flex-col gap-1 rounded-xl border border-glass-border bg-card/20 p-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-display font-medium">
                      Lighting Consistency
                    </span>
                    <p className="text-foreground mt-0.5">
                      {String((mutation.data as any).details.lighting_consistency ?? "Normal")}
                    </p>
                  </li>
                  <li className="flex flex-col gap-1 rounded-xl border border-glass-border bg-card/20 p-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-display font-medium">
                      Texture Analysis
                    </span>
                    <p className="text-foreground mt-0.5">
                      {String((mutation.data as any).details.texture_analysis ?? "Normal")}
                    </p>
                  </li>
                  <li className="flex flex-col gap-1 rounded-xl border border-glass-border bg-card/20 p-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-display font-medium">
                      AI Artifact Detection
                    </span>
                    <p className="text-foreground mt-0.5">
                      {String((mutation.data as any).details.ai_artifact_detection ?? "Normal")}
                    </p>
                  </li>
                </ul>
              </GlassCard>
            </div>
          )}
          {!mutation.isPending && !mutation.data && !errorMessage && (
            <GlassCard className="flex h-full min-h-64 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Deepfake scan diagnostic details will appear here.
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
