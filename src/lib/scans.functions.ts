import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const screenshotInput = z.object({
  imageBase64: z.string().min(100).max(9_000_000),
  fileName: z.string().min(1).max(200),
  context: z.string().max(1000).optional(),
});

const jobInput = z.object({
  company: z.string().max(160).optional(),
  role: z.string().max(160).optional(),
  recruiterEmail: z.string().max(200).optional(),
  offerText: z.string().min(30).max(15000),
});

const urlInput = z.object({ url: z.string().min(3).max(2048) });

const voiceInput = z.object({
  audioBase64: z.string().min(100).max(9_000_000),
  fileName: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
});

const deepfakeInput = z.object({
  mediaBase64: z.string().min(100).max(12_000_000),
  fileName: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
});

export const scanScreenshot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => screenshotInput.parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { analyzeScreenshot } = await import("./scan-engine.server");
    return analyzeScreenshot(data);
  });

export const scanJobOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => jobInput.parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { analyzeJobOffer } = await import("./scan-engine.server");
    return analyzeJobOffer(data);
  });

export const scanUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => urlInput.parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { analyzeUrl } = await import("./scan-engine.server");
    return analyzeUrl(data.url);
  });

export const scanVoice = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => voiceInput.parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { analyzeVoice } = await import("./scan-engine.server");
    return analyzeVoice(data);
  });

export const scanDeepfake = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => deepfakeInput.parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { analyzeDeepfake } = await import("./scan-engine.server");
    return analyzeDeepfake(data);
  });

export const listScans = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchScans } = await import("./scan-engine.server");
  return fetchScans();
});

export const getScan = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }: { data: any }) => {
    const { fetchScan } = await import("./scan-engine.server");
    return fetchScan(data.id);
  });

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchStats } = await import("./scan-engine.server");
  return fetchStats();
});
