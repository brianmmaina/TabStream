// Tab Stream Content Script
console.log('Tab Stream Extension: Content script loaded');

let sidebar = null;
let songInfo = null;

//function to extract video title from YouTube
function extractVideoTitle() {
  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
  if (titleElement) {
    return titleElement.textContent.trim();
  }
  
  const fallbackSelectors = [
    'h1.ytd-watch-metadata',
    'h1.title',
    'h1',
    '.video-title'
  ];
  
  for (const selector of fallbackSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  
  return null;
}

//function to create and inject sidebar
function createSidebar() {
  console.log('Tab Stream Extension: Creating sidebar...');
  
  if (sidebar) {
    sidebar.remove();
  }
  
  sidebar = document.createElement('div');
  sidebar.id = 'tab-stream-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Tab Stream</h3>
      <button class="close-btn" onclick="document.getElementById('tab-stream-sidebar').remove()">×</button>
    </div>
    <div class="sidebar-content">
      <div class="song-info">
        <div class="loading">Analyzing video...</div>
      </div>
      <div class="tab-links" style="display: none;">
        <h4>Find Tabs:</h4>
        <div class="link-buttons">
          <button class="tab-link" data-site="ultimate-guitar">Ultimate Guitar</button>
          <button class="tab-link" data-site="songsterr">Songsterr</button>
          <button class="tab-link" data-site="google">Google Search</button>
        </div>
      </div>
      <div class="chat-section">
        <h4>Ask about this song:</h4>
        <input type="text" id="chat-input" placeholder="e.g., Find fingerstyle tab, chords, difficulty level">
        <button id="chat-send">Ask</button>
        <div id="chat-response"></div>
        <div class="example-questions">
          <small>Try: "Find tabs", "What are the chords?", "Is this beginner-friendly?"</small>
        </div>
      </div>
    </div>
  `;
  
  sidebar.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 320px !important;
    max-height: 500px !important;
    background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #F5F5DC 100%) !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
    z-index: 10000 !important;
    font-family: 'Courier New', monospace !important;
    color: #2F2F2F !important;
    overflow: hidden !important;
    border: 2px solid #D2691E !important;
    animation: slideIn 0.4s ease-out !important;
  `;
  
  //adds keyframe animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%) rotate(5deg); }
      to { opacity: 1; transform: translateX(0) rotate(0deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(sidebar);
  console.log('Tab Stream Extension: Sidebar added to page');
  
  //forcesheader styling
  const header = sidebar.querySelector('.sidebar-header');
  if (header) {
    header.style.cssText = `
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 16px 20px !important;
      background: rgba(210, 105, 30, 0.9) !important;
      border-bottom: 2px solid #D2691E !important;
      position: relative !important;
    `;
  }
  
  //forces title styling
  const title = sidebar.querySelector('.sidebar-header h3');
  if (title) {
    title.style.cssText = `
      margin: 0 !important;
      font-size: 20px !important;
      font-weight: bold !important;
      color: #FFFFFF !important;
      text-transform: uppercase !important;
      letter-spacing: 2px !important;
      text-shadow: 2px 2px 0px #8B4513 !important;
      font-family: 'Courier New', monospace !important;
    `;
  }
  

  const closeBtn = sidebar.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.style.cssText = `
      background: #FFFFFF !important;
      border: 2px solid #D2691E !important;
      color: #8B4513 !important;
      font-size: 20px !important;
      cursor: pointer !important;
      padding: 4px 8px !important;
      width: 28px !important;
      height: 28px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      transition: all 0.3s !important;
      font-weight: bold !important;
      text-shadow: none !important;
    `;
  }
  

  const content = sidebar.querySelector('.sidebar-content');
  if (content) {
    content.style.cssText = `
      padding: 20px !important;
      max-height: 400px !important;
      overflow-y: auto !important;
      background: rgba(245, 245, 220, 0.8) !important;
    `;
  }
  

  const headings = sidebar.querySelectorAll('h4');
  headings.forEach(heading => {
    heading.style.cssText = `
      color: #8B4513 !important;
      margin-bottom: 12px !important;
      font-size: 16px !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      text-shadow: 1px 1px 0px #FFFFFF !important;
      font-family: 'Courier New', monospace !important;
      font-weight: bold !important;
    `;
  });
  

  const buttons = sidebar.querySelectorAll('.tab-link, #chat-send');
  buttons.forEach(button => {
    button.style.cssText = `
      background: linear-gradient(135deg, #D2691E, #CD853F) !important;
      border: 2px solid #8B4513 !important;
      color: #FFFFFF !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: bold !important;
      transition: all 0.3s !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      text-shadow: 1px 1px 0px #8B4513 !important;
      font-family: 'Courier New', monospace !important;
      margin-bottom: 8px !important;
    `;
  });
  

  const input = sidebar.querySelector('#chat-input');
  if (input) {
    input.style.cssText = `
      width: 100% !important;
      padding: 12px 16px !important;
      border: 2px solid #D2691E !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.9) !important;
      color: #2F2F2F !important;
      font-size: 14px !important;
      margin-bottom: 8px !important;
      box-sizing: border-box !important;
      font-family: 'Courier New', monospace !important;
    `;
  }
  

  setupSidebarEventListeners();
}


function setupSidebarEventListeners() {
  // Tabs link buttons
  const tabLinks = sidebar.querySelectorAll('.tab-link');
  tabLinks.forEach(button => {
    button.addEventListener('click', () => {
      const site = button.dataset.site;
      openTabSite(site);
    });
  });
  
  // this is for the Chat functionality
  const chatSend = sidebar.querySelector('#chat-send');
  const chatInput = sidebar.querySelector('#chat-input');
  
  chatSend.addEventListener('click', () => {
    const question = chatInput.value.trim();
    if (question && songInfo) {
      handleChatQuestion(question);
    }
  });
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const question = chatInput.value.trim();
      if (question && songInfo) {
        handleChatQuestion(question);
      }
    }
  });
}

