import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? 'https://proto-mixmaster-server-production.up.railway.app'  // Replace with your Railway URL
  : 'http://localhost:8000';

interface ProgressCallback {
  (progressEvent: { loaded: number; total: number }): void;
}

export const processAudio = async (formData: FormData, onProgress?: ProgressCallback) => {
  try {
    const response = await axios.post(`${API_URL}/process-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });

    // Poll for completion
    const taskId = response.data.taskId;
    let audioUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!audioUrl && attempts < maxAttempts) {
      const statusResponse = await axios.get(`${API_URL}/status/${taskId}`);
      if (statusResponse.data.status === 'complete') {
        audioUrl = `${API_URL}/audio/${taskId}`;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between polls
      attempts++;
    }

    if (!audioUrl) {
      throw new Error('Processing timeout');
    }

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