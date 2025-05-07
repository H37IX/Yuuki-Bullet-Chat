//🧬
// Widget Settings
const fieldData = {
  fontFamily: 'Roboto',
  fontSize: 37,
  speed: 2,
  duration: 5000,
  fade: true,
  fadeTime: 1000,
  useTwitchColors: true,
  usernameColor: '#00ffff',
  textColor: '#ffffff',
  bgColor: 'transparent',
  direction: 'both',
  showPreview: true
};

// Twitch default color palette (used if no color is set or found)
const TWITCH_COLORS = [
  "#FF0000", "#0000FF", "#008000", "#B22222", "#FF7F50", 
  "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", 
  "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"
];

// Get a deterministic color based on username if no color is set
function getTwitchFallbackColor(username) {
  if (!username) return TWITCH_COLORS[0];
  
  // Create a simple hash from username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
  }
  
  // Get a color from the Twitch palette using the hash
  const index = Math.abs(hash) % TWITCH_COLORS.length;
  return TWITCH_COLORS[index];
}

// Track active messages for vertical spacing
const activeMessages = new Set();
const MIN_SPACING = 50; // Minimum pixel spacing between messages

// Find an available vertical position for a new message
function findAvailablePosition(messageHeight) {
  // Get all current message positions
  const positions = Array.from(activeMessages).map(msg => {
      const rect = msg.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
  }).sort((a, b) => a.top - b.top);
  
  const containerHeight = document.getElementById('chat-container').clientHeight;
  
  // Check if there's space at the top
  if (positions.length === 0 || positions[0].top >= messageHeight + MIN_SPACING) {
      return 10; // Start with a small margin from the top
  }
  
  // Check spaces between messages
  for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i + 1].top - positions[i].bottom;
      if (gap >= messageHeight + MIN_SPACING) {
          return positions[i].bottom + MIN_SPACING;
      }
  }
  
  // Check if there's space at the bottom
  const lastMsg = positions[positions.length - 1];
  const bottomSpace = containerHeight - lastMsg.bottom;
  if (bottomSpace >= messageHeight + MIN_SPACING) {
      return lastMsg.bottom + MIN_SPACING;
  }
  
  // If no good space found, return random position
  return Math.floor(Math.random() * (containerHeight - messageHeight - 20));
}

// Random dir helper
function randomDirection() {
  return Math.random() > 0.5 ? 'left' : 'right';
}

// Listen for incoming chat messages
window.addEventListener('onEventReceived', function (obj) {
  // Check if it's a chat message event
  if (obj.detail.listener === 'message') {
      console.log('Full message event received:', obj.detail);
      
      // Extract message data from different possible structures
      const event = obj.detail.event;
      const data = event.data || {};
      
      // Log all possible paths where color might be found
      console.log('Color debug info:');
      console.log('- fieldData.useTwitchColors:', fieldData.useTwitchColors);
      console.log('- data.color:', data.color);
      console.log('- event.data?.color:', event.data?.color);
      console.log('- data.userData?.color:', data.userData?.color);
      console.log('- event.userData?.color:', event.userData?.color);
      console.log('- data.tags?.color:', data.tags?.color);
      
      if (!data || !data.displayName) {
          console.log('Invalid message data:', obj.detail);
          return;
      }
      spawnMessage(event);
  }
});

