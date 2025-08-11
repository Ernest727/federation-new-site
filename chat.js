// Chat functionality for Youth for East African Federation
(function() {
    'use strict';

    // DOM elements
    const chatButton = document.getElementById('chatButton');
    const chatPanel = document.getElementById('chatPanel');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    // Chat state
    let isStreaming = false;
    const messages = [
        {
            role: "system",
            content: "You are a helpful assistant for Youth for East African Federation (YEF). You provide information about YEF's mission to unite East African youth, our programs for cross-border collaboration, and how people can get involved. Be enthusiastic about East African unity and youth empowerment. Keep responses concise and friendly."
        }
    ];

    // Initialize chat
    function init() {
        // Toggle chat panel
        chatButton.addEventListener('click', toggleChat);
        chatClose.addEventListener('click', closeChat);

        // Send message
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (!chatPanel.contains(e.target) && !chatButton.contains(e.target)) {
                closeChat();
            }
        });
    }

    // Toggle chat panel
    function toggleChat() {
        if (chatPanel.classList.contains('active')) {
            closeChat();
        } else {
            openChat();
        }
    }

    function openChat() {
        chatPanel.classList.add('active');
        chatInput.focus();
    }

    function closeChat() {
        chatPanel.classList.remove('active');
    }

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isStreaming) return;

        // Add user message to chat
        appendMessage('user', message);
        messages.push({ role: 'user', content: message });

        // Clear input and disable controls
        chatInput.value = '';
        setStreamingState(true);

        // Show typing indicator
        showTypingIndicator();

        try {
            // Call Netlify function
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Hide typing indicator and create assistant message container
            hideTypingIndicator();
            const messageElement = appendMessage('assistant', '');
            const contentElement = messageElement.querySelector('.message-content');

            // Stream the response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                assistantMessage += content;
                                contentElement.textContent = assistantMessage;
                                scrollToBottom();
                            }
                        } catch (e) {
                            // Skip invalid JSON chunks
                            console.debug('Skipping chunk:', data);
                        }
                    }
                }
            }

            // Add assistant message to history
            if (assistantMessage) {
                messages.push({ role: 'assistant', content: assistantMessage });
            }

        } catch (error) {
            console.error('Chat error:', error);
            hideTypingIndicator();
            
            // Show error message
            appendMessage('assistant', 'Chat temporarily unavailable. Please try again later or contact us directly at hello@yefederation.org');
        } finally {
            setStreamingState(false);
        }
    }

    // Append message to chat
    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        return messageDiv;
    }

    // Typing indicator
    function showTypingIndicator() {
        typingIndicator.classList.add('active');
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.classList.remove('active');
        if (typingIndicator.parentNode === chatMessages) {
            chatMessages.removeChild(typingIndicator);
        }
    }

    // Set streaming state
    function setStreamingState(streaming) {
        isStreaming = streaming;
        chatInput.disabled = streaming;
        chatSend.disabled = streaming;
    }

    // Scroll to bottom of messages
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();