// Simple floating chatbot widget for farmers

(function() {
  // Create single floating icon
  const icon = document.createElement('div');
  icon.id = 'farmer-chatbot-icon';
  icon.style.position = 'fixed';
  icon.style.left = '20px';
  icon.style.bottom = '20px';
  icon.style.zIndex = '9999';
  icon.style.width = '56px';
  icon.style.height = '56px';
  icon.style.background = '#10b981';
  icon.style.borderRadius = '50%';
  icon.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.cursor = 'pointer';
  icon.title = 'Farmer Chatbot (Beta version coming soon)';
  icon.innerHTML = '<span style="font-size:32px;">🤖</span>';
  document.body.appendChild(icon);

  // Create hidden widget
  const widget = document.createElement('div');
  widget.id = 'farmer-chatbot-widget';
  widget.style.position = 'fixed';
  widget.style.left = '20px';
  widget.style.bottom = '20px';
  widget.style.zIndex = '10000';
  widget.style.width = '320px';
  widget.style.maxWidth = '90vw';
  widget.style.background = 'white';
  widget.style.borderRadius = '16px';
  widget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.12)';
  widget.style.border = '1px solid #e2e8f0';
  widget.style.overflow = 'hidden';
  widget.style.display = 'none';
  widget.style.flexDirection = 'column';
  widget.style.fontFamily = 'Inter, Arial, sans-serif';
  widget.innerHTML = `
    <div style="background:#10b981;color:white;padding:10px 16px;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:20px;">🤖</span>
      <span>Farmer Chatbot <span style='font-size:12px;font-weight:400;'>(Beta version coming soon)</span></span>
      <button id="close-chatbot" style="margin-left:auto;background:none;border:none;color:white;font-size:18px;cursor:pointer;">×</button>
    </div>
    <div id="chatbot-messages" style="flex:1;padding:12px;max-height:220px;overflow-y:auto;font-size:14px;"></div>
    <form id="chatbot-form" style="display:flex;border-top:1px solid #e2e8f0;">
      <input id="chatbot-input" type="text" placeholder="Ask your question..." style="flex:1;padding:8px 12px;border:none;font-size:14px;outline:none;" required />
      <button type="submit" style="background:#10b981;color:white;border:none;padding:0 16px;font-weight:500;font-size:14px;cursor:pointer;">Send</button>
    </form>
  `;
  document.body.appendChild(widget);

  icon.onclick = function() {
    widget.style.display = 'flex';
    icon.style.display = 'none';
  };

  const messages = widget.querySelector('#chatbot-messages');
  const form = widget.querySelector('#chatbot-form');
  const input = widget.querySelector('#chatbot-input');
  const closeBtn = widget.querySelector('#close-chatbot');

  closeBtn.onclick = function() {
    widget.style.display = 'none';
    icon.style.display = 'flex';
  };

  function addMessage(text, from) {
    const msg = document.createElement('div');
    msg.style.marginBottom = '8px';
    msg.innerHTML = `<span style="font-weight:600;color:${from==='bot'?'#10b981':'#374151'};">${from==='bot'?'Bot':'You'}:</span> <span>${text}</span>`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  form.onsubmit = function(e) {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;
    addMessage(userText, 'user');
    input.value = '';
    // Simulate bot response (replace with real API call)
    setTimeout(() => {
      addMessage('Thank you for your question! Our advisory will be with you soon.', 'bot');
    }, 900);
  };
})();
