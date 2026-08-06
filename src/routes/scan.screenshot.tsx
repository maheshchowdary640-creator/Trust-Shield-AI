import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ErrorPanel, GlassCard, ScanningOverlay } from "@/components/security-ui";
import { ScanResultView } from "@/components/scan-result-view";
import { scanScreenshot } from "@/lib/scans.functions";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/scan/screenshot")({
  head: () => ({
    meta: [
      { title: "Screenshot Scam Detector — TrustShield AI" },
      {
        name: "description",
        content:
          "Upload a screenshot of a suspicious message, email or payment page and get an AI scam analysis with a trust score and recommended action.",
      },
      { property: "og:title", content: "Screenshot Scam Detector — TrustShield AI" },
      {
        property: "og:description",
        content: "Drag and drop a screenshot to detect phishing, impersonation and fraud signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <ScreenshotScanner />
    </AuthGuard>
  ),
});

const MAX_BYTES = 6 * 1024 * 1024;

function ScreenshotScanner() {
  const run = useServerFn(scanScreenshot);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [context, setContext] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: { imageBase64: string; fileName: string; context?: string }) =>
      run({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const accept = useCallback((f: File) => {
    setFileError(null);
    if (!f.type.startsWith("image/")) {
      setFileError("Please upload a PNG, JPG or WEBP image.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError("Image is larger than 6 MB. Please upload a smaller screenshot.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, dataUrl: String(reader.result) });
    reader.onerror = () => setFileError("Could not read that file.");
    reader.readAsDataURL(f);
  }, []);

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? "Scan failed."
        : null;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Screenshot Scam Detector</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Drop a screenshot of the message, email, invoice, checkout or profile you are unsure
          about. Analysis reads the visible content for fraud indicators.
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
            <UploadCloud className="size-8 text-primary" />
            <p className="mt-3 text-sm font-medium">Drag &amp; drop a screenshot</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse · PNG, JPG, WEBP · max 6 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
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

          {file && (
            <div className="mt-4 rounded-xl border border-glass-border bg-card/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-mono text-xs text-muted-foreground">{file.name}</p>
                <button
                  onClick={() => setFile(null)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>
              <img
                src={file.dataUrl}
                alt="Uploaded screenshot preview"
                className="mt-3 max-h-72 w-full rounded-lg object-contain"
              />
            </div>
          )}

          <label className="mt-5 block text-xs uppercase tracking-widest text-muted-foreground">
            Context (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="e.g. Received this from someone claiming to be my bank"
            className="mt-2 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
          />

          <button
            disabled={!file || mutation.isPending}
            onClick={() =>
              file &&
              mutation.mutate({
                imageBase64: file.dataUrl,
                fileName: file.name,
                ...(context.trim() ? { context: context.trim() } : {}),
              })
            }
            className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {mutation.isPending ? "Analyzing screenshot…" : "Analyze screenshot"}
          </button>
        </GlassCard>

        <div>
          {mutation.isPending && <ScanningOverlay label="Reading screenshot for fraud signals" />}
          {errorMessage && !mutation.isPending && <ErrorPanel message={errorMessage} />}
          {!!mutation.data && !mutation.isPending && <ScanResultView scan={mutation.data as any} />}
          {!mutation.isPending && !mutation.data && !errorMessage && (
            <GlassCard className="flex h-full min-h-64 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Your analysis report will appear here.
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
