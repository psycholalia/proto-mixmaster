import os
import uuid
from typing import List
import shutil
from fastapi import File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import librosa
import soundfile as sf
import numpy as np
import time
import asyncio
from app import app
import gc
from contextlib import contextmanager

# Use absolute paths and ensure directories exist
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

# Create directories if they don't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Constants for audio processing
CHUNK_SIZE = 1024 * 1024  # 1MB chunks for file handling
MAX_AUDIO_LENGTH = 600  # Maximum audio length in seconds
SAMPLE_RATE = 44100  # Standard sample rate

@contextmanager
def cleanup_files(*files):
    """Context manager to ensure file cleanup"""
    try:
        yield
    finally:
        for file in files:
            try:
                if os.path.exists(file):
                    os.remove(file)
            except Exception as e:
                print(f"Error cleaning up {file}: {e}")
        gc.collect()  # Force garbage collection

def process_in_chunks(y: np.ndarray, chunk_size: int, process_func):
    """Process audio data in chunks to reduce memory usage"""
    chunks = []
    for i in range(0, len(y), chunk_size):
        chunk = y[i:i + chunk_size]
        processed_chunk = process_func(chunk, i)  # Pass chunk index
        chunks.append(processed_chunk)
        gc.collect()  # Clean up after each chunk
    return np.concatenate(chunks)

@app.get("/")
def read_root():
    return {"message": "Audio Processing API"}

async def apply_steve_albini_effect(
    input_path: str,
    output_path: str,
    task_id: str,
    dynamics_ratio: float = 0.8,
    noise_floor: float = 0.005,
    saturation: float = 0.3
):
    """
    Process audio to sound like Steve Albini's recording style:
    - Minimal compression (preserve dynamics)
    - Slight analog saturation
    - Natural room ambience
    - Raw, punchy character
    """
    try:
        # Load audio with high quality settings
        y, sr = librosa.load(
            input_path,
            sr=SAMPLE_RATE,
            duration=MAX_AUDIO_LENGTH,
            mono=True
        )

        # Early cleanup
        if os.path.exists(input_path):
            os.remove(input_path)
        gc.collect()

        # Process in smaller chunks to manage memory
        chunk_size = sr * 2  # 2-second chunks
        output = np.zeros_like(y)
        
        for i in range(0, len(y), chunk_size):
            chunk = y[i:min(i + chunk_size, len(y))]
            
            # Add subtle analog noise
            noise = np.random.normal(0, noise_floor, len(chunk))
            chunk = chunk + noise
            
            # Apply subtle tape saturation
            chunk = np.tanh(chunk * (1 + saturation)) / (1 + saturation)
            
            # Preserve dynamics (anti-compression)
            peaks = np.abs(chunk) > dynamics_ratio
            chunk[peaks] *= 1.2  # Enhance peaks
            
            # Enhance transients
            if len(chunk) > 1:
                envelope = np.abs(chunk)
                transients = np.diff(envelope, prepend=envelope[0]) > 0.1
                chunk[transients] *= 1.3
            
            # Store processed chunk
            chunk_end = min(i + chunk_size, len(output))
            output[i:chunk_end] = chunk[:chunk_end-i]
            
            # Force garbage collection
            del chunk
            gc.collect()

        # Add room ambience as a separate pass
        room_delay = int(sr * 0.02)  # 20ms room reflection
        if len(output) > room_delay:
            room = np.zeros_like(output)
            room[room_delay:] = output[:-room_delay] * 0.1
            output = output + room
            del room
            gc.collect()

        # Normalize while preserving dynamics
        max_amplitude = np.max(np.abs(output))
        if max_amplitude > 0:
            output = output / max_amplitude * 0.9

        # Save with proper format settings
        sf.write(
            output_path,
            output,
            sr,
            format='WAV',
            subtype='PCM_16'
        )

        del output
        gc.collect()

        return {"status": "complete", "file_path": output_path}

    except Exception as e:
        print(f"Error processing audio: {e}")
        # Cleanup on error
        for path in [input_path, output_path]:
            if os.path.exists(path):
                os.remove(path)
        gc.collect()
        raise

