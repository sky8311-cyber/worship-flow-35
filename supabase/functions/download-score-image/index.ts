import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Downloading image from URL:', url);

    // Fetch the image from the URL
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('Image downloaded, size:', uint8Array.length, 'bytes');

    // Determine file extension from content type
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('pdf')) extension = 'pdf';
    else if (contentType.includes('gif')) extension = 'gif';

    // Generate unique filename
    const fileName = `scores/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('scores')
      .upload(fileName, uint8Array, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    console.log('Upload successful:', data.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('scores')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ 
        url: publicUrlData.publicUrl,
        path: data.path,
        contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in download-score-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
