import { NextRequest, NextResponse } from 'next/server';

// Deepgram API configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen';

// Response type for better TypeScript support
interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
        }>;
      }>;
    }>;
  };
}

interface TranscriptionResponse {
  transcript?: string;
  confidence?: number;
  wordCount?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  error?: string;
  details?: any;
  debug?: any; // Added debug property
}

export async function POST(request: NextRequest) {
  // Enhanced debugging
  console.log('🔍 API Route called');
  console.log('🔑 API Key exists:', !!DEEPGRAM_API_KEY);
  console.log('🔑 API Key length:', DEEPGRAM_API_KEY?.length || 0);
  console.log('🔑 API Key first 10 chars:', DEEPGRAM_API_KEY?.substring(0, 10));

  if (!DEEPGRAM_API_KEY) {
    console.error('❌ Deepgram API key not configured');
    return NextResponse.json({ 
      error: 'Deepgram API key not configured',
      debug: {
        hasEnvFile: true,
        keyExists: !!DEEPGRAM_API_KEY,
        envKeys: Object.keys(process.env).filter(key => key.includes('DEEPGRAM'))
      }
    } satisfies TranscriptionResponse, { status: 500 });
  }

  try {
    const { audio } = await request.json() as { audio: string };
    console.log('📦 Audio data received:', !!audio, 'Length:', audio?.length || 0);

    if (!audio) {
      return NextResponse.json({ 
        error: 'No audio data provided' 
      } satisfies TranscriptionResponse, { status: 400 });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('🎵 Audio buffer size:', audioBuffer.length, 'bytes');

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en-US',
      smart_format: 'true',
      punctuate: 'true',
      diarize: 'false',
      filler_words: 'false',
      numerals: 'true',
      profanity_filter: 'false',
    });

    console.log('📡 Calling Deepgram API...');
    const deepgramResponse = await fetch(`${DEEPGRAM_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    });

    console.log('📡 Deepgram response status:', deepgramResponse.status);
    console.log('📡 Deepgram response headers:', Object.fromEntries(deepgramResponse.headers.entries()));

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text();
      console.error('❌ Deepgram API error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to transcribe audio with Deepgram',
        details: process.env.NODE_ENV === 'development' ? errorText : undefined,
        debug: {
          status: deepgramResponse.status,
          statusText: deepgramResponse.statusText,
          url: `${DEEPGRAM_URL}?${params}`
        }
      } satisfies TranscriptionResponse, { status: deepgramResponse.status });
    }

    const data = await deepgramResponse.json() as DeepgramResponse;
    console.log('✅ Deepgram response data:', JSON.stringify(data, null, 2));
    
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
    const words = data.results?.channels?.[0]?.alternatives?.[0]?.words || [];

    console.log('📝 Extracted transcript:', transcript);
    console.log('🎯 Confidence:', confidence);

    if (!transcript.trim()) {
      return NextResponse.json({ 
        transcript: 'No speech detected' 
      } satisfies TranscriptionResponse);
    }

    return NextResponse.json({ 
      transcript: transcript.trim(),
      confidence,
      wordCount: words.length || transcript.split(' ').length,
      words: words.map(word => ({
        word: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence
      }))
    } satisfies TranscriptionResponse);

  } catch (error) {
    console.error('💥 Transcription error:', error);
    return NextResponse.json({
      error: 'Failed to transcribe audio',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      debug: {
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      }
    } satisfies TranscriptionResponse, { status: 500 });
  }
}