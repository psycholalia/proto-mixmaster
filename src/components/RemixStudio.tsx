import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Download, Disc, RefreshCw, X } from 'lucide-react';
import FileUploader from './FileUploader';
import ProgressBar from './ProgressBar';
import AudioPlayer from './AudioPlayer';
import { processAudio } from '../services/apiService';

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

const RemixStudio: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [originalAudio, setOriginalAudio] = useState<string | null>(null);
  const [remixedAudio, setRemixedAudio] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    
    setFileName(file.name);
    setStatus('uploading');
    setProgress(0);
    setErrorMessage(null);
    
    // Create a URL for the original audio file
    setOriginalAudio(URL.createObjectURL(file));
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await processAudio(formData, (progressEvent) => {
        // Handle progress updates
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
        
        if (percentCompleted >= 100) {
          setStatus('processing');
        }
      });
      // Handle the successful response
      setRemixedAudio(response.audioUrl);
      setStatus('complete');
    } catch (error) {
      console.error('Error processing audio:', error);
      setStatus('error');
      setErrorMessage('There was an error processing your audio file. Please try again.');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setProgress(0);
    setOriginalAudio(null);
    setRemixedAudio(null);
    setErrorMessage(null);
    setFileName('');
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6 shadow-lg border border-white/10">
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FileUploader 
              onFileSelected={handleFileSelected} 
              ref={fileInputRef}
            />
          </motion.div>
        ) : (
          <motion.div
            key="processor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Disc className="h-8 w-8 text-secondary-400" />
                <div>
                  <h3 className="font-medium text-lg truncate max-w-[200px] md:max-w-[400px]">
                    {fileName}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {status === 'uploading' && 'Uploading...'}
                    {status === 'processing' && 'Applying J Dilla magic...'}
                    {status === 'complete' && 'Ready to download!'}
                    {status === 'error' && 'Processing failed'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetState}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Reset"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {(status === 'uploading' || status === 'processing') && (
              <div className="space-y-2">
                <ProgressBar value={progress} />
                {status === 'processing' && (
                  <div className="flex items-center justify-center space-x-2 text-white/70">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing your audio...</span>
                  </div>
                )}
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300">
                <p>{errorMessage || 'An unexpected error occurred'}</p>
                <button 
                  onClick={resetState}
                  className="mt-2 text-white bg-red-700/50 px-3 py-1 rounded-md hover:bg-red-700/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {status === 'complete' && remixedAudio && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-white/80">Original</h4>
                    {originalAudio && <AudioPlayer audioUrl={originalAudio} />}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-white/80">Remixed (J Dilla Style)</h4>
                    <AudioPlayer audioUrl={remixedAudio} />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <a 
                    href={remixedAudio} 
                    download={`dilla_remix_${fileName}`}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Remixed Track</span>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RemixStudio;