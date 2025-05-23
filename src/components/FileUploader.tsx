import React, { forwardRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Music } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
}

const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(
  ({ onFileSelected }, ref) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'audio/mpeg': ['.mp3'],
      },
      maxFiles: 1,
      maxSize: 50 * 1024 * 1024, // 50MB max
      onDrop: (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
          onFileSelected(acceptedFiles[0]);
        }
      },
    });

    return (
      <div className="text-center">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-primary-400 bg-primary-900/20' 
              : 'border-white/20 hover:border-primary-400/50 hover:bg-primary-900/10'
          }`}
        >
          <input {...getInputProps({ ref })} />
          
          <motion.div
            animate={{ 
              y: isDragActive ? [0, -10, 0] : 0 
            }}
            transition={{ 
              repeat: isDragActive ? Infinity : 0, 
              duration: 1.5 
            }}
            className="flex flex-col items-center"
          >
            {isDragActive ? (
              <Music className="h-16 w-16 text-primary-400 mb-4" />
            ) : (
              <Upload className="h-16 w-16 text-white/40 mb-4" />
            )}
            
            <h3 className="text-xl font-medium mb-2">
              {isDragActive 
                ? "Drop it like it's hot!" 
                : "Drag & drop your MP3 file"}
            </h3>
            
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Upload your audio track and we'll transform it in a virtual seance with J. Dilla
              Steve Albini and Scott Burns.
            </p>
            
            <button 
              type="button" 
              className="btn btn-primary flex items-center space-x-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Music className="h-4 w-4" />
              <span>Select MP3 File</span>
            </button>
            
            <p className="mt-4 text-sm text-white/40">
              Maximum file size: 50MB
            </p>
          </motion.div>
        </div>
      </div>
    );
  }
);

FileUploader.displayName = 'FileUploader';

export default FileUploader;