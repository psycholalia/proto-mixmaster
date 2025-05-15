import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

interface ProgressCallback {
  (progressEvent: { loaded: number; total: number }): void;
}

export const processAudio = async (formData: FormData, onProgress?: ProgressCallback) => {
  try {
    const file = formData.get('audio') as File;
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const response = await axios.post(`${API_URL}/process-audio`, base64Data, {
      headers: {
        'Content-Type': 'application/json',
      },
      onUploadProgress: onProgress,
    });

    // Convert base64 audio data back to blob
    const audioData = Buffer.from(response.data.audioData, 'base64');
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      status: 'success',
      message: 'Audio processed successfully',
      audioUrl,
    };
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};