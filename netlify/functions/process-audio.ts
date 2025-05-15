import { Handler } from '@netlify/functions';
import { AudioContext } from 'web-audio-api';
import { Buffer } from 'buffer';

interface ProcessedAudio {
  buffer: Float32Array;
  sampleRate: number;
}

const applyJDillaEffect = async (audioBuffer: AudioBuffer): Promise<ProcessedAudio> => {
  const ctx = new AudioContext();
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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    if (!event.body) {
      throw new Error('No audio data provided');
    }

    const audioData = Buffer.from(event.body, 'base64');
    const ctx = new AudioContext();
    
    // Decode audio data
    const audioBuffer = await ctx.decodeAudioData(audioData.buffer);
    
    // Process audio
    const processed = await applyJDillaEffect(audioBuffer);
    
    // Convert back to buffer
    const processedBuffer = Buffer.from(processed.buffer.buffer);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Audio processed successfully',
        audioData: processedBuffer.toString('base64'),
        sampleRate: processed.sampleRate
      })
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing audio file' })
    };
  }
};