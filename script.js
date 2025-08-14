// Enhanced Chat Widget with glassmorphism design
class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupAnimations();
        this.setupDragFunctionality();

        this.showWelcomeNotification();
    }
    
    initializeElements() {
        this.chatButton = document.getElementById('chatButton');
        this.chatWindow = document.getElementById('chatWindow');
        this.chatClose = document.getElementById('chatClose');
        this.chatInput = document.getElementById('chatInput');
        this.chatSend = document.getElementById('chatSend');
        this.chatMessages = document.getElementById('chatMessages');
    }
    
    attachEventListeners() {
        // Chat button events
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.chatClose.addEventListener('click', () => this.closeChat());
        
        // Message sending events
        this.chatSend.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        

        // Input events
        this.chatInput.addEventListener('input', () => this.handleTyping());
        
        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-widget') && this.isOpen) {
                this.closeChat();
            }
        });
        
        // Escape key to close chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }
    
    setupAnimations() {
        // Animate progress bars on scroll
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
                    this.animateValue(entry.target);
                }
            });
        });
        
        stats.forEach(stat => statsObserver.observe(stat));
    }
    
    animateValue(element) {
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
    
    showWelcomeNotification() {
        // Simple welcome notification functionality
        console.log('Chat widget initialized and ready');
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.chatWindow.style.display = 'flex';
        this.isOpen = true;
        
        // Hide pulse
        const pulse = document.querySelector('.chat-pulse');
        if (pulse) pulse.style.display = 'none';
        
        // Focus input after animation
        setTimeout(() => {
            this.chatInput.focus();
        }, 300);
        
        // Track analytics (if needed)
        this.trackEvent('chat_opened');
    }
    
    closeChat() {
        this.chatWindow.style.display = 'none';
        this.isOpen = false;
        
        // Show pulse again
        const pulse = document.querySelector('.chat-pulse');
        if (pulse) pulse.style.display = 'block';
        
        this.trackEvent('chat_closed');
    }
    
    setupDragFunctionality() {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        // Make the chat header draggable
        const chatHeader = this.chatWindow.querySelector('.chat-header');
        
        chatHeader.classList.add('drag-cursor');
        chatHeader.style.userSelect = 'none';
        
        const startDrag = (e) => {
            // Only start drag if clicking on header (not buttons or other elements)
            if (e.target.closest('.chat-close')) return;
            
            isDragging = true;
            
            const rect = this.chatWindow.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            chatHeader.classList.remove('drag-cursor');
            chatHeader.classList.add('drag-cursor-grabbing');
        };
        
        const handleDrag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            let newLeft = e.clientX - dragOffset.x;
            let newTop = e.clientY - dragOffset.y;
            
            // Get window dimensions
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const chatWidth = this.chatWindow.offsetWidth;
            const chatHeight = this.chatWindow.offsetHeight;
            
            // Constrain to viewport bounds
            newLeft = Math.max(10, Math.min(newLeft, windowWidth - chatWidth - 10));
            newTop = Math.max(10, Math.min(newTop, windowHeight - chatHeight - 10));
            
            // Update position
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
            
            // Restore cursor and text selection
            document.body.style.userSelect = '';
            chatHeader.classList.remove('drag-cursor-grabbing');
            chatHeader.classList.add('drag-cursor');
        };
        
        // Attach drag events
        chatHeader.addEventListener('mousedown', startDrag);
        
        // Reset position when chat is reopened
        const originalOpenChat = this.openChat.bind(this);
        this.openChat = () => {
            originalOpenChat();
            
            // Reset to default position on open
            setTimeout(() => {
                this.chatWindow.style.position = 'absolute';
                this.chatWindow.style.left = 'auto';
                this.chatWindow.style.top = 'auto';
                this.chatWindow.style.right = '0';
                this.chatWindow.style.bottom = '80px';
            }, 100);
        };
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        

        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Call webhook
            const response = await this.callWebhook(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response with delay for natural feel
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
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                timestamp: new Date().toISOString(),
                userId: this.getUserId(),
                sessionId: this.getSessionId(), // Unique session ID that resets on page refresh
                context: {
                    page: 'landing-page',
                    previousMessages: this.messages.slice(-3) // Last 3 messages for context
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response || data.message || 'Thank you for your question. Our team will get back to you soon.';
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${this.formatMessage(text)}</p>`;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({
            text: text,
            sender: sender,
            timestamp: new Date()
        });
    }
    
    formatMessage(text) {
        // Basic markdown support for links and emphasis
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
    

    
    showTypingIndicator() {
        this.isTyping = true;
        this.chatSend.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="loading-dots">
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
        
        const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    

    
    handleTyping() {
        // Could implement typing indicators or auto-suggestions here
        const inputValue = this.chatInput.value;
        
        // Enable/disable send button based on input
        this.chatSend.disabled = !inputValue.trim() || this.isTyping;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    getUserId() {
        // Generate or retrieve user ID for session tracking
        let userId = localStorage.getItem('chatUserId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatUserId', userId);
        }
        return userId;
    }
    
    getSessionId() {
        // Generate unique session ID that resets on page refresh
        // This ensures each browser session has isolated chat memory
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }
    
    trackEvent(eventName, properties = {}) {
        // Analytics tracking (implement with your preferred analytics service)
        console.log('Analytics Event:', eventName, properties);
        
        // Example: Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'chat_widget',
                ...properties
            });
        }
    }
}

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
        
        // Change navbar background based on scroll
        if (currentScrollY > 100) {
            navbar.style.background = 'rgba(10, 20, 40, 0.95)';
            navbar.style.borderBottom = '1px solid rgba(79, 156, 249, 0.2)';
        } else {
            navbar.style.background = 'rgba(10, 20, 40, 0.8)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
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
            this.style.boxShadow = '0 20px 60px rgba(79, 156, 249, 0.2)';
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

// Particle background effect (optional enhancement)
function initParticleEffect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.3;
    `;
    
    document.body.appendChild(canvas);
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = '#4f9cf9';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function init() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    resizeCanvas();
    init();
    animate();
    
    window.addEventListener('resize', resizeCanvas);
}

// Add CSS for ripple animation
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chat widget
    new ChatWidget();
    
    // Initialize other features
    initSmoothScrolling();
    initNavbarEffects();
    initButtonEffects();
    initServiceCardEffects();
    initScrollAnimations();
    
    // Optional: Add particle effect (uncomment to enable)
    // initParticleEffect();
    
    console.log('🚀 MedFlow RCM Landing Page initialized!');
    console.log('💬 Chat widget ready for n8n webhook integration');
});
