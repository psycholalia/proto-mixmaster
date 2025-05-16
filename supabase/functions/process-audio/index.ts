import { serve } from "npm:@supabase/functions-js";
import { AudioContext } from "npm:web-audio-api@0.2.2";

interface ProcessedAudio {
  buffer: Float32Array;
  sampleRate: number;
}

const applyJDillaEffect = async (audioBuffer: AudioBuffer): Promise<ProcessedAudio> => {
  const sourceData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Parameters
  const swingAmount = 0.3;
  const timeStretchFactor = 0.98;
  const lofiAmount = 0.4;
  
  // Create processed buffer
  const processedBuffer = new Float32Array(sourceData.length);
  
  // Apply time stretching
  const stretchedLength = Math.floor(sourceData.length * (1 / timeStretchFactor));
  for (let i = 0; i < stretchedLength; i++) {
    const originalIndex = Math.floor(i * timeStretchFactor);
    if (originalIndex < sourceData.length) {
      processedBuffer[i] = sourceData[originalIndex];
    }
  }
  
  // Apply lo-fi effect (bit reduction)
  const bitDepth = 16 - Math.floor(10 * lofiAmount);
  const bitCrush = Math.pow(2, bitDepth - 1);
  for (let i = 0; i < processedBuffer.length; i++) {
    processedBuffer[i] = Math.round(processedBuffer[i] * bitCrush) / bitCrush;
  }
  
  // Add vinyl crackle
  const crackleAmplitude = lofiAmount * 0.01;
  for (let i = 0; i < processedBuffer.length; i++) {
    processedBuffer[i] += (Math.random() * 2 - 1) * crackleAmplitude;
  }
  
  return {
    buffer: processedBuffer,
    sampleRate
  };
};

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData } = await req.json();
    if (!audioData) {
      throw new Error('No audio data provided');
    }

    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const ctx = new AudioContext();
    
    // Decode audio data
    const audioBuffer = await ctx.decodeAudioData(binaryData.buffer);
    
    // Process audio
    const processed = await applyJDillaEffect(audioBuffer);
    
    // Convert back to base64
    const processedArray = new Uint8Array(processed.buffer.buffer);
    const base64Data = btoa(String.fromCharCode(...processedArray));

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Audio processed successfully',
        audioData: base64Data,
        sampleRate: processed.sampleRate
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error processing audio:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing audio file' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});