//function to open tab sites
function openTabSite(site) {
  if (!songInfo) return;
  
  const { artist, title } = songInfo;
  let searchQuery = '';
  

  if (!artist || artist === '') {
    searchQuery = encodeURIComponent(`${title} tab guitar`);
  } else {
    searchQuery = encodeURIComponent(`${artist} ${title} tab`);
  }
  
  let url = '';
  switch (site) {
    case 'ultimate-guitar':
      url = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${searchQuery}`;
      break;
    case 'songsterr':
      url = `https://www.songsterr.com/?pattern=${searchQuery}`;
      break;
    case 'google':
      url = `https://www.google.com/search?q=${searchQuery}`;
      break;
  }
  
  if (url) {
    window.open(url, '_blank');
  }
}

//function to handle chat questions
async function handleChatQuestion(question) {
  const responseDiv = sidebar.querySelector('#chat-response');
  responseDiv.innerHTML = '<div class="loading">Thinking...</div>';
  
  try {
    const response = await askGemini(question, songInfo);
    
    // Format the response to make links clickable
    const formattedResponse = formatResponse(response);
    responseDiv.innerHTML = `<div class="ai-response">${formattedResponse}</div>`;
  } catch (error) {
    console.error('Chat error:', error);
    responseDiv.innerHTML = '<div class="error">Error: Could not get response</div>';
  }
}

//function to format response and make links clickable
function formatResponse(response) {
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return response.replace(urlRegex, '<a href="$1" target="_blank" style="color: #ffd700; text-decoration: underline;">$1</a>');
}

//function to ask Gemini
async function askGemini(question, songInfo) {
  try {
    // Use the gemini.js module if available
    if (window.TabStreamGemini) {
      return await window.TabStreamGemini.askAboutSong(question, songInfo);
    } else {
      throw new Error('Gemini module not available');
    }
  } catch (error) {
    console.error('Error asking Gemini:', error);
    throw error;
  }
}