// Spawn messages from somewhere on the screen
function spawnMessage(event) {
  const data = event.data || {};
  
  console.log('Processing message from:', data.displayName);
  
  const container = document.getElementById('chat-container');
  if (!container) {
      console.error('Chat container not found!');
      return;
  }
  
  const msg = document.createElement('div');
  msg.className = 'chat-message';
  
  // Add preview class if it's a preview message
  if (isPreview || data.isPreview) {
      msg.classList.add('preview-message');
      
      // Add a preview label
      const previewLabel = document.createElement('div');
      previewLabel.textContent = '[PREVI3W]';
      previewLabel.style.color = '#9146FF'; // Twitch purple - readable on light/dark/transparent backgrounds
      previewLabel.style.fontSize = '18px';
      previewLabel.style.fontWeight = 'bold';
      previewLabel.style.textAlign = 'center';
      previewLabel.style.marginBottom = '5px';
      previewLabel.style.textShadow = '0px 0px 2px rgba(0,0,0,0.8), 0px 0px 2px rgba(255,255,255,0.8)'; // Add shadow for better contrast
      msg.appendChild(previewLabel);
  }
  
  // Store message ID for potential deletion
  if (data.msgId) msg.dataset.msgId = data.msgId;
  if (data.userId) msg.dataset.userId = data.userId;

  // Create username span
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'username';
  
  // Get Twitch color from various possible locations in the data structure
  let twitchColor = null;
  
  // Try different possible locations for the color property
  if (fieldData.useTwitchColors) {
      // Check all possible places where color might be stored
      if (data.color) {
          twitchColor = data.color;
      } else if (event.data && event.data.color) {
          twitchColor = event.data.color;
      } else if (data.userData && data.userData.color) {
          twitchColor = data.userData.color;
      } else if (event.userData && event.userData.color) {
          twitchColor = event.userData.color;
      } else if (data.tags && data.tags.color) {
          twitchColor = data.tags.color;
      } else {
          // If no color is found but we want Twitch colors, use the fallback
          twitchColor = getTwitchFallbackColor(data.displayName);
      }
  }
  
  // Use Twitch colors if enabled and available, otherwise use the custom color
  if (fieldData.useTwitchColors && twitchColor) {
      usernameSpan.style.color = twitchColor;
  } else {
      usernameSpan.style.color = fieldData.usernameColor;
  }
  
  usernameSpan.textContent = `${data.displayName}: `;
  
  // Create message span 
  const messageSpan = document.createElement('span');
  messageSpan.className = 'message';
  messageSpan.style.color = fieldData.textColor;
  
  // Approach 1: Use the raw event directly if it has emotes rendered
  if (event.renderedText) {
    console.log('Using renderedText from event');
    messageSpan.innerHTML = event.renderedText;
  } 
  // Approach 2: Stream Elements standard approach
  else if (data.html) {
    console.log('Using HTML property');
    messageSpan.innerHTML = data.html;
  } 
  // Approach 3: Try to use emotes data to reconstruct message
  else if (data.emotes && data.text) {
    console.log('Manually processing emotes');
    // simplified version 
    let html = data.text;
    const emotes = data.emotes;
    
    // Sort emotes by position to process from right to left
    // (to avoid position shifting)
    const emoteArray = [];
    for (const emoteId in emotes) {
      const emotePositions = emotes[emoteId];
      for (const position of emotePositions) {
        const [start, end] = position.split('-').map(Number);
        emoteArray.push({ id: emoteId, start, end });
      }
    }
    
    // Sort by start position descending (process right to left)
    emoteArray.sort((a, b) => b.start - a.start);
    
    // Replace emotes with images from 7TV
    for (const emote of emoteArray) {
      const { id, start, end } = emote;
      const emoteCode = data.text.substring(start, end + 1);
      const imgTag = `<img class="emote" alt="${emoteCode}" src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" />`;
      html = html.substring(0, start) + imgTag + html.substring(end + 1);
    }
    
    messageSpan.innerHTML = html;
  } 
  // Fallback: Just use text
  else {
    console.log('Using plain text fallback');
    messageSpan.textContent = data.text;
  }
  
  // Append spans to message
  msg.appendChild(usernameSpan);
  msg.appendChild(messageSpan);

  // Apply styling
  msg.style.background = fieldData.bgColor;
  msg.style.position = 'absolute';
  msg.style.whiteSpace = 'nowrap'; // force single line size
  msg.style.fontFamily = fieldData.fontFamily;
  msg.style.fontSize = `${fieldData.fontSize}px`;
  
  // Set emote size to match font size
  const emoteElements = messageSpan.querySelectorAll('img.emote');
  emoteElements.forEach(emote => {
      emote.style.height = `${fieldData.fontSize}px`;
      emote.style.verticalAlign = 'middle';
  });
  
  // Try to fix any non-standard emote classes (for BTTV, FFZ, 7TV)
  const allImageElements = messageSpan.querySelectorAll('img');
  allImageElements.forEach(img => {
    if (!img.classList.contains('emote')) {
      img.classList.add('emote');
      img.style.height = `${fieldData.fontSize}px`;
      img.style.verticalAlign = 'middle';
    }
  });

  // Append hidden first to measure width and height
  msg.style.visibility = 'hidden';
  container.appendChild(msg);

  // Force size calc
  const msgWidth = msg.offsetWidth;
  const msgHeight = msg.offsetHeight;
  
  console.log('Current direction setting:', fieldData.direction);
  
  // Determine spawn position based on direction setting
  // left = "Left → Right" (spawn from left)
  // right = "Right → Left" (spawn from right)
  // both = random choice between the two
  
  // Which side to spawn from
  let spawnFrom;
  if (fieldData.direction === 'both') {
      spawnFrom = Math.random() > 0.5 ? 'left' : 'right';
      console.log('Both direction selected, randomly chose:', spawnFrom);
  } else if (fieldData.direction === 'left') {
      spawnFrom = 'left';
      console.log('Left direction selected');
  } else if (fieldData.direction === 'right') {
      spawnFrom = 'right';
      console.log('Right direction selected');
  } else {
      // Default fallback
      console.log('Unknown direction, defaulting to right:', fieldData.direction);
      spawnFrom = 'right';
  }
  msg.dataset.spawnFrom = spawnFrom;

  // Find an available vertical position
  const verticalPos = findAvailablePosition(msgHeight);
  msg.style.top = `${verticalPos}px`;

  // Set correct spawn pos
  msg.style.visibility = 'visible';
  if (spawnFrom === 'left') {
      // Spawn from left side, move right
      msg.style.left = `-${msgWidth}px`;
      msg.style.right = 'auto';
  } else {
      // Spawn from right side, move left
      msg.style.right = `-${msgWidth}px`;
      msg.style.left = 'auto';
  }

  // Add to active messages for spacing calculations
  activeMessages.add(msg);
  
  animateMessage(msg);
}

