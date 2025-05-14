import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? 'https://j-dilla-remix-api.up.railway.app'  // Replace this with your actual Railway URL after deployment
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