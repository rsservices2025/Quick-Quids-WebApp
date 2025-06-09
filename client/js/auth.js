// client/js/auth.js

// Appwrite सेवाओं को appwriteConfig.js से इम्पोर्ट करें
import {
    appwriteAccount,
    appwriteDatabases,
    AppwriteQuery,
    AppwriteID,
    DATABASE_ID,
    USERS_COLLECTION_ID
} from './appwriteConfig.js';

// utils.js से फंक्शंस इम्पोर्ट करें
import { showMessage, isValidEmail, isValidPassword } from './utils.js';

// Appwrite सेवाओं को आसान नामों में असाइन करें (वैकल्पिक, कोड को थोड़ा छोटा करने के लिए)
const account = appwriteAccount;
const databases = appwriteDatabases;
const Query = AppwriteQuery;
const ID = AppwriteID;

// --- लॉगिन फंक्शन ---
async function handleLogin(event) {
    event.preventDefault(); // फॉर्म के डिफ़ॉल्ट सबमिशन को रोकें

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!isValidEmail(email)) {
        showMessage('error', 'Please enter a valid email address.');
        return;
    }
    if (!isValidPassword(password)) {
        showMessage('error', 'Password must be at least 8 characters long.');
        return;
    }

    try {
        // Appwrite में ईमेल और पासवर्ड से सेशन बनाएं
        const session = await account.createEmailSession(email, password);
        console.log('Login successful:', session);
        showMessage('success', 'Logged in successfully!');

        // यूज़र की Appwrite Account ID प्राप्त करें
        const currentUser = await account.get();
        const userId = currentUser.$id;

        // 'users' कलेक्शन से यूज़र की प्रोफ़ाइल ढूंढें और रोल प्राप्त करें
        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('userId', userId)]
        );

        if (response.documents.length > 0) {
            const userProfile = response.documents[0];
            if (userProfile.isBlocked) {
                await account.deleteSession('current'); // अगर यूज़र ब्लॉक है तो सेशन डिलीट करें
                showMessage('error', 'Your account has been blocked. Please contact support.');
                return;
            }

            const role = userProfile.role;
            localStorage.setItem('userRole', role); // रोल को लोकल स्टोरेज में सेव करें
            localStorage.setItem('userName', userProfile.name); // नाम को लोकल स्टोरेज में सेव करें

            // रोल के आधार पर सही पैनल पर रीडायरेक्ट करें
            if (role === 'admin') {
                window.location.href = 'admin_panel.html';
            } else if (role === 'user') {
                window.location.href = 'user_panel.html';
            } else {
                showMessage('error', 'Unknown user role.');
                await account.deleteSession('current'); // अज्ञात रोल के लिए सेशन डिलीट करें
            }
        } else {
            showMessage('error', 'User profile not found. Please contact support.');
            await account.deleteSession('current'); // प्रोफ़ाइल नहीं मिली तो सेशन डिलीट करें
        }

    } catch (error) {
        console.error('Login error:', error);
        // Appwrite error codes के आधार पर विशिष्ट मैसेज दें
        if (error.code === 401) {
            showMessage('error', 'Invalid email or password.');
        } else {
            showMessage('error', 'Login failed: ' + (error.message || 'Unknown error.'));
        }
    }
}

// --- लॉगआउट फंक्शन ---
async function handleLogout() {
    try {
        await account.deleteSession('current'); // मौजूदा सेशन डिलीट करें
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        alert('You have been logged out.');
        window.location.href = 'index.html'; // लॉगिन पेज पर वापस रीडायरेक्ट करें
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// --- पासवर्ड बदलें फंक्शन (पैनल के अंदर) ---
async function handleChangePassword(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!isValidPassword(oldPassword) || !isValidPassword(newPassword)) {
        showMessage('error', 'Password must be at least 8 characters long.');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        showMessage('error', 'New password and confirm password do not match.');
        return;
    }
    if (oldPassword === newPassword) {
        showMessage('error', 'New password cannot be the same as the old password.');
        return;
    }

    try {
        // Appwrite में पासवर्ड अपडेट करें
        await account.updatePassword(newPassword, oldPassword);
        showMessage('success', 'Password changed successfully!');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Password change error:', error);
        if (error.code === 401) { // Incorrect old password
            showMessage('error', 'Incorrect old password. Please try again.');
        } else {
            showMessage('error', 'Failed to change password: ' + (error.message || 'Unknown error.'));
        }
    }
}

// --- पासवर्ड भूल गए फंक्शन ---
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value;

    if (!isValidEmail(email)) {
        showMessage('error', 'Please enter a valid email address.');
        return;
    }

    try {
        // Appwrite से पासवर्ड रिकवरी ईमेल भेजें
        // याद रखें, Appwrite में आपको पासवर्ड रिकवरी के लिए ईमेल सेटअप करना होगा
        await account.createRecovery(email, window.location.origin + '/reset_password.html'); // reset_password.html पेज बनाना होगा
        showMessage('success', 'Password reset link sent to your email!');
        document.getElementById('forgotPasswordForm').reset();
    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('error', 'Failed to send reset link: ' + (error.message || 'Unknown error.'));
    }
}

