import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Download, Copy, Trash2, ArrowLeft, Volume2 } from 'lucide-react';

interface VoiceTranscriptionPageProps {
  onBack?: () => void;
}

const VoiceTranscriptionPage: React.FC<VoiceTranscriptionPageProps> = ({ onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // First thing we do on load is check if our API is working
  useEffect(() => {
    checkApiAvailability();
    
    // Cleanup function - always good to avoid memory leaks!
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl); // Free up memory from any audio blobs
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Stop any running timers
      }
    };
  }, [audioUrl]);

  // This handles the recording timer - wanted to show users how long they've been recording
  useEffect(() => {
    if (isRecording) {
      // Update the timer every second while recording
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Clean up when we stop recording
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Reset the timer if we don't have any audio yet
      if (!audioUrl) {
        setRecordingDuration(0);
      }
    }

    // More cleanup - React has made me paranoid about memory leaks!
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, audioUrl]);

  // Simple helper to format seconds into MM:SS - makes the UI nicer
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`; // Pad with leading zero for single digits
  };

  // This checks if our transcription API is working - had some issues with this during development
  const checkApiAvailability = async () => {
    setApiStatus('checking');
    setDebugInfo('🔍 Checking API availability...'); // I like using emojis in debug messages
    
    try {
      // Send an empty request to see if the API responds correctly
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: '' }),
      });
      
      setDebugInfo(`📡 API Response: ${response.status} ${response.statusText}`);
      
      // A 400 is actually good here - means the API exists but rejected our empty request
      if (response.status === 400) {
        setApiStatus('available');
        setError('');
        setDebugInfo('✅ API endpoint available and configured correctly');
      } else if (response.status === 404) {
        // This means the API route doesn't exist at all
        setApiStatus('unavailable');
        setError('API endpoint not found. Missing /api/transcribe route.');
        setDebugInfo('❌ API endpoint not found at /api/transcribe');
      } else if (response.status === 500) {
        // Server error - probably a configuration issue
        const data = await response.json();
        setApiStatus('unavailable');
        setError(data.error || 'Server configuration error. Check your API key.');
        setDebugInfo(`🔧 Server error: ${JSON.stringify(data)}`);
      } else {
        // Any other response we'll assume is okay
        setApiStatus('available');
        setDebugInfo(`✅ API available (status: ${response.status})`);
      }
    } catch (err: any) {
      // Network errors usually mean the server isn't running
      console.error('API check failed:', err);
      setApiStatus('unavailable');
      setError('Unable to connect to the transcription service.');
      setDebugInfo(`🚫 Network error: ${err.name} - ${err.message}`);
    }
  };

  // The main recording function - this was tricky to get right across different browsers
  const startRecording = async () => {
    // First check if our API is available - no point recording if we can't transcribe
    if (apiStatus === 'unavailable') {
      setError('Transcription service is not available.');
      setDebugInfo(`🚫 Recording blocked - API status: ${apiStatus}`);
      return;
    }

    try {
      setError('');
      setDebugInfo('🎤 Requesting microphone access...');
      
      // Request microphone access with some quality settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true, // Helps with background noise
          noiseSuppression: true, // Makes voice clearer
          sampleRate: 16000 // Good balance of quality vs file size
        } 
      });
      
      setDebugInfo('🔍 Checking supported audio formats...');
      
      // Different browsers support different formats - need to check what works
      const mimeTypes = [
        'audio/webm;codecs=opus', // Best quality option
        'audio/webm',
        'audio/mp4',
        'audio/wav' // Fallback option
      ];
      
      let selectedMimeType = '';
      const supportedFormats: string[] = [];
      
      // Find the first supported format
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedFormats.push(mimeType);
          if (!selectedMimeType) {
            selectedMimeType = mimeType;
          }
        }
      }
      
      setDebugInfo(`🎵 Supported formats: ${supportedFormats.join(', ')} | Using: ${selectedMimeType}`);
      
      // If no formats are supported, we can't record
      if (!selectedMimeType) {
        throw new Error('No supported audio format found in your browser');
      }
      
      // Create the recorder with our chosen format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // This fires periodically during recording to give us audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setDebugInfo(`📊 Audio chunk received: ${event.data.size} bytes`);
        }
      };
      
      // This fires when recording stops
      mediaRecorder.onstop = async () => {
        try {
          // Combine all our audio chunks into one blob
          const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          setDebugInfo(`🎵 Recording complete: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          // Send it off for transcription
          await transcribeAudio(audioBlob);
        } catch (error: any) {
          console.error('Error processing recording:', error);
          setError('Failed to process the recording.');
          setDebugInfo(`❌ Recording processing error: ${error.message}`);
        }
        
        // Always clean up the media stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Handle any recording errors
      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Check your microphone permissions.');
        setDebugInfo(`🎤 MediaRecorder error: ${event.error?.name} - ${event.error?.message}`);
        setIsRecording(false);
      };
      
      // Start recording!
      mediaRecorder.start();
      setIsRecording(true);
      setRetryCount(0);
      setRecordingDuration(0);
      setDebugInfo('🔴 Recording started successfully');
      
    } catch (err: any) {
      // Usually this means the user denied microphone permission
      console.error('Error starting recording:', err);
      setDebugInfo(`❌ Recording start error: ${err.name} - ${err.message}`);
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else if (err.name === 'NotSupportedError') {
        setError('Your browser does not support audio recording.');
      } else {
        setError(`Failed to access microphone: ${err.message || 'Unknown error'}`);
      }
      
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, attempt: number = 1) => {
    const maxRetries = 3;
    setIsLoading(true);
    setError('');
    
    try {
      setDebugInfo(`🔄 Starting transcription attempt ${attempt}/${maxRetries}`);
      
      const base64Audio = await blobToBase64(audioBlob);
      const base64Size = base64Audio.length;
      const audioDataSize = base64Audio.split(',')[1]?.length || 0;
      
      setDebugInfo(`📦 Audio encoded: ${base64Size} chars total, ${audioDataSize} chars data`);
      
      const requestStart = Date.now();
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio.split(',')[1],
        }),
      });
      
      const requestTime = Date.now() - requestStart;
      setDebugInfo(`📡 API request completed in ${requestTime}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
          setDebugInfo(`❌ API Error Response: ${JSON.stringify(errorData)}`);
        } catch (parseError) {
          setDebugInfo(`❌ Failed to parse error response: ${parseError}`);
          errorData = { error: 'Unknown error - could not parse response' };
        }
        
        const errorMessages = {
          404: 'API endpoint not found. The /api/transcribe route does not exist.',
          500: errorData.error || 'Internal server error. Check API key configuration.',
          401: 'Invalid API key. Check your Deepgram API key.',
          402: 'Insufficient credits in your Deepgram account.',
          429: 'Rate limit exceeded. Please wait before trying again.',
        };
        
        const errorMessage = errorMessages[response.status as keyof typeof errorMessages] || 
          `HTTP ${response.status}: ${errorData.error || response.statusText}`;
        
        if (response.status >= 500 && attempt < maxRetries) {
          setDebugInfo(`🔄 Retrying due to server error (${attempt}/${maxRetries})`);
          setRetryCount(attempt);
          setTimeout(() => transcribeAudio(audioBlob, attempt + 1), 1000 * attempt);
          return;
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      setDebugInfo(`✅ API Response: ${JSON.stringify(data)}`);
      
      if (data.error) {
        throw new Error(`API returned error: ${data.error}`);
      }
      
      if (data.transcript) {
        setTranscript(data.transcript);
        setError('');
        setDebugInfo(`🎉 Transcription successful: ${data.transcript.length} characters`);
        
        if (data.confidence) {
          setDebugInfo(prev => prev + ` | Confidence: ${(data.confidence * 100).toFixed(1)}%`);
        }
      } else {
        const errorMsg = 'No transcript received from the API. Try speaking more clearly.';
        setError(errorMsg);
        setDebugInfo(`⚠️ ${errorMsg} | Response: ${JSON.stringify(data)}`);
      }
      
    } catch (err: any) {
      console.error('Transcription error:', err);
      
      let errorMessage = 'Failed to transcribe audio: ';
      let debugMessage = `❌ Transcription error: ${err.name} - ${err.message}`;
      
      if (err.message.includes('API endpoint not found')) {
        errorMessage += 'The API route is missing.';
        debugMessage += ' | Solution: Create /api/transcribe/route.ts file';
      } else if (err.message.includes('API key') || err.message.includes('401')) {
        errorMessage += 'Invalid API key configuration.';
        debugMessage += ' | Solution: Check DEEPGRAM_API_KEY in .env.local';
      } else if (err.message.includes('credits') || err.message.includes('402')) {
        errorMessage += 'Insufficient account credits.';
        debugMessage += ' | Solution: Add credits to Deepgram account';
      } else if (err.name === 'NetworkError' || err.message.includes('fetch')) {
        errorMessage += 'Network connection issue.';
        debugMessage += ' | Solution: Check internet connection';
      } else if (err.name === 'TypeError' && err.message.includes('JSON')) {
        errorMessage += 'Invalid API response format.';
        debugMessage += ' | Solution: Check API route implementation';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      if (attempt < maxRetries && (err.message.includes('500') || err.name === 'NetworkError')) {
        errorMessage += ` Retrying... (${attempt}/${maxRetries})`;
        debugMessage += ` | Retrying in ${1000 * attempt}ms`;
        setRetryCount(attempt);
        setTimeout(() => transcribeAudio(audioBlob, attempt + 1), 1000 * attempt);
        setError(errorMessage);
        setDebugInfo(debugMessage);
        return;
      }
      
      setError(errorMessage);
      setDebugInfo(debugMessage);
      
    } finally {
      if (attempt >= maxRetries || !error.includes('Retrying')) {
        setIsLoading(false);
        setRetryCount(0);
        setDebugInfo(prev => prev + ' | Process completed');
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard. Please select and copy the text manually.');
    }
  };

  const downloadTranscript = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([transcript], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } catch (err) {
      console.error('Failed to download transcript:', err);
      setError('Failed to download transcript. Please copy the text manually.');
    }
  };

  const clearAll = () => {
    try {
      setTranscript('');
      setAudioUrl('');
      setError('');
      setIsPlaying(false);
      setRetryCount(0);
      setRecordingDuration(0);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    } catch (err) {
      console.error('Error clearing data:', err);
    }
  };

  const retryTranscription = () => {
    if (audioUrl) {
      fetch(audioUrl)
        .then(response => response.blob())
        .then(audioBlob => transcribeAudio(audioBlob))
        .catch(err => {
          console.error('Failed to retry transcription:', err);
          setError('Failed to retry transcription. Please record again.');
        });
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        ></div>
        <div 
          className="absolute top-1/2 -right-20 w-60 h-60 rounded-full opacity-10 animate-bounce"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            animationDuration: '3s'
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full opacity-15 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            animationDelay: '1s'
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="group p-3 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                style={{ 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                title="Back to Notes"
              >
                <ArrowLeft 
                  size={20} 
                  className="text-white/80 group-hover:text-white transition-colors duration-300" 
                />
              </button>
            )}
            <div className="flex-1 text-center">
              <h1 style={{ 
                fontSize: '3rem', 
                fontWeight: 700, 
                lineHeight: 1.1, 
                color: '#FFFFFF',
                margin: 0,
                marginBottom: '12px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Voice Transcription
              </h1>
              <p style={{ 
                fontSize: '1.125rem', 
                color: 'rgba(255,255,255,0.9)', 
                lineHeight: 1.6,
                margin: 0,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div 
          className="backdrop-blur-lg relative overflow-hidden"
          style={{ 
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(103,126,234,0.03) 0%, rgba(118,75,162,0.03) 100%)',
              borderRadius: '24px'
            }}
          ></div>

          <div className="relative z-10 p-8">
            {/* Recording Controls */}
            <div className="text-center mb-12">
              {/* Main Record Button */}
              <div className="mb-8">
                <div className="relative inline-block">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || apiStatus === 'unavailable'}
                    className={`relative p-6 transition-all duration-300 transform ${
                      isRecording
                        ? 'scale-110 shadow-2xl'
                        : apiStatus === 'unavailable'
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:scale-105 shadow-xl hover:shadow-2xl'
                    } disabled:opacity-50 disabled:cursor-not-allowed group`}
                    style={{
                      borderRadius: '50%',
                      background: isRecording 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                        : apiStatus === 'unavailable' 
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      width: '100px',
                      height: '100px'
                    }}
                    title={
                      apiStatus === 'unavailable' 
                        ? 'Please complete the setup first' 
                        : isRecording 
                        ? 'Click to stop recording' 
                        : 'Click to start recording'
                    }
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                    
                    {/* Animated ring for recording */}
                    {isRecording && (
                      <>
                        <div 
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            opacity: 0.4
                          }}
                        ></div>
                        <div 
                          className="absolute inset-0 rounded-full animate-pulse"
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            opacity: 0.6,
                            animationDelay: '0.5s'
                          }}
                        ></div>
                      </>
                    )}

                    {/* Hover effect */}
                    {!isRecording && apiStatus === 'available' && (
                      <div 
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)'
                        }}
                      ></div>
                    )}
                  </button>
                </div>

                {/* Recording Timer */}
                {(isRecording || audioUrl) && (
                  <div className="mt-6">
                    <div 
                      className="inline-flex items-center gap-3 px-6 py-3 backdrop-blur-sm"
                      style={{
                        background: 'rgba(79,70,229,0.1)',
                        borderRadius: '50px',
                        border: '1px solid rgba(79,70,229,0.2)'
                      }}
                    >
                      <div className={`w-3 h-3 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: isRecording ? '#ef4444' : '#10b981' }}
                      ></div>
                      <span style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 600, 
                        color: '#4f46e5',
                        fontFamily: "'Source Code Pro', monospace"
                      }}>
                        {formatDuration(recordingDuration)}
                      </span>
                      {isRecording && <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(audioUrl || transcript) && (
                <div className="flex justify-center items-center gap-4 mb-8">
                  {audioUrl && (
                    <button
                      onClick={togglePlayback}
                      className="group p-4 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                      style={{
                        borderRadius: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                      ) : (
                        <Play className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                      )}
                    </button>
                  )}
                  
                  {transcript && (
                    <>
                      <button
                        onClick={copyToClipboard}
                        className="group p-4 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 relative"
                        style={{
                          borderRadius: '16px',
                          backgroundColor: copySuccess ? '#dcfce7' : '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                        title="Copy to clipboard"
                      >
                        <Copy className={`w-6 h-6 transition-colors ${copySuccess ? 'text-green-600' : 'text-green-700 group-hover:text-green-600'}`} />
                        {copySuccess && (
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                            Copied!
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={downloadTranscript}
                        className="group p-4 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                        style={{
                          borderRadius: '16px',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                        title="Download transcript"
                      >
                        <Download className="w-6 h-6 text-blue-700 group-hover:text-blue-600 transition-colors" />
                      </button>
                      
                      <button
                        onClick={clearAll}
                        className="group p-4 hover:bg-red-50 transition-all duration-300 transform hover:scale-105"
                        style={{
                          borderRadius: '16px',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                        title="Clear all"
                      >
                        <Trash2 className="w-6 h-6 text-red-700 group-hover:text-red-600 transition-colors" />
                      </button>
                    </>
                  )}
                </div>
              )}
              
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500
              }}>
                {apiStatus === 'checking' 
                  ? 'Checking API status...'
                  : apiStatus === 'unavailable'
                  ? 'Please complete the setup instructions below to enable recording'
                  : isRecording 
                  ? 'Recording in progress... Click the stop button when finished'
                  : 'Click the microphone to start recording your voice'
                }
              </p>
            </div>

            {/* Status Messages */}
            {apiStatus === 'checking' && (
              <div className="text-center mb-8">
                <div 
                  className="inline-flex items-center gap-3 px-6 py-4 backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,197,253,0.1) 100%)',
                    color: '#1d4ed8',
                    borderRadius: '16px',
                    border: '1px solid rgba(59,130,246,0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                >
                  <div 
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#3b82f6' }}
                  ></div>
                  <span style={{ fontWeight: 600 }}>Checking API availability...</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center mb-8">
                <div 
                  className="inline-flex items-center gap-3 px-6 py-4 backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(196,181,253,0.1) 100%)',
                    color: '#7c3aed',
                    borderRadius: '16px',
                    border: '1px solid rgba(147,51,234,0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                >
                  <div 
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#7c3aed' }}
                  ></div>
                  <span style={{ fontWeight: 600 }}>
                    {retryCount > 0 ? `Retrying transcription... (${retryCount}/3)` : 'Processing your audio...'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div 
                className="mb-8 p-6 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(252,165,165,0.1) 100%)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <h4 style={{ 
                        color: '#dc2626', 
                        fontWeight: 600, 
                        fontSize: '1rem', 
                        margin: 0
                      }}>
                        Error
                      </h4>
                    </div>
                    <p style={{ 
                      color: '#991b1b', 
                      fontSize: '0.875rem', 
                      lineHeight: 1.5,
                      margin: 0 
                    }}>
                      {error}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {audioUrl && !error.includes('API endpoint not found') && (
                      <button
                        onClick={retryTranscription}
                        className="px-4 py-2 hover:opacity-80 transition-all duration-200 transform hover:scale-105"
                        style={{
                          fontSize: '0.875rem',
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#dc2626',
                          borderRadius: '8px',
                          border: '1px solid rgba(239,68,68,0.2)',
                          fontWeight: 500
                        }}
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => setError('')}
                      className="px-4 py-2 hover:opacity-80 transition-all duration-200 transform hover:scale-105"
                      style={{
                        fontSize: '0.875rem',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        color: '#dc2626',
                        borderRadius: '8px',
                        border: '1px solid rgba(239,68,68,0.2)',
                        fontWeight: 500
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {apiStatus === 'unavailable' && !isLoading && (
              <div 
                className="mb-8 p-6 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(252,211,77,0.1) 100%)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <h4 style={{ 
                        color: '#d97706', 
                        fontWeight: 600, 
                        fontSize: '1rem', 
                        margin: 0
                      }}>
                        Setup Required
                      </h4>
                    </div>
                    <p style={{ 
                      color: '#92400e', 
                      fontSize: '0.875rem', 
                      lineHeight: 1.5,
                      margin: 0 
                    }}>
                      The transcription API is not configured. Please follow the setup instructions below to get started.
                    </p>
                  </div>
                  <button
                    onClick={checkApiAvailability}
                    className="px-4 py-2 hover:opacity-80 transition-all duration-200 transform hover:scale-105"
                    style={{
                      fontSize: '0.875rem',
                      backgroundColor: 'rgba(245,158,11,0.1)',
                      color: '#d97706',
                      borderRadius: '8px',
                      border: '1px solid rgba(245,158,11,0.2)',
                      fontWeight: 500
                    }}
                  >
                    Recheck
                  </button>
                </div>
              </div>
            )}

            {/* Audio Player */}
            {audioUrl && (
              <div className="mb-8">
                <div 
                  className="p-6 backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(100,116,139,0.05) 0%, rgba(148,163,184,0.05) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(100,116,139,0.1)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Volume2 className="w-5 h-5 text-slate-600" />
                    <h3 style={{ 
                      fontWeight: 600, 
                      color: '#334155', 
                      fontSize: '1rem',
                      margin: 0 
                    }}>
                      Audio Recording
                    </h3>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                    style={{
                      borderRadius: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Transcript Output */}
            {transcript && (
              <div 
                className="p-6 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(110,231,183,0.05) 100%)',
                  border: '1px solid rgba(16,185,129,0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <h3 style={{ 
                    fontWeight: 600, 
                    color: '#047857', 
                    fontSize: '1.125rem',
                    margin: 0 
                  }}>
                    Transcript
                  </h3>
                  <div 
                    className="ml-auto px-3 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      color: '#047857',
                      border: '1px solid rgba(16,185,129,0.2)'
                    }}
                  >
                    {transcript.length} characters
                  </div>
                </div>
                <div 
                  className="p-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(16,185,129,0.1)'
                  }}
                >
                  <p style={{ 
                    color: '#1f2937', 
                    lineHeight: 1.7, 
                    whiteSpace: 'pre-wrap',
                    fontSize: '1.125rem',
                    margin: 0,
                    fontWeight: 400
                  }}>
                    {transcript}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTranscriptionPage;