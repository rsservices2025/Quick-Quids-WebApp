// client/js/utils.js

// अलर्ट मैसेज दिखाने और छिपाने के लिए
export function showMessage(type, message) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    messageContainer.className = `alert-message alert-${type}`;
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000); // 5 सेकंड बाद छिपाएं
}

// ईमेल वैलिडेट करने के लिए
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// पासवर्ड वैलिडेट करने के लिए (कम से कम 8 अक्षर)
export function isValidPassword(password) {
    return password.length >= 8;
}

// Coming Soon पॉपअप दिखाने के लिए
export function showComingSoon() {
    const overlay = document.createElement('div');
    overlay.className = 'coming-soon-overlay active';
    overlay.innerHTML = `
        <div class="coming-soon-box">
            <p>This feature is coming soon!</p>
            <button id="comingSoonOkBtn">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Dynamic button for hideComingSoon
    document.getElementById('comingSoonOkBtn').addEventListener('click', hideComingSoon);
}

// Coming Soon पॉपअप छिपाने के लिए
export function hideComingSoon() {
    const overlay = document.querySelector('.coming-soon-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300); // ट्रांजीशन के बाद एलिमेंट हटा दें
    }
}