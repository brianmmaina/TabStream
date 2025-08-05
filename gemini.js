// Gemini API Handler for Tab Stream Extension

console.log('Tab Stream Extension: Gemini script loaded');
// Get your API key from: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

/**
 * Make a request to the Gemini API
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<Object>} - The response from Gemini
 */
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Please set your Gemini API key in gemini.js. Get your API key from: https://makersuite.google.com/app/apikey');
  }

  const url = `${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

/**
 * Extract artist and title from YouTube video title
 * @param {string} videoTitle - The YouTube video title
 * @returns {Promise<Object>} - Object with artist and title
 */
async function extractSongInfo(videoTitle) {
  const prompt = `Extract the artist and song title from this YouTube video title. Return ONLY a JSON object with "artist" and "title" fields. Remove any extra text, emojis, or video-related terms.

YouTube title: "${videoTitle}"

Example output: {"artist": "Ed Sheeran", "title": "Perfect"}

Rules:
- Remove common YouTube suffixes like "(Official Music Video)", "[HD]", "(Lyrics)", etc.
- Remove emojis and special characters
- If the format is "Artist - Title", extract accordingly
- If no clear artist is found, use "Unknown Artist"
- Return only valid JSON`;

  try {
    const response = await callGeminiAPI(prompt);
    
    //tries to parse JSON from the response
    try {
      const parsed = JSON.parse(response);
      
      //validates the response has required fields
      if (parsed.artist && parsed.title) {
        return {
          artist: parsed.artist.trim(),
          title: parsed.title.trim()
        };
      } else {
        throw new Error('Missing required fields in response');
      }
    } catch (parseError) {
      console.log('AI response not in JSON format, using manual extraction');
      return extractSongInfoManually(videoTitle);
    }
  } catch (error) {
    console.log('AI extraction failed, using manual extraction');
    return extractSongInfoManually(videoTitle);
  }
}

/**
 * Manual fallback extraction when Gemini fails
 * @param {string} videoTitle - The YouTube video title
 * @returns {Object} - Object with artist and title
 */
function extractSongInfoManually(videoTitle) {
  //removes common YouTube suffixes
  let cleanTitle = videoTitle
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\[Official Audio\]/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\(Lyric Video\)/gi, '')
    .replace(/\(Music Video\)/gi, '')
    .replace(/\(Official\)/gi, '')
    .replace(/\[Official\]/gi, '')
    .replace(/\[Music Video\]/gi, '')
    .replace(/\[5 Hours Loop\]/gi, '')
    .replace(/\[Loop\]/gi, '')
    .replace(/\[Extended\]/gi, '')
    .replace(/\[Remix\]/gi, '')
    .replace(/🎵/g, '')
    .replace(/💥/g, '')
    .replace(/🔥/g, '')
    .replace(/⭐/g, '')
    .trim();
  
  //tries to find artist - title pattern with various separators
  const patterns = [
    /^(.+?)\s*[-–—]\s*(.+)$/,  // Artist - Title
    /^(.+?)\s*:\s*(.+)$/,      // Artist: Title
    /^(.+?)\s*"(.+?)"$/,       // Artist "Title"
    /^(.+?)\s*'(.+?)'$/,       // Artist 'Title'
  ];
  
  for (const pattern of patterns) {
    const match = cleanTitle.match(pattern);
    if (match) {
      return {
        artist: match[1].trim(),
        title: match[2].trim()
      };
    }
  }
  
  //if no pattern matches, tries to find the last dash or colon
  const lastDashIndex = cleanTitle.lastIndexOf(' - ');
  const lastColonIndex = cleanTitle.lastIndexOf(': ');
  const separatorIndex = Math.max(lastDashIndex, lastColonIndex);
  
  if (separatorIndex > 0) {
    const artist = cleanTitle.substring(0, separatorIndex).trim();
    const title = cleanTitle.substring(separatorIndex + 2).trim();
    
    if (artist && title) {
      return { artist, title };
    }
  }
  
  //final fallback: return with blank artist
  return {
    artist: '',
    title: cleanTitle
  };
}

/**
 * Ask Gemini about a song
 * @param {string} question - The user's question
 * @param {Object} songInfo - Object with artist and title
 * @returns {Promise<string>} - Gemini's response
 */
async function askAboutSong(question, songInfo) {
  const artistInfo = !songInfo.artist || songInfo.artist === '' ? 
    `song titled "${songInfo.title}" (artist unknown)` : 
    `${songInfo.artist} - ${songInfo.title}`;
    
  const prompt = `You are a helpful music assistant specializing in guitar tabs, chords, and music theory. 

The user is asking about this song: ${artistInfo}

User question: ${question}

Please provide a concise, practical response (under 150 words) that includes:
1. Brief, actionable advice
2. Specific chord progressions or tab suggestions if relevant
3. Links to resources (mention Ultimate Guitar, Songsterr, YouTube tutorials)
4. Difficulty level and tips for beginners if applicable
5. If the artist is unknown, suggest searching by song title and mention common chord progressions for similar songs

Keep it encouraging and focused on helping someone learn to play this song.`;

  try {
    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Error asking about song:', error);
    throw new Error('Unable to get response from AI assistant');
  }
}

//exports functions for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractSongInfo,
    askAboutSong,
    callGeminiAPI
  };
} else {
  //for browser environment, attaches to window
  window.TabStreamGemini = {
    extractSongInfo,
    askAboutSong,
    callGeminiAPI
  };
} 