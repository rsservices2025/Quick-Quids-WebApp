// client/js/utils.js

// इस फ़ाइल में कोई import/export स्टेटमेंट नहीं होनी चाहिए।

// अलर्ट मैसेज दिखाने और छिपाने के लिए
function showMessage(type, message) {
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
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// पासवर्ड वैलिडेट करने के लिए (कम से कम 8 अक्षर)
function isValidPassword(password) {
    return password.length >= 8;
}

// Coming Soon पॉपअप दिखाने के लिए
function showComingSoon() {
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
function hideComingSoon() {
    const overlay = document.querySelector('.coming-soon-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300); // ट्रांजीशन के बाद एलिमेंट हटा दें
    }
}

// इन फंक्शंस को 'window' ऑब्जेक्ट पर अटैच करें ताकि वे ग्लोबल रूप से उपलब्ध हों
window.showMessage = showMessage;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
window.showComingSoon = showComingSoon;
window.hideComingSoon = hideComingSoon;