//function to process video title with Gemini
async function processVideoTitle(title) {
  try {

    if (window.TabStreamGemini) {
      return await window.TabStreamGemini.extractSongInfo(title);
    } else {

      return extractArtistTitleManually(title);
    }
  } catch (error) {
    console.error('Error processing title:', error);
    return extractArtistTitleManually(title);
  }
}

// fallback function to extract artist and title manually
function extractArtistTitleManually(title) {
  // Removes common YouTube suffixes
  let cleanTitle = title
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\[Official Audio\]/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\(Lyric Video\)/gi, '')
    .trim();
  

  const dashMatch = cleanTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return {
      artist: dashMatch[1].trim(),
      title: dashMatch[2].trim()
    };
  }

  return {
    artist: 'Unknown Artist',
    title: cleanTitle
  };
}

// Main function to initialize the extension
async function initializeTabStream() {
  console.log('Tab Stream Extension: Initializing...');
  
  // Check if we're on a video page
  if (!location.href.includes('/watch?v=')) {
    console.log('Tab Stream Extension: Not on a video page, skipping');
    return;
  }
  
  // Wait for page to load
  if (document.readyState !== 'complete') {
    console.log('Tab Stream Extension: Page not ready, waiting for load event');
    window.addEventListener('load', initializeTabStream);
    return;
  }
  
  console.log('Tab Stream Extension: Page ready, creating sidebar');
  // Create sidebar
  createSidebar();
  
  // Extract and process video title with retry
  let videoTitle = extractVideoTitle();
  let retryCount = 0;
  const maxRetries = 3;
  
  while (!videoTitle && retryCount < maxRetries) {
    retryCount++;
    console.log(`Tab Stream Extension: Retrying title extraction (${retryCount}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 500));
    videoTitle = extractVideoTitle();
  }
  
  if (videoTitle) {
    console.log('Tab Stream Extension: Found title:', videoTitle);
    try {
      songInfo = await processVideoTitle(videoTitle);
      
      // Update sidebar with song info
      const songInfoDiv = sidebar.querySelector('.song-info');
      const tabLinksDiv = sidebar.querySelector('.tab-links');
      
      songInfoDiv.innerHTML = `
        <div class="song-details">
          ${songInfo.artist ? `<div class="artist">${songInfo.artist}</div>` : ''}
          <div class="title">${songInfo.title}</div>
        </div>
      `;
      
      tabLinksDiv.style.display = 'block';
      console.log('Tab Stream Extension: Updated with new song info');
    } catch (error) {
      console.error('Error processing video title:', error);
      const songInfoDiv = sidebar.querySelector('.song-info');
      songInfoDiv.innerHTML = '<div class="error">Could not analyze video</div>';
    }
  } else {
    console.log('Tab Stream Extension: No video title found');
    const songInfoDiv = sidebar.querySelector('.song-info');
    songInfoDiv.innerHTML = '<div class="loading">No video detected</div>';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTabStream);
} else {
  initializeTabStream();
}

// Reinitializes when navigating to different videos (YouTube SPA)
let currentUrl = location.href;
let isInitializing = false;

//function to handle URL changes
function handleUrlChange() {
  if (location.href !== currentUrl && !isInitializing) {
    currentUrl = location.href;
    isInitializing = true;
    
    console.log('Tab Stream Extension: URL changed, reinitializing');
    
    //clears existing data immediately
    songInfo = null;
    
    //removes existing sidebar
    const existingSidebar = document.getElementById('tab-stream-sidebar');
    if (existingSidebar) {
      existingSidebar.remove();
    }
    
    //resets sidebar variable
    sidebar = null;
    
    //waits a bit for YouTube to load new content, then initialize
    setTimeout(() => {
      initializeTabStream();
      isInitializing = false;
    }, 1500);
  }
}


const observer = new MutationObserver(handleUrlChange);
observer.observe(document, { subtree: true, childList: true });


window.addEventListener('popstate', handleUrlChange); 