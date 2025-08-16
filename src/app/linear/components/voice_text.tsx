import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Download, Copy, Trash2, ArrowLeft } from 'lucide-react';

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check API availability on component mount
    checkApiAvailability();
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const checkApiAvailability = async () => {
    setApiStatus('checking');
    setDebugInfo('🔍 Checking API availability...');
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: '' }), // Empty test request
      });
      
      setDebugInfo(`📡 API Response: ${response.status} ${response.statusText}`);
      
      if (response.status === 400) {
        // 400 means API is available but missing audio data (expected)
        setApiStatus('available');
        setError('');
        setDebugInfo('✅ API endpoint available and configured correctly');
      } else if (response.status === 404) {
        setApiStatus('unavailable');
        setError('API endpoint not found. Missing /api/transcribe route.');
        setDebugInfo('❌ API endpoint not found at /api/transcribe');
      } else if (response.status === 500) {
        const data = await response.json();
        setApiStatus('unavailable');
        setError(data.error || 'Server configuration error. Check your API key.');
        setDebugInfo(`🔧 Server error: ${JSON.stringify(data)}`);
      } else {
        setApiStatus('available');
        setDebugInfo(`✅ API available (status: ${response.status})`);
      }
    } catch (err: any) {
      console.error('API check failed:', err);
      setApiStatus('unavailable');
      setError('Unable to connect to the transcription service.');
      setDebugInfo(`🚫 Network error: ${err.name} - ${err.message}`);
    }
  };

  const startRecording = async () => {
    // Check API availability before recording
    if (apiStatus === 'unavailable') {
      setError('Transcription service is not available.');
      setDebugInfo(`🚫 Recording blocked - API status: ${apiStatus}`);
      return;
    }

    try {
      setError(''); // Clear previous errors
      setDebugInfo('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      setDebugInfo('🔍 Checking supported audio formats...');
      
      // Check if the browser supports the required audio format
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      const supportedFormats: string[] = [];
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedFormats.push(mimeType);
          if (!selectedMimeType) {
            selectedMimeType = mimeType;
          }
        }
      }
      
      setDebugInfo(`🎵 Supported formats: ${supportedFormats.join(', ')} | Using: ${selectedMimeType}`);
      
      if (!selectedMimeType) {
        throw new Error('No supported audio format found in your browser');
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setDebugInfo(`📊 Audio chunk received: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          setDebugInfo(`🎵 Recording complete: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          await transcribeAudio(audioBlob);
        } catch (error: any) {
          console.error('Error processing recording:', error);
          setError('Failed to process the recording.');
          setDebugInfo(`❌ Recording processing error: ${error.message}`);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Check your microphone permissions.');
        setDebugInfo(`🎤 MediaRecorder error: ${event.error?.name} - ${event.error?.message}`);
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRetryCount(0);
      setDebugInfo('🔴 Recording started successfully');
      
    } catch (err: any) {
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
      
      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);
      const base64Size = base64Audio.length;
      const audioDataSize = base64Audio.split(',')[1]?.length || 0;
      
      setDebugInfo(`📦 Audio encoded: ${base64Size} chars total, ${audioDataSize} chars data`);
      
      // Call your API route
      const requestStart = Date.now();
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
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
          // Retry on server errors
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
        setError(''); // Clear any previous errors on success
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
      
      // Add retry information if applicable
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
      // You could add a toast notification here
      console.log('Transcript copied to clipboard');
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
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    } catch (err) {
      console.error('Error clearing data:', err);
    }
  };

  const retryTranscription = () => {
    if (audioUrl) {
      // Recreate blob from audio URL and retry
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-3 hover:bg-white/50 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg backdrop-blur-sm border border-white/20"
                title="Back to Notes"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Voice to Text Transcription
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Record your voice and get an accurate transcription using Deepgram's Speech-to-Text API
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Recording Controls */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || apiStatus === 'unavailable'}
                className={`relative p-4 rounded-full transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110'
                    : apiStatus === 'unavailable'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  apiStatus === 'unavailable' 
                    ? 'Please complete the setup first' 
                    : isRecording 
                    ? 'Click to stop recording' 
                    : 'Click to start recording'
                }
              >
                {isRecording ? (
                  <Square className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                )}
              </button>
              
              {audioUrl && (
                <button
                  onClick={togglePlayback}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              )}
              
              {transcript && (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5 text-green-700" />
                  </button>
                  
                  <button
                    onClick={downloadTranscript}
                    className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                    title="Download transcript"
                  >
                    <Download className="w-5 h-5 text-blue-700" />
                  </button>
                  
                  <button
                    onClick={clearAll}
                    className="p-3 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-5 h-5 text-red-700" />
                  </button>
                </>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              {apiStatus === 'checking' 
                ? 'Checking API status...'
                : apiStatus === 'unavailable'
                ? 'Please complete the setup instructions below to enable recording'
                : isRecording 
                ? 'Recording... Click the stop button when finished'
                : 'Click the microphone to start recording'
              }
            </p>
          </div>

          {/* Status Messages */}
          {apiStatus === 'checking' && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Checking API availability...
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                {retryCount > 0 ? `Retrying transcription... (${retryCount}/3)` : 'Transcribing audio...'}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium mb-1">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {audioUrl && !error.includes('API endpoint not found') && (
                    <button
                      onClick={retryTranscription}
                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => setError('')}
                    className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {apiStatus === 'unavailable' && !isLoading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-yellow-800 font-medium mb-1">Setup Required</h4>
                  <p className="text-yellow-700 text-sm">
                    The transcription API is not configured. Please follow the setup instructions below to get started.
                  </p>
                </div>
                <button
                  onClick={checkApiAvailability}
                  className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                >
                  Recheck
                </button>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-6">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
                controls
              />
            </div>
          )}

          {/* Transcript Output */}
          {transcript && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Transcript:</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTranscriptionPage;