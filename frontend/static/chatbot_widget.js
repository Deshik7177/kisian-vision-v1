// Simple floating chatbot widget for farmers

(function() {
  // Create single floating icon (modern look)
  const icon = document.createElement('div');
  icon.id = 'farmer-chatbot-icon';
  icon.style.position = 'fixed';
  icon.style.left = '32px';
  icon.style.bottom = '32px';
  icon.style.zIndex = '9999';
  icon.style.width = '60px';
  icon.style.height = '60px';
  icon.style.background = 'linear-gradient(135deg, #10b981 60%, #34d399 100%)';
  icon.style.borderRadius = '16px';
  icon.style.boxShadow = '0 4px 24px rgba(16,185,129,0.18)';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.cursor = 'pointer';
  icon.title = 'Farmer Chatbot';
  icon.innerHTML = '<span style="font-size:34px;">🤖</span>';
  document.body.appendChild(icon);

  // Create hidden widget
  const widget = document.createElement('div');
  widget.id = 'farmer-chatbot-widget';
  widget.style.position = 'fixed';
  widget.style.left = '32px';
  widget.style.bottom = '32px';
  widget.style.zIndex = '10000';
  widget.style.width = '340px';
  widget.style.maxWidth = '95vw';
  widget.style.background = 'white';
  widget.style.borderRadius = '20px';
  widget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.18)';
  widget.style.border = '1.5px solid #d1fae5';
  widget.style.overflow = 'hidden';
  widget.style.display = 'none';
  widget.style.flexDirection = 'column';
  widget.style.fontFamily = 'Inter, Arial, sans-serif';
  widget.innerHTML = `
    <div style="background:linear-gradient(135deg,#10b981 60%,#34d399 100%);color:white;padding:12px 18px;font-weight:600;font-size:16px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;">🤖</span>
      <span>Farmer Chatbot <span style='font-size:12px;font-weight:400;'>(Beta)</span></span>
      <select id="chatbot-language" style="margin-left:10px;padding:2px 8px;border-radius:6px;border:none;font-size:13px;background:#f3f4f6;color:#222;">
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="te">తెలుగు</option>
      </select>
      <button id="close-chatbot" style="margin-left:auto;background:none;border:none;color:white;font-size:20px;cursor:pointer;">×</button>
    </div>
    <div id="chatbot-messages" style="flex:1;padding:14px;max-height:240px;overflow-y:auto;font-size:15px;background:#f9fafb;"></div>
    <form id="chatbot-form" style="display:flex;border-top:1.5px solid #d1fae5;background:#f3f4f6;">
      <input id="chatbot-input" type="text" placeholder="Ask your question..." style="flex:1;padding:10px 14px;border:none;font-size:15px;outline:none;background:#f3f4f6;" required />
      <button type="submit" style="background:linear-gradient(135deg,#10b981 60%,#34d399 100%);color:white;border:none;padding:0 18px;font-weight:600;font-size:15px;border-radius:8px;margin:6px 8px;cursor:pointer;">Send</button>
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
  const langSelect = widget.querySelector('#chatbot-language');

  closeBtn.onclick = function() {
    widget.style.display = 'none';
    icon.style.display = 'flex';
  };

  function addMessage(text, from, showFollowUp = false) {
    // Clean up response formatting: remove leading/trailing asterisks and extra whitespace
    let cleanText = text.replace(/^\*+|\*+$/g, '').replace(/\n/g, '<br>').trim();
    // Render double asterisks as bold
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Format numbered steps for professional look
    cleanText = cleanText.replace(/(\d+)\.\s*/g, '<br><span style="font-weight:600;color:#10b981;">$1.</span> ');
    // Remove any remaining stray asterisks
    cleanText = cleanText.replace(/\*/g, '');
    const msg = document.createElement('div');
    msg.style.marginBottom = '8px';
    msg.style.padding = '8px 10px';
    msg.style.background = from === 'bot' ? '#e6fff5' : '#f3f4f6';
    msg.style.borderRadius = '8px';
    msg.style.textAlign = 'left';
    msg.style.wordBreak = 'break-word';
    msg.innerHTML = `<span style="font-weight:600;color:${from==='bot'?'#10b981':'#374151'};">${from==='bot'?'Bot':'You'}:</span> <span>${cleanText}</span>`;
    if (from === 'bot' && showFollowUp) {
      const followBtn = document.createElement('button');
      followBtn.textContent = 'Ask for follow-up';
      followBtn.style.marginLeft = '10px';
      followBtn.style.background = 'linear-gradient(135deg,#10b981 60%,#34d399 100%)';
      followBtn.style.color = 'white';
      followBtn.style.border = 'none';
      followBtn.style.borderRadius = '6px';
      followBtn.style.padding = '2px 10px';
      followBtn.style.cursor = 'pointer';
      followBtn.onclick = function() {
        addMessage('Can you give me a follow-up advisory?', 'user');
        const selectedLang = langSelect.value;
        fetch('/chatbot-advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'Can you give me a follow-up advisory?', language: selectedLang })
        })
          .then(res => res.json())
          .then(data => {
            addMessage(data.answer || 'Sorry, no advisory available.', 'bot', false);
          })
          .catch(() => {
            addMessage('Sorry, advisory service is not available right now.', 'bot', false);
          });
      };
      msg.appendChild(followBtn);
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  form.onsubmit = function(e) {
    e.preventDefault();
    const userText = input.value.trim();
    const selectedLang = langSelect.value;
    if (!userText) return;
    addMessage(userText, 'user');
    input.value = '';
    // Send user question to backend advisory endpoint (POST /chatbot-advisory)
    fetch('/chatbot-advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userText, language: selectedLang })
    })
      .then(res => res.json())
      .then(data => {
        addMessage(data.answer || 'Sorry, no advisory available.', 'bot', true);
      })
      .catch(() => {
        addMessage('Sorry, advisory service is not available right now.', 'bot', false);
      });
  };
})();
