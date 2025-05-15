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

    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};