// Widget Settings
const fieldData = {
    fontFamily: 'Roboto',
    fontSize: 37,
    speed: 2,
    duration: 5000,
    fade: true,
    fadeTime: 1000,
    usernameColor: '#00ffff',
    textColor: '#ffffff',
    bgColor: 'transparent',
    direction: 'both'
  };
  
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
        const data = obj.detail.event.data;
        console.log('Full message event data:', JSON.stringify(obj.detail.event));
        console.log('Message data properties:', Object.keys(data));
        
        if (!data || !data.displayName) {
            console.log('Invalid message data:', obj.detail);
            return;
        }
        spawnMessage(obj.detail.event);
    }
  });
  
  // Spawn messages from somewhere on the screen
  function spawnMessage(event) {
    const data = event.data || {};
    console.log('Processing message from:', data.displayName);
    console.log('Raw message:', data.text);
    console.log('Has emotes property:', !!data.emotes);
    console.log('Has html property:', !!data.html);
    
    const container = document.getElementById('chat-container');
    const msg = document.createElement('div');
    msg.className = 'chat-message';
    
    // Store message ID for potential deletion
    if (data.msgId) msg.dataset.msgId = data.msgId;
    if (data.userId) msg.dataset.userId = data.userId;

    // Create username span
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'username';
    usernameSpan.style.color = fieldData.usernameColor;
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
      // This is a simplified version - may need to be expanded
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
      
      // Replace emotes with images
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
  // Animate messages across the screen from left to right or right to left or both
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
    fieldData.usernameColor = d.usernameColor || '#00ffff';
    fieldData.textColor = d.textColor || '#ffffff';
    fieldData.bgColor = d.bgColor || 'transparent';
    fieldData.direction = d.direction || 'both';
    
    console.log('Widget loaded with settings:', fieldData);
    
    // Load Google Font
    addGoogleFontLink(fieldData.fontFamily);
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
    
    // User message deletion (ban/timeout)
    if (obj.detail.listener === 'delete-messages') {
        const userId = obj.detail.event.userId;
        document.querySelectorAll(`.chat-message[data-user-id="${userId}"]`).forEach(msgEl => {
            activeMessages.delete(msgEl);
            msgEl.remove();
        });
    }
  });
  