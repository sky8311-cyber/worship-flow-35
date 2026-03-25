import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const pdfFile = formData.get("file") as File;
    if (!pdfFile) {
      return new Response(JSON.stringify({ error: "No PDF file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());

    // Use pdftoppm via Deno subprocess is not available in edge functions.
    // Instead, use pdf.js (pdfjs-dist) to render pages.
    // However, pdfjs-dist requires a canvas environment which is not natively available in Deno edge functions.
    // 
    // Alternative approach: Use a lightweight PDF page splitter with pdf-lib to split pages,
    // then use an image conversion service, OR upload each page as a single-page PDF.
    //
    // Best approach for Deno edge functions: Use @pdfme/pdf-lib to count pages,
    // then use pdftoppm-like conversion via a WASM-based renderer.
    //
    // Practical approach: Use pdf-lib to get page count and extract each page as a separate PDF,
    // then convert using resvg-wasm or similar. But this is complex.
    //
    // Most practical: Use pdf-lib to split, upload individual page PDFs, and let the frontend
    // handle rendering. BUT the user wants image files.
    //
    // Simplest reliable approach: Use the external API or a simpler method.
    // Let's use pdf-lib to get page info and render via canvas (OffscreenCanvas in Deno).

    // Import pdf-lib for page counting and splitting
    const { PDFDocument } = await import("https://esm.sh/pdf-lib@1.17.1");
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    const imageUrls: Array<{ url: string; page: number }> = [];
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    // For each page, create a single-page PDF and convert to PNG using pdfjs
    // Since we can't render in Deno easily, we'll use a different approach:
    // Upload each page as a separate single-page PDF, then use client-side rendering.
    // 
    // Actually, let's try using @aspect-build/pdfium or similar...
    // The most reliable approach in Deno: split PDF into single pages and upload as images
    // using a canvas-based approach with pdfjs.

    // Let's try using pdfjs-dist with a worker-less setup
    const pdfjsLib = await import("https://esm.sh/pdfjs-dist@4.4.168/build/pdf.mjs");
    
    // Disable worker since we're in edge function
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdfDocument = await loadingTask.promise;

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x for good quality
      
      // Use OffscreenCanvas (available in Deno)
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d")!;

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Convert canvas to PNG blob
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const arrayBuffer = await blob.arrayBuffer();
      const pngBytes = new Uint8Array(arrayBuffer);

      const fileName = `${timestamp}-${randomId}-page-${i}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("scores")
        .upload(fileName, pngBytes, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error(`Failed to upload page ${i}:`, uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("scores")
        .getPublicUrl(fileName);

      imageUrls.push({ url: publicUrl, page: i });
    }

    return new Response(JSON.stringify({ images: imageUrls, pageCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PDF conversion error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to convert PDF" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
