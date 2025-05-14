# J Dilla Remix Studio

A full-stack web application that allows users to upload MP3 audio files and remix them in the style of legendary producer J Dilla.

## Features

- Drag-and-drop file upload with progress indicator
- Audio processing with J Dilla-style effects:
  - Beat slicing and rearrangement
  - Swing rhythm quantization
  - Time stretching for that dragged feel
  - Lo-fi vinyl and bit reduction effects
- Waveform visualization and audio playback
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, WaveSurfer.js
- **Backend**: FastAPI (Python), Librosa for audio processing
- **Design**: Custom dark theme with vinyl-inspired aesthetics

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/j-dilla-remix-app.git
   cd j-dilla-remix-app
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Install Python backend dependencies:
   ```
   cd server
   pip install -r requirements.txt
   cd ..
   ```

### Running the Application

1. Start the backend server:
   ```
   npm run server
   ```

2. In a new terminal, start the frontend development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Audio Processing

The application uses the following techniques to create J Dilla-style remixes:

- **Beat Detection**: Identifies the beats in the original track
- **Swing Quantization**: Applies J Dilla's signature swing feel to the beats
- **Time Stretching**: Creates that slightly dragged feeling
- **Lo-fi Effects**: Adds vinyl crackle and bit reduction for warmth
- **Beat Slicing**: Subtly rearranges beat timings

## License

MIT

## Acknowledgements

- J Dilla (James Dewitt Yancey) for his revolutionary contributions to music
- Librosa team for their audio processing library
- WaveSurfer.js for audio visualization