// Tab Stream Sidebar JavaScript

class TabStreamSidebar {
  constructor() {
    this.sidebar = null;
    this.songInfo = null;
    this.init();
  }

  init() {
    this.createSidebar();
    this.setupEventListeners();
  }

  createSidebar() {
    //removes existing sidebar if present
    const existingSidebar = document.getElementById('tab-stream-sidebar');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    //creates new sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'tab-stream-sidebar';
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>Tab Stream</h3>
        <button class="close-btn" onclick="this.closest('#tab-stream-sidebar').remove()">×</button>
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
          <input type="text" id="chat-input" placeholder="e.g., Find fingerstyle tab">
          <button id="chat-send">Ask</button>
          <div id="chat-response"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
  }

  setupEventListeners() {
    //tabs link buttons
    const tabLinks = this.sidebar.querySelectorAll('.tab-link');
    tabLinks.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const site = button.dataset.site;
        this.openTabSite(site);
      });
    });

    //chat functionality
    const chatSend = this.sidebar.querySelector('#chat-send');
    const chatInput = this.sidebar.querySelector('#chat-input');

    chatSend.addEventListener('click', (e) => {
      e.preventDefault();
      const question = chatInput.value.trim();
      if (question && this.songInfo) {
        this.handleChatQuestion(question);
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (question && this.songInfo) {
          this.handleChatQuestion(question);
        }
      }
    });

    //close button
    const closeBtn = this.sidebar.querySelector('.close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.sidebar.remove();
    });
  }

  openTabSite(site) {
    if (!this.songInfo) return;

    const { artist, title } = this.songInfo;
    const searchQuery = encodeURIComponent(`${artist} ${title} tab`);

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

  async handleChatQuestion(question) {
    const responseDiv = this.sidebar.querySelector('#chat-response');
    responseDiv.innerHTML = '<div class="loading">Thinking...</div>';

    try {
      //uses the global TabStreamGemini if available, otherwise fallback
      if (window.TabStreamGemini) {
        const response = await window.TabStreamGemini.askAboutSong(question, this.songInfo);
        responseDiv.innerHTML = `<div class="ai-response">${response}</div>`;
      } else {
        //fallback to direct API call
        const response = await this.askGeminiDirectly(question, this.songInfo);
        responseDiv.innerHTML = `<div class="ai-response">${response}</div>`;
      }
    } catch (error) {
      console.error('Chat error:', error);
      responseDiv.innerHTML = '<div class="error">Error: Could not get response</div>';
    }
  }

  async askGeminiDirectly(question, songInfo) {
    const apiKey = 'YOUR_GEMINI_API_KEY'; //this should be replaced with actual key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `You are a helpful music assistant. The user is asking about this song: ${songInfo.artist} - ${songInfo.title}

User question: ${question}

Please provide a helpful response about guitar tabs, chords, or any music-related information. Keep it concise and practical.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  updateSongInfo(songInfo) {
    this.songInfo = songInfo;
    
    const songInfoDiv = this.sidebar.querySelector('.song-info');
    const tabLinksDiv = this.sidebar.querySelector('.tab-links');

    songInfoDiv.innerHTML = `
      <div class="song-details">
        <div class="artist">${songInfo.artist}</div>
        <div class="title">${songInfo.title}</div>
      </div>
    `;

    tabLinksDiv.style.display = 'block';
  }

  showError(message) {
    const songInfoDiv = this.sidebar.querySelector('.song-info');
    songInfoDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  showLoading() {
    const songInfoDiv = this.sidebar.querySelector('.song-info');
    songInfoDiv.innerHTML = '<div class="loading">Analyzing video...</div>';
  }
}

//exports for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabStreamSidebar;
} else {
  window.TabStreamSidebar = TabStreamSidebar;
} 