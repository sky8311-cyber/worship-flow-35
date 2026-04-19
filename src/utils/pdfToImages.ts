// pdfjs-dist is dynamically imported on first use to avoid loading the worker
// (~several MB) into pages like SetBuilder that may never call this function.
// This is critical for low-RAM devices (iPad Safari/Chrome ~250MB tab limit).

interface PdfPageImage {
  blob: Blob;
  page: number;
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

/**
 * Converts a PDF file to an array of PNG image blobs (one per page).
 * Runs entirely in the browser using pdfjs-dist + canvas.
 */
export async function convertPdfToImages(
  file: File,
  scale = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<PdfPageImage[]> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: PdfPageImage[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.(i, pdf.numPages);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
          "image/png"
        );
      });

      results.push({ blob, page: i });

      // Explicit cleanup: free canvas memory + release page resources
      canvas.width = 0;
      canvas.height = 0;
      canvas.remove();
      page.cleanup();
    }
  } finally {
    // Release the PDF document — important for iPad memory
    await pdf.destroy().catch(() => {});
  }

  return results;
}
