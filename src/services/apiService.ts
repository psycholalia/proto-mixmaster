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

    const taskId = response.data.taskId;
    return {
      status: 'success',
      message: 'Audio processed successfully',
      taskId,
    };
    
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const checkStatus = async (taskId: string, style: string) => {
    console.log(`${taskId}_${style}`)
    // Poll for completion
    let audioUrl = null;
    let attempts = 0;
    const maxAttempts = 30;
  while (!audioUrl && attempts < maxAttempts) {
    const statusResponse = await axios.get(`${API_URL}/status/${taskId}_${style}`);
    if (statusResponse.data.status === 'complete') {
      audioUrl = `${API_URL}/audio/${taskId}_${style}`;
      break;
    }
    attempts++;
  }
  if (!audioUrl) {
    throw new Error('Processing timeout');
  }
  return audioUrl
}