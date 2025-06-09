// client/js/userPanel.js

// Appwrite सेवाओं को ग्लोबल स्कोप से एक्सेस करें (window ऑब्जेक्ट के माध्यम से)
// इस फ़ाइल में कोई import/export स्टेटमेंट नहीं होनी चाहिए।
const account = window.appwriteAccount;
const databases = window.appwriteDatabases;
const storage = window.appwriteStorage;
const Query = window.AppwriteQuery;
const ID = window.AppwriteID;
const Permission = window.AppwritePermission;
const Role = window.AppwriteRole;

const DATABASE_ID = window.APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = window.APPWRITE_USERS_COLLECTION_ID;
const QRS_COLLECTION_ID = window.APPWRITE_QRS_COLLECTION_ID;
const TRANSACTIONS_COLLECTION_ID = window.APPWRITE_TRANSACTIONS_COLLECTION_ID;

// utils.js से फंक्शंस को ग्लोबल स्कोप से एक्सेस करें
const showMessage = window.showMessage;
const showComingSoon = window.showComingSoon;

let currentUserId = null;
let selectedQrId = null;
let selectedQrAmount = 0;
let selectedQrIsCustomAllowed = false;
let qrImageFileId = null; // To store the file ID of the displayed QR

document.addEventListener('DOMContentLoaded', async () => {
    // सुनिश्चित करें कि यूज़र लॉग इन है और उसकी भूमिका 'user' है
    try {
        const currentUser = await account.get();
        currentUserId = currentUser.$id;

        const userProfile = (await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('userId', currentUserId)]
        )).documents[0];

        if (!userProfile || userProfile.role !== 'user') {
            alert('Access Denied. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }

        // Welcome टेक्स्ट अपडेट करें
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Welcome, ${userProfile.name} To Quick-Quids`;
        }

        // साइडबार नेविगेशन हैंडल करें
        setupSidebarNavigation();

        // QR ऑप्शंस लोड करें
        loadQrOptions();

        // ट्रांजैक्शन लिस्ट लोड करें
        loadUserTransactions();

    } catch (error) {
        console.error('User Panel Initialization error:', error);
        alert('Please login to access the user panel.');
        window.location.href = 'index.html';
    }
});

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    const sections = document.querySelectorAll('.feature-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Active क्लास हटाएं
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // सभी सेक्शन्स को छिपाएं
            sections.forEach(sec => sec.classList.remove('active'));

            // क्लिक किए गए लिंक के आधार पर सही सेक्शन दिखाएं
            const targetId = link.id.replace('Link', 'Section');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // अगर सेक्शन QR Pay, IMPS, NEFT, Credit Card Bill है, तो Coming Soon दिखाएं
                if (link.id === 'impsLink' || link.id === 'neftLink' || link.id === 'creditCardBillLink') {
                    showComingSoon();
                }
                targetSection.classList.add('active');
            }
        });
    });
}

// --- QR Pay Logic ---
async function loadQrOptions() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            QRS_COLLECTION_ID,
            [Query.equal('isActive', true)] // केवल एक्टिव QRs दिखाएं
        );

        const qrOptionsList = document.getElementById('qrOptionsList');
        qrOptionsList.innerHTML = '<h3>Choose an option:</h3>';

        if (response.documents.length === 0) {
            qrOptionsList.innerHTML += '<p>No QR options available currently.</p>';
            return;
        }

        response.documents.forEach(qr => {
            const div = document.createElement('div');
            div.className = 'qr-option';
            div.dataset.qrId = qr.$id;
            div.dataset.qrAmount = qr.amount;
            div.dataset.qrIsCustomAllowed = qr.isCustomAmountAllowed;
            div.dataset.qrImageFileId = qr.qrImageFileId;

            let amountText = qr.amount > 0 ? `Amount: ₹${qr.amount.toFixed(2)}` : 'Custom Amount';
            div.innerHTML = `
                <h4>${qr.title}</h4>
                <p>${amountText}</p>
                <p>${qr.description || ''}</p>
            `;
            div.addEventListener('click', () => selectQrOption(qr));
            qrOptionsList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading QR options:', error);
        showMessage('error', 'Failed to load QR options.');
    }
}

async function selectQrOption(qr) {
    selectedQrId = qr.$id;
    selectedQrAmount = qr.amount;
    selectedQrIsCustomAllowed = qr.isCustomAmountAllowed;
    qrImageFileId = qr.qrImageFileId; // QR इमेज फाइल ID स्टोर करें

    document.getElementById('qrOptionsList').style.display = 'none';
    document.getElementById('qrDetailsForm').style.display = 'block';

    const payAmountInput = document.getElementById('payAmount');
    const qrDescriptionText = document.getElementById('qrDescriptionText');
    const selectedQrImage = document.getElementById('selectedQrImage');
    const payeeNameInput = document.getElementById('payeeName');
    const transactionIdInput = document.getElementById('transactionId');

    payAmountInput.value = selectedQrAmount > 0 ? selectedQrAmount : '';
    payAmountInput.readOnly = selectedQrAmount > 0 && !selectedQrIsCustomAllowed; // फिक्स्ड अमाउंट है तो रीडओनली

    qrDescriptionText.textContent = qr.description || '';

    // QR इमेज लोड करें
    if (qrImageFileId) {
        try {
            // Appwrite Storage में 'qr_images' बकेट की रीड परमिशन 'role:any' या 'role:user' पर होनी चाहिए
            const fileUrl = storage.getFileDownload('qr_images', qrImageFileId); // बकेट ID और फाइल ID
            selectedQrImage.src = fileUrl;
            selectedQrImage.style.display = 'block';
        } catch (error) {
            console.error('Error loading QR image:', error);
            selectedQrImage.style.display = 'none';
            showMessage('error', 'Failed to load QR image.');
        }
    } else {
        selectedQrImage.style.display = 'none';
    }

    payeeNameInput.value = '';
    transactionIdInput.value = '';
}

document.getElementById('backToQrOptions').addEventListener('click', () => {
    document.getElementById('qrOptionsList').style.display = 'block';
    document.getElementById('qrDetailsForm').style.display = 'none';
    document.getElementById('selectedQrImage').style.display = 'none'; // इमेज छिपाएं
});

document.getElementById('qrPayForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('payAmount').value);
    const payeeName = document.getElementById('payeeName').value;
    const transactionRefId = document.getElementById('transactionId').value;

    if (isNaN(amount) || amount <= 0) {
        showMessage('error', 'Please enter a valid amount.');
        return;
    }
    if (!payeeName || !transactionRefId) {
        showMessage('error', 'Payee Name and Transaction ID are required.');
        return;
    }
    if (!selectedQrId) {
        showMessage('error', 'Please select a QR option first.');
        return;
    }
    if (selectedQrAmount > 0 && amount !== selectedQrAmount && !selectedQrIsCustomAllowed) {
        showMessage('error', `Amount must be ₹${selectedQrAmount.toFixed(2)} for this QR.`);
        return;
    }

    try {
        await databases.createDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            ID.unique(),
            {
                userId: currentUserId,
                transactionType: 'qr_pay',
                qrId: selectedQrId,
                amount: amount,
                payeeName: payeeName,
                transactionRefId: transactionRefId,
                status: 'pending' // डिफ़ॉल्ट स्टेटस
            },
            [
                Permission.read(Role.user(currentUserId)), // यूज़र खुद अपनी ट्रांजैक्शन पढ़ सके
                Permission.read(Role.label('admin')) // एडमिन सभी ट्रांजैक्शन पढ़ सके
            ]
        );
        showMessage('success', 'Request successfully! Wait 2 - 5 min for update.');
        document.getElementById('qrPayForm').reset();
        document.getElementById('qrDetailsForm').style.display = 'none';
        document.getElementById('selectedQrImage').style.display = 'none';
        document.getElementById('qrOptionsList').style.display = 'block';
        loadUserTransactions(); // ट्रांजैक्शन लिस्ट अपडेट करें
    } catch (error) {
        console.error('QR Pay submission error:', error);
        showMessage('error', 'Failed to submit QR payment request.');
    }
});

// --- Transactions Logic ---
async function loadUserTransactions() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [
                Query.equal('userId', currentUserId), // केवल इस यूज़र की ट्रांजैक्शन
                Query.orderDesc('$createdAt') // लेटेस्ट पहले
            ]
        );

        const tableBody = document.getElementById('userTransactionsTableBody');
        tableBody.innerHTML = ''; // पुराना डेटा क्लियर करें

        if (response.documents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No transactions found.</td></tr>';
            return;
        }

        response.documents.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.transactionType}</td>
                <td>₹${transaction.amount.toFixed(2)}</td>
                <td>${transaction.payeeName || '-'}</td>
                <td>${transaction.transactionRefId || '-'}</td>
                <td>${transaction.status}</td>
                <td>${new Date(transaction.$createdAt).toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading user transactions:', error);
        showMessage('error', 'Failed to load transactions.');
    }
}