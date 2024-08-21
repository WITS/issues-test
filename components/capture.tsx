'use client';

import { useState, useRef, useCallback } from 'react';

export function ScreenCapture() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureScreen = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      // Try to capture only the current tab
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
        // @ts-expect-error This does exist in _some_ browsers
        preferCurrentTab: true, // This is a non-standard option that some browsers might support
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          // Capture frame after a short delay to ensure the video is playing
          setTimeout(() => {
            captureFrame(stream);
          }, 100);
        };
      }
    } catch (err) {
      console.error('Error starting screen capture:', err);
      setError(
        'Failed to capture screen. Please ensure you have granted the necessary permissions.',
      );
      setIsCapturing(false);
    }
  }, []);

  const captureFrame = (stream: MediaStream) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas
        .getContext('2d')
        ?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/png');
      setCapturedImage(imageDataUrl);

      // Stop all tracks on the stream to release the screen capture
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const downloadImage = useCallback(() => {
    if (capturedImage) {
      const a = document.createElement('a');
      a.href = capturedImage;
      a.download = 'tab-capture.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [capturedImage]);

  return (
    <div
      className="w-full max-w-md mx-auto"
      style={isCapturing ? { display: 'none' } : undefined}
    >
      <header>
        <h1>Tab Capture</h1>
      </header>
      <main>
        <div className="flex flex-col items-center space-y-4">
          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
          {error ? (
            // <Alert variant="destructive">
            //   <AlertCircle className="h-4 w-4" />
            //   <AlertTitle>Error</AlertTitle>
            //   <AlertDescription>{error}</AlertDescription>
            // </Alert>
            "There's an error!"
          ) : capturedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage}
              alt="Captured tab"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{
                width: '60vw',
              }}
            />
          ) : (
            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                {isCapturing ? 'Capturing...' : 'No image captured'}
              </p>
            </div>
          )}
          <button
            onClick={captureScreen}
            disabled={isCapturing}
            className="w-full"
            type="button"
          >
            {/* <Camera className="w-4 h-4 mr-2" /> */}
            {isCapturing ? 'Capturing...' : 'Capture Tab'}
          </button>
        </div>
      </main>
      <footer>
        <button
          onClick={downloadImage}
          disabled={!capturedImage}
          className="w-full"
          type="button"
        >
          {/* <Download className="w-4 h-4 mr-2" /> */} Download Image
        </button>
      </footer>
    </div>
  );
}
