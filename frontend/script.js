class DSAInstructor {
    constructor() {
        this.apiKey = localStorage.getItem('dsaApiKey') || 'AIzaSyAxK2Jqte1qHnAgEawco8wvV_-TMiOYE2A';
        this.messages = [];
        this.isTyping = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.addWelcomeEffects();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModal = document.getElementById('closeModal');
        this.saveSettings = document.getElementById('saveSettings');
        this.apiKeyInput = document.getElementById('apiKey');
        this.themeSelect = document.getElementById('theme');
        this.quickBtns = document.querySelectorAll('.quick-btn');
    }

    bindEvents() {
        // Send message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick question buttons
        this.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Settings modal events
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.saveSettings.addEventListener('click', () => this.saveSettingsData());
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // Input focus and typing events
        this.messageInput.addEventListener('input', () => {
            this.sendBtn.disabled = this.messageInput.value.trim().length === 0;
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        if (!this.apiKey) {
            this.showError('Please set your Google GenAI API key in settings first!');
            this.openSettings();
            return;
        }

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;

        // Show typing indicator
        this.showTyping();

        try {
            // Make API call
            const response = await this.callGeminiAPI(message);
            this.hideTyping();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTyping();
            this.showError('Sorry, I encountered an error. Please try again.');
            console.error('API Error:', error);
        }
    }

    async callGeminiAPI(message) {
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-experimental:generateContent';
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: message
                }]
            }],
            systemInstruction: {
                parts: [{
                    text: `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
                    Data structure and Algorithm. You have to solve query of user in simplest way
                    If user ask any question which is not related to Data structure and Algorithm, reply him rudely
                    Example: If user ask, How are you
                    You will reply: You dumb ask me some sensible question, like this message you can reply anything more rudely
                    
                    You have to reply him rudely if question is not related to Data structure and Algorithm.
                    Else reply him politely with simple explanation. Keep your responses concise and educational.`
                }]
            }
        };

        try {
            // For demonstration, we'll use fetch to make the API call
            // In a real scenario, you might want to use a backend to hide your API key
            const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('API call failed:', error);
            
            // Fallback responses for demo purposes
            const dsaKeywords = ['array', 'linked list', 'tree', 'graph', 'sort', 'search', 'algorithm', 'data structure', 'big o', 'complexity', 'stack', 'queue', 'heap', 'hash', 'binary', 'recursion'];
            const isDSARelated = dsaKeywords.some(keyword => message.toLowerCase().includes(keyword));
            
            if (isDSARelated) {
                return "I'm currently experiencing technical difficulties with my knowledge base. Please check your API key in settings or try again later. In the meantime, I encourage you to review the fundamentals of the data structure or algorithm you're asking about!";
            } else {
                return "You dumb! Ask me something sensible about Data Structures and Algorithms! I'm not here to chat about random stuff. Come back when you have a real DSA question! 😤";
            }
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.innerHTML = this.formatMessage(text);
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        content.appendChild(messageText);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({ text, sender, timestamp: new Date().toISOString() });
    }

    formatMessage(text) {
        // Basic formatting for code blocks and emphasis
        return text
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message';
        errorDiv.innerHTML = `
            <div class="message-avatar" style="background: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="message-content">
                <div class="message-text" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">
                    ${message}
                </div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
    }

    openSettings() {
        this.settingsModal.style.display = 'flex';
        this.apiKeyInput.value = this.apiKey;
        this.themeSelect.value = localStorage.getItem('dsaTheme') || 'light';
    }

    closeSettings() {
        this.settingsModal.style.display = 'none';
    }

    saveSettingsData() {
        const newApiKey = this.apiKeyInput.value.trim();
        const newTheme = this.themeSelect.value;
        
        if (newApiKey) {
            this.apiKey = newApiKey;
            localStorage.setItem('dsaApiKey', newApiKey);
        }
        
        localStorage.setItem('dsaTheme', newTheme);
        this.applyTheme(newTheme);
        this.closeSettings();
        
        // Show success message
        this.addMessage('Settings saved successfully! 🎉', 'bot');
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('dsaTheme') || 'light';
        this.applyTheme(savedTheme);
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    addWelcomeEffects() {
        // Add sparkle effect to welcome message
        setTimeout(() => {
            const welcomeMessage = document.querySelector('.bot-message .message-text');
            if (welcomeMessage) {
                welcomeMessage.style.animation = 'messageSlideIn 0.5s ease-out, sparkle 2s ease-in-out infinite';
            }
        }, 500);

        // Auto-save API key if provided
        if (this.apiKey && !localStorage.getItem('dsaApiKey')) {
            localStorage.setItem('dsaApiKey', this.apiKey);
        }
    }

    addSparkleEffect(element) {
        const sparkles = ['✨', '💫', '⭐', '🌟'];
        const sparkle = document.createElement('span');
        sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        sparkle.style.position = 'absolute';
        sparkle.style.animation = 'sparkleFloat 1s ease-out forwards';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        
        element.style.position = 'relative';
        element.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
    }

    // Method to demonstrate cURL command generation
    generateCurlCommand(message) {
        const curlCommand = `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-experimental:generateContent?key=${this.apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "contents": [{
    "parts": [{
      "text": "${message.replace(/"/g, '\\"')}"
    }]
  }],
  "systemInstruction": {
    "parts": [{
      "text": "You are a Data structure and Algorithm Instructor. You will only reply to the problem related to Data structure and Algorithm. You have to solve query of user in simplest way. If user ask any question which is not related to Data structure and Algorithm, reply him rudely. You have to reply him rudely if question is not related to Data structure and Algorithm. Else reply him politely with simple explanation."
    }]
  }
}'`;
        
        console.log('Generated cURL command:', curlCommand);
        return curlCommand;
    }
}

// Additional utility functions for cURL integration
class CurlHelper {
    static async executeCurlCommand(message, apiKey) {
        const curlCommand = `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-experimental:generateContent?key=${apiKey}" -H "Content-Type: application/json" -d '{"contents":[{"parts":[{"text":"${message}"}]}],"systemInstruction":{"parts":[{"text":"You are a Data structure and Algorithm Instructor. You will only reply to the problem related to Data structure and Algorithm. You have to solve query of user in simplest way. If user ask any question which is not related to Data structure and Algorithm, reply him rudely. You have to reply him rudely if question is not related to Data structure and Algorithm. Else reply him politely with simple explanation."}]}}'`;
        
        try {
            // Note: This is a demonstration. In a real browser environment, 
            // you can't execute shell commands directly. This would need to be 
            // handled by a backend service.
            console.log('cURL Command that would be executed:', curlCommand);
            
            // For now, we'll use fetch as a fallback
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-experimental:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }],
                    systemInstruction: {
                        parts: [{
                            text: "You are a Data structure and Algorithm Instructor. You will only reply to the problem related to Data structure and Algorithm. You have to solve query of user in simplest way. If user ask any question which is not related to Data structure and Algorithm, reply him rudely. You have to reply him rudely if question is not related to Data structure and Algorithm. Else reply him politely with simple explanation."
                        }]
                    }
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error executing cURL equivalent:', error);
            throw error;
        }
    }
    
    static copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dsaInstructor = new DSAInstructor();
    
    // Make it globally accessible for debugging
    window.dsaInstructor = dsaInstructor;
    window.CurlHelper = CurlHelper;
    
    console.log('DSA Instructor Chat initialized!');
    console.log('Use dsaInstructor.generateCurlCommand("your question") to generate cURL commands');
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}