async def apply_j_dilla_effect(
    input_path: str, 
    output_path: str,
    task_id: str,
    swing_amount: float = 0.3,
    quantize_strength: float = 0.7,
    time_stretch_factor: float = 0.98,
    lofi_amount: float = 0.4
):
    """
    Process audio to sound like J Dilla style with optimized memory usage
    """
    try:
        # Load audio in chunks with memory cleanup
        y, sr = librosa.load(
            input_path, 
            sr=SAMPLE_RATE,
            duration=MAX_AUDIO_LENGTH,  # Limit maximum duration
            mono=True  # Force mono to reduce memory usage
        )

        # Early cleanup of input file
        if os.path.exists(input_path):
            os.remove(input_path)
        gc.collect()

        # Process beats in smaller chunks
        hop_length = 512
        tempo, beat_frames = librosa.beat.beat_track(
            y=y, 
            sr=sr, 
            hop_length=hop_length,
            tightness=100  # Reduce computation complexity
        )
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)

        # Apply swing in chunks
        def apply_swing(chunk, chunk_start_idx):
            chunk_copy = chunk.copy()
            start_time = chunk_start_idx / sr
            end_time = (chunk_start_idx + len(chunk)) / sr
            
            # Find beats within this chunk
            chunk_beats = np.where((beat_times >= start_time) & 
                                 (beat_times < end_time))[0]
            
            for i in chunk_beats:
                if i % 2 == 1 and i+1 < len(beat_times):  # Only process odd-numbered beats
                    # Calculate swing timing
                    current_beat_time = beat_times[i] - start_time
                    next_beat_time = beat_times[i+1] - start_time if i+1 < len(beat_times) else end_time - start_time
                    beat_duration = next_beat_time - current_beat_time
                    
                    # Convert times to samples
                    beat_start = int(current_beat_time * sr)
                    swing_samples = int(swing_amount * beat_duration * sr)
                    
                    # Ensure we don't exceed array bounds
                    if beat_start >= 0 and beat_start + swing_samples < len(chunk):
                        # Create a temporary buffer for the swung section
                        temp = chunk[beat_start:beat_start + swing_samples].copy()
                        # Apply swing by shifting the audio
                        chunk_copy[beat_start:beat_start + swing_samples] = temp

            return chunk_copy

        # Process in chunks
        chunk_samples = sr * 5  # 5-second chunks
        y_swung = process_in_chunks(y, chunk_samples, apply_swing)
        del y
        gc.collect()

        # Time stretching in chunks
        def stretch_chunk(chunk, _):
            return librosa.effects.time_stretch(chunk, rate=time_stretch_factor)

        y_stretched = process_in_chunks(y_swung, chunk_samples, stretch_chunk)
        del y_swung
        gc.collect()

        # Lo-fi effects
        bit_depth = 16 - int(10 * lofi_amount)
        bit_crusher = float(2 ** (bit_depth - 1))
        
        def apply_lofi(chunk, _):
            # Quantize
            chunk_quantized = np.round(chunk * bit_crusher) / bit_crusher
            # Add vinyl noise (reduced amplitude)
            noise = np.random.normal(0, lofi_amount * 0.005, len(chunk_quantized))
            return chunk_quantized + noise

        y_processed = process_in_chunks(y_stretched, chunk_samples, apply_lofi)
        del y_stretched
        gc.collect()

        # Save with proper normalization
        max_amplitude = np.max(np.abs(y_processed))
        if max_amplitude > 0:
            y_processed = y_processed / max_amplitude * 0.95  # Prevent clipping

        # Write output file with proper cleanup
        sf.write(
            output_path, 
            y_processed, 
            sr,
            subtype='PCM_16'
        )
        
        del y_processed
        gc.collect()

        return {"status": "complete", "file_path": output_path}

    except Exception as e:
        print(f"Error processing audio: {e}")
        # Cleanup on error
        for path in [input_path, output_path]:
            if os.path.exists(path):
                os.remove(path)
        gc.collect()
        raise

@app.post("/process-audio")
async def process_audio(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    style: str = "dilla"  # Add style parameter
):
    """
    Upload and process audio file with proper resource management
    """
    if not audio.content_type or "audio/mpeg" not in audio.content_type:
        raise HTTPException(
            status_code=400, 
            detail="Only MP3 files are accepted"
        )
    
    task_id = str(uuid.uuid4())
    file_extension = os.path.splitext(audio.filename)[1] if audio.filename else ".mp3"
    
    input_path = os.path.join(UPLOAD_DIR, f"{task_id}{file_extension}")
    output_path = os.path.join(PROCESSED_DIR, f"{task_id}_{style}{file_extension}")
    
    try:
        # Write file in chunks to manage memory
        with open(input_path, "wb") as buffer:
            while chunk := await audio.read(CHUNK_SIZE):
                buffer.write(chunk)
                await asyncio.sleep(0)  # Allow other tasks to run
        
        # Choose processing function based on style
        process_func = apply_j_dilla_effect if style == "dilla" else apply_steve_albini_effect
        
        background_tasks.add_task(
            process_func,
            input_path=input_path,
            output_path=output_path,
            task_id=task_id
        )
        
        return {
            "status": "success",
            "message": "Audio processing started",
            "taskId": task_id
        }
    except Exception as e:
        # Cleanup on error
        for path in [input_path, output_path]:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/audio/{file_id}")
async def get_audio(file_id: str):
    """
    Stream audio file response to manage memory
    """
    try:
        for file in os.listdir(PROCESSED_DIR):
            if file.startswith(file_id):
                file_path = os.path.join(PROCESSED_DIR, file)
                return FileResponse(
                    file_path,
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": f"attachment; filename={file}"
                    }
                )
        
        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving audio: {str(e)}"
        )

@app.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Check processing status
    """
    try:
        # Check processed file first
        for file in os.listdir(PROCESSED_DIR):
            if file.startswith(task_id):
                return {
                    "status": "complete",
                    "taskId": task_id,
                    "audioUrl": f"/audio/{task_id}"
                }
        
        # Check if still processing
        for file in os.listdir(UPLOAD_DIR):
            if file.startswith(task_id):
                return {
                    "status": "processing",
                    "taskId": task_id
                }
        
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking status: {str(e)}"
        )