// Add CSS for Google fonts
function addGoogleFontLink(fontFamily) {
  const linkId = 'google-font';
  
  // Remove existing link if there is one
  const existingLink = document.getElementById(linkId);
  if (existingLink) {
      existingLink.remove();
  }
  
  // Create and add the new link
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css?family=${encodeURIComponent(fontFamily)}`;
  document.head.appendChild(link);
}
// Animate/Scroll messages across the screen from left to right or right to left or both
function animateMessage(msg) {
  const spawnFrom = msg.dataset.spawnFrom;
  const containerWidth = document.getElementById('chat-container').clientWidth;
  const msgWidth = msg.offsetWidth;

  let pos = -msgWidth;

  function frame() {
    pos += fieldData.speed;

    if (spawnFrom === 'left') {
      msg.style.left = `${pos}px`;
      if (pos < containerWidth) {
        requestAnimationFrame(frame);
      } else {
        fadeOrRemove(msg);
      }
    } else {
      msg.style.right = `${pos}px`;
      if (pos < containerWidth) {
        requestAnimationFrame(frame);
      } else {
        fadeOrRemove(msg);
      }
    }
  }

  frame();

  setTimeout(() => fadeOrRemove(msg), fieldData.duration);
}

// Fade out and remove the message
function fadeOrRemove(msg) {
  if (fieldData.fade) {
    msg.style.transition = `opacity ${fieldData.fadeTime}ms linear`;
    msg.style.opacity = 0;
    setTimeout(() => {
      if (activeMessages.has(msg)) {
        activeMessages.delete(msg);
        msg.remove();
      }
    }, fieldData.fadeTime);
  } else {
    activeMessages.delete(msg);
    msg.remove();
  }
}

// Preview message element reference
let previewMessage = null;
let isPreview = false;

// Create a preview by simulating a chat message
function triggerPreview() {
  // Create a fake chat event
  const previewEvent = {
      data: {
          displayName: "Username123",
          text: "This is how your messages will look!",
          color: fieldData.useTwitchColors ? getTwitchFallbackColor("Username123") : null,
          tags: {},
          userId: 'preview-user',
          msgId: 'preview-msg-' + Date.now(),
          isPreview: true
      }
  };
  
  console.log('Triggering preview with data:', previewEvent);
  
  // Set the global preview flag
  isPreview = true;
  
  // Process it like a normal message
  spawnMessage(previewEvent);
  
  // Reset the flag after a short delay
  setTimeout(() => {
      isPreview = false;
  }, 100);
}

// Check if we're in editor mode (only shows preview in editor)
function isEditorMode() {
  // No need to check for editor mode - StreamElements handles that
  return true;
}

// settings
window.addEventListener('onWidgetLoad', function (obj) {
  let d = obj.detail.fieldData;
  
  console.log('Raw fieldData received:', obj.detail.fieldData);

  fieldData.fontFamily = d.fontFamily || 'Roboto';
  fieldData.fontSize = Number(d.fontSize || 37);
  fieldData.speed = Number(d.speed || 2);
  fieldData.duration = Number(d.duration || 5000);
  fieldData.fade = d.fade === 'on' || d.fade === true;
  fieldData.fadeTime = Number(d.fadeTime || 1000);
  fieldData.useTwitchColors = d.useTwitchColors === 'on' || d.useTwitchColors === true;
  fieldData.usernameColor = d.usernameColor || '#00ffff';
  fieldData.textColor = d.textColor || '#ffffff';
  fieldData.bgColor = d.bgColor || 'transparent';
  fieldData.direction = d.direction || 'both';
  fieldData.showPreview = d.showPreview === 'on' || d.showPreview === true;
  
  console.log('Widget loaded with settings:', fieldData);
  
  // Load Google Font
  addGoogleFontLink(fieldData.fontFamily);
  
  // Show initial preview if enabled
  if (fieldData.showPreview) {
      console.log('Auto-showing preview...');
      setTimeout(triggerPreview, 1000);
  }

  // Create a simple test div to verify DOM manipulation is working
  const testDiv = document.createElement('div');
  testDiv.style.display = 'none';
  testDiv.id = 'test-div';
  document.body.appendChild(testDiv);
  console.log('Test div created:', document.getElementById('test-div') !== null);
});

// Listen for button clicks from the widget
window.addEventListener('onWidgetButtonClick', function(obj) {
  console.log('Widget button clicked:', obj.detail);
});

// Add a handler for field updates
window.addEventListener('onFieldEditorRefresh', function() {
  console.log('Fields were updated');
  // This is a good place to update the preview if settings change
  if (fieldData.showPreview && isEditorMode()) {
      setTimeout(triggerPreview, 500);
  }
});

// Add message deletion handling
window.addEventListener('onEventReceived', function(obj) {
  // Single message deletion
  if (obj.detail.listener === 'delete-message') {
      const msgId = obj.detail.event.msgId;
      const msgEl = document.querySelector(`.chat-message[data-msg-id="${msgId}"]`);
      if (msgEl) {
          activeMessages.delete(msgEl);
          msgEl.remove();
      }
  }
  
  // User message deletion (handles ban/timeout)
  if (obj.detail.listener === 'delete-messages') {
      const userId = obj.detail.event.userId;
      document.querySelectorAll(`.chat-message[data-user-id="${userId}"]`).forEach(msgEl => {
          activeMessages.delete(msgEl);
          msgEl.remove();
      });
  }
});
