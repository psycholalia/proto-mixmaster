import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Disc, RefreshCw } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { checkStatus } from '../services/apiService';

type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';
type MixObject = {
  name: string;
  firstLast: string;
  mix: string;
};

const TaskView: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [status, setStatus] = useState<ProcessingStatus>('processing');
  const [remixedAudio, setRemixedAudio] = useState<Array<MixObject>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!taskId) return;

      try {
        const producers = ['dilla', 'albini', 'burns'];
        const holderArray: MixObject[] = [];

        for (const producer of producers) {
          const audioUrl = await checkStatus(taskId, producer);
          if (audioUrl) {
            let producerName = producer === 'dilla' 
              ? 'J. Dilla' 
              : producer === 'albini' 
                ? 'Steve Albini' 
                : 'Scott Burns';

            holderArray.push({
              name: producer,
              firstLast: producerName,
              mix: audioUrl
            });
          }
        }

        setRemixedAudio(holderArray);
        setStatus('complete');
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus('error');
        setErrorMessage('Failed to load the remixed tracks. Please try again later.');
      }
    };

    fetchStatus();
  }, [taskId]);

  if (status === 'error') {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300">
        <p>{errorMessage || 'An unexpected error occurred'}</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center justify-center space-x-2 text-white/70 p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span>Processing your audio...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Disc className="h-8 w-8 text-secondary-400" />
        <h2 className="text-2xl font-bold">Your Remixed Tracks</h2>
      </div>

      {remixedAudio.map((mix, index) => (
        <div key={mix.name} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-white/80">{mix.firstLast} Style</h4>
            <AudioPlayer audioUrl={mix.mix} />
          </div>
          <div className="flex justify-center">
            <a 
              href={mix.mix} 
              download={`${mix.name}_remix`}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download {mix.firstLast} Mix</span>
            </a>
          </div>
          {index < remixedAudio.length - 1 && <hr className="border-white/10" />}
        </div>
      ))}
    </motion.div>
  );
};

export default TaskView;