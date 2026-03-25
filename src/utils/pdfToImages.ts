import * as pdfjsLib from "pdfjs-dist";

// Set up the worker using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfPageImage {
  blob: Blob;
  page: number;
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
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: PdfPageImage[] = [];

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
    canvas.remove();
  }

  return results;
}
