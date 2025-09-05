// Enhanced Cosentus Chatbot with modern design
(function() {
    'use strict';
    
    class CosentusChatbot {
        constructor(config = {}) {
            this.config = Object.assign({
                position: 'bottom-right',
                logoUrl: 'https://cosentus.com/wp-content/uploads/2021/08/New-Cosentus-Logo-1.png',
                agentLogoUrl: 'https://cosentus.com/wp-content/uploads/2025/09/lion_transparent.png',
                companyName: 'Cosentus',
                welcomeMessage: 'Welcome to Cosentus! How may I help you today?',
                primaryColor: '#01B2D6'
            }, config);
            
            this.isOpen = false;
            this.messages = [];
            this.isTyping = false;
            this.sessionId = null;
            
            this.init();
        }
        
        init() {
            this.initializeElements();
            this.attachEventListeners();
            this.setupDragFunctionality();
            this.addMessage(this.config.welcomeMessage, 'bot');
        }
        
        initializeElements() {
            this.chatButton = document.querySelector('.cosentus-chat-button');
            this.chatWindow = document.querySelector('.cosentus-chat-window');
            this.chatClose = document.querySelector('.cosentus-chat-close');
            this.chatInput = document.querySelector('.cosentus-chat-input');
            this.chatSend = document.querySelector('.cosentus-chat-send');
            this.chatMessages = document.querySelector('.cosentus-chat-messages');
        }
        
        attachEventListeners() {
            this.chatButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleChat();
            });
            this.chatClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeChat();
            });
            this.chatSend.addEventListener('click', () => this.sendMessage());
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.chatInput.addEventListener('input', () => this.handleTyping());
            
            // Delay the document click listener to avoid immediate conflicts
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.cosentus-chatbot') && this.isOpen) {
                        this.closeChat();
                    }
                });
            }, 100);
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeChat();
                }
            });
        }
        
        toggleChat() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        }
        
        openChat() {
            this.chatWindow.classList.remove('slide-down');
            this.chatWindow.style.display = 'flex';
            this.isOpen = true;
            this.chatWindow.offsetHeight;
            
            const pulse = document.querySelector('.cosentus-chat-pulse');
            if (pulse) pulse.style.display = 'none';
            
            this.chatButton.classList.add('chat-open');
            
            setTimeout(() => {
                this.chatInput.focus();
            }, 320);
            
            this.trackEvent('chat_opened');
        }
        
        closeChat() {
            if (!this.isOpen) return;
            
            this.isOpen = false;
            this.chatButton.classList.remove('chat-open');
            const pulse = document.querySelector('.cosentus-chat-pulse');
            if (pulse) pulse.style.display = 'block';
            
            this.chatWindow.classList.add('slide-down');
            
            const handleAnimationEnd = () => {
                this.chatWindow.style.display = 'none';
                this.chatWindow.classList.remove('slide-down');
                this.chatWindow.removeEventListener('animationend', handleAnimationEnd);
            };
            
            this.chatWindow.addEventListener('animationend', handleAnimationEnd);
            
            setTimeout(() => {
                if (this.chatWindow.classList.contains('slide-down')) {
                    handleAnimationEnd();
                }
            }, 350);
            
            this.trackEvent('chat_closed');
        }
        
        setupDragFunctionality() {
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            const chatHeader = this.chatWindow.querySelector('.cosentus-chat-header');
            chatHeader.classList.add('cosentus-drag-cursor');
            chatHeader.style.userSelect = 'none';
            
            const startDrag = (e) => {
                if (e.target.closest('.cosentus-chat-close')) return;
                
                isDragging = true;
                const rect = this.chatWindow.getBoundingClientRect();
                dragOffset.x = e.clientX - rect.left;
                dragOffset.y = e.clientY - rect.top;
                
                document.addEventListener('mousemove', handleDrag);
                document.addEventListener('mouseup', stopDrag);
                
                document.body.style.userSelect = 'none';
                chatHeader.classList.remove('cosentus-drag-cursor');
                chatHeader.classList.add('cosentus-drag-cursor-grabbing');
            };
            
            const handleDrag = (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                
                let newLeft = e.clientX - dragOffset.x;
                let newTop = e.clientY - dragOffset.y;
                
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const chatWidth = this.chatWindow.offsetWidth;
                const chatHeight = this.chatWindow.offsetHeight;
                
                newLeft = Math.max(10, Math.min(newLeft, windowWidth - chatWidth - 10));
                newTop = Math.max(10, Math.min(newTop, windowHeight - chatHeight - 10));
                
                this.chatWindow.style.position = 'fixed';
                this.chatWindow.style.left = newLeft + 'px';
                this.chatWindow.style.top = newTop + 'px';
                this.chatWindow.style.right = 'auto';
                this.chatWindow.style.bottom = 'auto';
            };
            
            const stopDrag = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', stopDrag);
                
                document.body.style.userSelect = '';
                chatHeader.classList.remove('cosentus-drag-cursor-grabbing');
                chatHeader.classList.add('cosentus-drag-cursor');
            };
            
            chatHeader.addEventListener('mousedown', startDrag);
        }

        async sendMessage() {
            const message = this.chatInput.value.trim();
            if (!message || this.isTyping) return;
            
            this.addMessage(message, 'user');
            this.chatInput.value = '';
            
            // Delay typing indicator by 1 second for better UX
            setTimeout(() => {
                this.showTypingIndicator();
            }, 1000);
            
            try {
                const response = await this.callWebhook(message);
                this.hideTypingIndicator();
                
                setTimeout(() => {
                    this.addMessage(response, 'bot');
                }, 500);
                
                this.trackEvent('message_sent', { message: message });
                
            } catch (error) {
                console.error('Chat error:', error);
                this.hideTypingIndicator();
                
                setTimeout(() => {
                    this.addMessage(
                        "I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact our support team directly.",
                        'bot'
                    );
                }, 500);
                
                this.trackEvent('message_error', { error: error.message });
            }
        }
        
        async callWebhook(message) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        timestamp: new Date().toISOString(),
                        userId: this.getUserId(),
                        sessionId: this.getSessionId(),
                        context: {
                            page: 'landing-page',
                            previousMessages: this.messages.slice(-3)
                        }
                    }),
                    timeout: 30000
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return data.response || data.message || 'Thank you for your message.';
                
            } catch (error) {
                console.error('Webhook Error:', error);
                throw error;
            }
        }
        
        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `cosentus-message ${sender}-message`;
            
            // Add smooth fade-in animation for bot messages
            if (sender === 'bot') {
                messageDiv.classList.add('fade-in');
            }
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'cosentus-message-content';
            
            if (sender === 'bot') {
                contentDiv.innerHTML = `
                    <div class="cosentus-agent-title">
                        <img src="${this.config.agentLogoUrl}" alt="Cosentus Lion" class="cosentus-agent-logo">
                        ${this.config.companyName} AI Agent
                    </div>
                    <p>${this.formatMessage(text)}</p>
                `;
            } else {
                contentDiv.innerHTML = `<p>${this.formatMessage(text)}</p>`;
            }
            
            messageDiv.appendChild(contentDiv);
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            
            this.messages.push({
                text: text,
                sender: sender,
                timestamp: new Date()
            });
        }
        
        formatMessage(text) {
            let formatted = text
                // Handle bold and italic formatting
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                
                // Convert double newlines to paragraph breaks (better spacing)
                .replace(/\n\n/g, '<br><br>')
                // Convert single newlines to line breaks
                .replace(/\n/g, '<br>')
                
                // Format bullet points with proper spacing and indentation
                .replace(/•\s*/g, '<br>&nbsp;&nbsp;• ')
                
                // Format section headers (lines ending with colon)
                .replace(/<br>([^<]*:)<br>/g, '<br><strong>$1</strong><br>')
                
                // Format numbered lists (1. 2. 3. etc.)
                .replace(/(\d+)\.\s*/g, '<br>&nbsp;&nbsp;$1. ')
                
                // Clean up any leading line breaks
                .replace(/^<br>/, '')
                .replace(/^&nbsp;&nbsp;/, '');
            
            // Handle links (markdown style and plain URLs)
            formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
            formatted = formatted.replace(/(^|[^"'>])(https?:\/\/[^\s<>"']+)/gi, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
            
            return formatted;
        }
        
        showTypingIndicator() {
            this.isTyping = true;
            this.chatSend.disabled = true;
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'cosentus-message bot-message cosentus-typing-indicator';
            typingDiv.innerHTML = `
                <div class="cosentus-message-content">
                    <div class="cosentus-agent-title">
                        <img src="${this.config.agentLogoUrl}" alt="Cosentus Lion" class="cosentus-agent-logo">
                        ${this.config.companyName} AI Agent
                    </div>
                    <div class="cosentus-loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            
            this.chatMessages.appendChild(typingDiv);
            this.scrollToBottom();
        }
        
        hideTypingIndicator() {
            this.isTyping = false;
            this.chatSend.disabled = false;
            
            const typingIndicator = this.chatMessages.querySelector('.cosentus-typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        handleTyping() {
            this.chatSend.disabled = !this.chatInput.value.trim() || this.isTyping;
        }
        
        scrollToBottom() {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
        
        getUserId() {
            let userId = localStorage.getItem('cosentus_chatUserId');
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('cosentus_chatUserId', userId);
            }
            return userId;
        }
        
        getSessionId() {
            if (!this.sessionId) {
                // Generate or retrieve persistent session ID for conversation continuity
                let persistentSessionId = localStorage.getItem('cosentus_session_id_v2');
                if (!persistentSessionId) {
                    persistentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('cosentus_session_id_v2', persistentSessionId);
                }
                this.sessionId = persistentSessionId;
            }
            return this.sessionId;
        }
        
        trackEvent(eventName, properties = {}) {
            // Google Analytics 4 integration
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: 'cosentus_chat',
                    ...properties
                });
            }
        }
        
        // Public API methods
        open() {
            this.openChat();
        }
        
        close() {
            this.closeChat();
        }
        
        sendBotMessage(message) {
            this.addMessage(message, 'bot');
        }
        
        clearMessages() {
            this.chatMessages.innerHTML = '';
            this.messages = [];
            this.addMessage(this.config.welcomeMessage, 'bot');
        }
    }
    
    // Initialize when everything is ready
    function initChatbot() {
        // Check if already initialized
        if (window.cosentusChatbot) {
            return;
        }
        
        // Double check that DOM elements exist
        const button = document.querySelector('.cosentus-chat-button');
        if (!button) {
            // Try again in 500ms
            setTimeout(initChatbot, 500);
            return;
        }
        
        try {
            // Initialize the chatbot
            window.cosentusChatbot = new CosentusChatbot();
        } catch (error) {
            console.error('Cosentus Chat: Initialization failed', error);
        }
    }
    
    // Multiple initialization strategies for compatibility
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        // DOM already loaded
        initChatbot();
    }
    
})();

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navbar scroll effect
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Change navbar background based on scroll - keep cyan color
        if (currentScrollY > 100) {
            navbar.style.background = '#01B2D6';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
        } else {
            navbar.style.background = '#01B2D6';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        }
        
        // Hide/show navbar on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Interactive button effects
function initButtonEffects() {
    document.querySelectorAll('.glass-button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Ripple effect on click
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Service card hover effects
function initServiceCardEffects() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            this.style.boxShadow = '0 20px 60px rgba(1, 178, 214, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            const isFeatured = this.classList.contains('featured');
            this.style.transform = isFeatured ? 'translateY(0) scale(1.05)' : 'translateY(0) scale(1)';
            this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        });
    });
}

// Intersection Observer for animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate sections on scroll
    document.querySelectorAll('.service-card, .feature-highlight, .metric-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Animate progress bars on scroll
function initProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'width 2s ease';
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
    
    // Animate stats on scroll
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target);
            }
        });
    });
    
    stats.forEach(stat => statsObserver.observe(stat));
}

function animateValue(element) {
    const finalValue = element.textContent;
    const isPercentage = finalValue.includes('%');
    const isDays = finalValue.includes('Days') || finalValue === '24/7';
    
    if (isDays) return; // Skip animation for complex values
    
    const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
    const duration = 2000;
    const increment = numericValue / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        if (isPercentage) {
            element.textContent = Math.floor(current) + '%';
        } else {
            element.textContent = '$' + current.toFixed(1) + 'M';
        }
    }, 16);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize other features
    initSmoothScrolling();
    initNavbarEffects();
    initButtonEffects();
    initServiceCardEffects();
    initScrollAnimations();
    initProgressAnimations();
});