// --- पासवर्ड रीसेट फंक्शन (reset_password.html पर) ---
async function handleResetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmNewPassword = document.getElementById('resetConfirmNewPassword').value;

    if (!isValidPassword(newPassword)) {
        showMessage('error', 'New password must be at least 8 characters long.');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        showMessage('error', 'New password and confirm password do not match.');
        return;
    }

    try {
        // URL से userId और secret को प्राप्त करें
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (!userId || !secret) {
            showMessage('error', 'Invalid reset link.');
            return;
        }

        // Appwrite में पासवर्ड रीसेट करें
        await account.updateRecovery(userId, secret, newPassword, confirmNewPassword);
        showMessage('success', 'Your password has been reset successfully! You can now log in.');
        document.getElementById('resetPasswordForm').reset();
        setTimeout(() => {
            window.location.href = 'index.html'; // लॉगिन पेज पर रीडायरेक्ट करें
        }, 3000);
    } catch (error) {
        console.error('Reset password error:', error);
        showMessage('error', 'Failed to reset password: ' + (error.message || 'Unknown error.'));
    }
}


// --- इवेंट लिसनर ---
document.addEventListener('DOMContentLoaded', () => {
    // लॉगिन फॉर्म
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // लॉगआउट बटन
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // पासवर्ड बदलें फॉर्म (यह admin_panel या user_panel में हो सकता है)
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // पासवर्ड भूल गए फॉर्म (index.html पर)
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    // पासवर्ड रीसेट फॉर्म (reset_password.html पर, यह HTML आपको बनाना होगा)
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    // करंट सेशन चेक करें और वेलकम मैसेज डिस्प्ले करें
    async function checkUserSessionAndDisplayWelcome() {
        try {
            const currentUser = await account.get(); // यूज़र का सेशन एक्टिव है
            const userName = localStorage.getItem('userName');
            const welcomeText = document.getElementById('welcomeText');
            if (welcomeText && userName) {
                welcomeText.textContent = `Welcome, ${userName} To Quick-Quids`;
            } else if (welcomeText) {
                // अगर नाम लोकल स्टोरेज में नहीं है, तो प्रोफाइल से fetch करें
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    [Query.equal('userId', currentUser.$id)]
                );
                if (response.documents.length > 0) {
                    const userProfile = response.documents[0];
                    welcomeText.textContent = `Welcome, ${userProfile.name} To Quick-Quids`;
                    localStorage.setItem('userName', userProfile.name);
                    localStorage.setItem('userRole', userProfile.role);
                }
            }
        } catch (error) {
            // अगर कोई सेशन नहीं है (जैसे 401), तो कुछ न करें
            // या अगर गलत पेज पर है तो रीडायरेक्ट करें (जैसे user_panel पर बिना लॉगिन)
            if (error.code === 401 && !window.location.href.includes('index.html') && !window.location.href.includes('reset_password.html')) {
                // अगर लॉगिन नहीं है और लॉगिन/रीसेट पेज पर नहीं है तो लॉगिन पेज पर भेजें
                window.location.href = 'index.html';
            }
        }
    }
    checkUserSessionAndDisplayWelcome();

    // Forgot password और लॉगिन फॉर्म के बीच स्विच करने का लॉजिक (index.html के लिए)
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const loginSection = document.getElementById('loginSection');
    const forgotPasswordSection = document.getElementById('forgotPasswordSection');

    if (forgotPasswordLink && loginSection && forgotPasswordSection) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            forgotPasswordSection.style.display = 'block';
        });
    }

    if (backToLoginLink && loginSection && forgotPasswordSection) {
        backToLoginLink.addEventListener('click', () => {
            forgotPasswordSection.style.display = 'none';
            loginSection.style.display = 'block';
        });
    }
});