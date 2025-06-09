// client/js/adminPanel.js

// Appwrite सेवाओं को ग्लोबल स्कोप से एक्सेस करें (window ऑब्जेक्ट के माध्यम से)
const account = window.appwriteAccount;
const databases = window.appwriteDatabases;
const storage = window.appwriteStorage;
const functions = window.appwriteFunctions;
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
const isValidEmail = window.isValidEmail;
const isValidPassword = window.isValidPassword;
const showComingSoon = window.showComingSoon;

let currentAdminUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // सुनिश्चित करें कि यूज़र लॉग इन है और उसकी भूमिका 'admin' है
    try {
        const currentUser = await account.get();
        currentAdminUserId = currentUser.$id;

        const userProfile = (await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('userId', currentAdminUserId)]
        )).documents[0];

        if (!userProfile || userProfile.role !== 'admin') {
            alert('Access Denied. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        }

        // Welcome टेक्स्ट अपडेट करें
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Welcome, ${userProfile.name} To Quick-Quids - Admin Panel`;
        }

        // साइडबार नेविगेशन हैंडल करें
        setupAdminSidebarNavigation();

        // यूज़र लिस्ट लोड करें
        loadUsersList();

        // QR Pay कलेक्शन लोड करें
        loadQrPayCollection();

    } catch (error) {
        console.error('Admin Panel Initialization error:', error);
        alert('Please login to access the admin panel.');
        window.location.href = 'index.html';
    }
});

function setupAdminSidebarNavigation() {
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
                // 'Coming Soon' फीचर्स के लिए
                if (link.id === 'impsCollectionLink' || link.id === 'neftCollectionLink' || link.id === 'creditCardBillRequestLink') {
                    showComingSoon();
                }
                targetSection.classList.add('active');
            }
        });
    });
}

// --- Set-Up QR Logic ---
document.getElementById('qrImage').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('qrImagePreview').src = e.target.result;
            document.getElementById('qrImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('qrImagePreview').src = '';
        document.getElementById('qrImagePreview').style.display = 'none';
    }
});

document.getElementById('qrSetupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const qrTitle = document.getElementById('qrTitle').value;
    const qrDescription = document.getElementById('qrDescription').value;
    const qrAmount = parseFloat(document.getElementById('qrAmount').value) || 0; // 0 if empty or not a number
    const isCustomAmountAllowed = document.getElementById('isCustomAmountAllowed').checked;
    const qrImageFile = document.getElementById('qrImage').files[0];

    if (!qrTitle || !qrImageFile) {
        showMessage('error', 'QR Title and Image are required.');
        return;
    }

    try {
        // 1. QR इमेज को Appwrite Storage में अपलोड करें
        const uploadedFile = await storage.createFile(
            'qr_images', // आपकी 'qr_images' बकेट ID (सुनिश्चित करें कि यह बकेट बनाई गई है)
            ID.unique(),
            qrImageFile
        );
        console.log('QR Image uploaded:', uploadedFile);

        // 2. QR डेटा को 'qrs' कलेक्शन में सेव करें
        await databases.createDocument(
            DATABASE_ID,
            QRS_COLLECTION_ID,
            ID.unique(),
            {
                qrImageFileId: uploadedFile.$id,
                title: qrTitle,
                description: qrDescription,
                amount: qrAmount,
                isCustomAmountAllowed: isCustomAmountAllowed,
                isActive: true // डिफ़ॉल्ट रूप से एक्टिव
            },
            [
                Permission.read(Role.label('admin')),
                Permission.read(Role.label('user')), // यूज़र्स को QR देखने के लिए
                Permission.create(Role.label('admin'))
            ]
        );
        showMessage('success', 'QR setup and uploaded successfully!');
        document.getElementById('qrSetupForm').reset();
        document.getElementById('qrImagePreview').style.display = 'none';
    } catch (error) {
        console.error('QR Setup error:', error);
        showMessage('error', 'Failed to set up QR: ' + (error.message || 'Unknown error.'));
    }
});

// --- Create Retailer Logic ---
document.getElementById('createRetailerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('retailerName').value;
    const email = document.getElementById('retailerEmail').value;
    const password = document.getElementById('retailerPassword').value;
    const phoneNumber = document.getElementById('retailerPhoneNumber').value;
    const address = document.getElementById('retailerAddress').value;
    const state = document.getElementById('retailerState').value;
    const city = document.getElementById('retailerCity').value;

    if (!name || !email || !password || !phoneNumber || !address || !state || !city) {
        showMessage('error', 'All fields are required.');
        return;
    }
    if (!isValidEmail(email)) {
        showMessage('error', 'Please enter a valid email address.');
        return;
    }
    if (!isValidPassword(password)) {
        showMessage('error', 'Password must be at least 8 characters long.');
        return;
    }

    showMessage('success', 'Creating retailer, please wait...');

    try {
        // Appwrite Function को कॉल करें
        // सुनिश्चित करें कि YOUR_CREATE_RETAILER_FUNCTION_ID सही है और Function Console में बनाई गई है।
        // इसे Appwrite Console -> Functions -> Your Function Name -> Settings में जाकर ID मिलेगी।
        const execution = await functions.createExecution(
            'YOUR_CREATE_RETAILER_FUNCTION_ID', // <<<<< यहाँ अपने Appwrite Function की ID डालें!
            JSON.stringify({ name, email, password, phoneNumber, address, state, city }),
            false // synchronous execution: false means it will wait for the function to complete
        );

        const responseData = JSON.parse(execution.stdout); // Function का JSON आउटपुट

        if (responseData.success) {
            showMessage('success', responseData.message);
            document.getElementById('createRetailerForm').reset();
            loadUsersList(); // यूज़र लिस्ट को रीलोड करें
        } else {
            showMessage('error', `Error: ${responseData.message} - ${responseData.error}`);
        }

    } catch (error) {
        console.error('Error calling createRetailer function:', error);
        showMessage('error', 'Failed to create retailer. Please ensure function ID is correct and function is deployed.');
    }
});

// --- Users List Logic ---
async function loadUsersList() {
    try {
        // सभी यूज़र्स को fetch करें (एडमिन के पास read परमिशन है)
        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID
            // no queries needed as admin has read access to all users
        );

        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = ''; // पुराना डेटा क्लियर करें

        if (response.documents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
            return;
        }

        response.documents.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phoneNumber}</td>
                <td>${user.role}</td>
                <td>${user.isBlocked ? 'Blocked' : 'Active'}</td>
                <td>
                    ${user.role !== 'admin' ? // एडमिन खुद को ब्लॉक/अनब्लॉक न कर सके
                        `<button class="btn btn-small" onclick="toggleUserBlockStatus('${user.$id}', ${user.isBlocked})">
                            ${user.isBlocked ? 'Unblock' : 'Block'}
                        </button>`
                        : ''
                    }
                    <!-- <button class="btn btn-small" onclick="deleteUser('${user.$id}')" style="background-color: var(--error-red);">Delete</button> -->
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users list:', error);
        showMessage('error', 'Failed to load users list.');
    }
}

async function toggleUserBlockStatus(userId, currentStatus) {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            userId,
            {
                isBlocked: !currentStatus
            }
        );
        showMessage('success', `User ${!currentStatus ? 'blocked' : 'unblocked'} successfully.`);
        loadUsersList(); // लिस्ट रीलोड करें
    } catch (error) {
        console.error('Error toggling user status:', error);
        showMessage('error', 'Failed to change user status.');
    }
}

// --- QR Pay Collection (Admin View) Logic ---
async function loadQrPayCollection() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [
                Query.equal('transactionType', 'qr_pay'),
                Query.equal('status', 'pending'), // केवल पेंडिंग रिक्वेस्ट दिखाएं
                Query.orderDesc('$createdAt')
            ]
        );

        const tableBody = document.getElementById('qrPayRequestsTableBody');
        tableBody.innerHTML = '';

        if (response.documents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No pending QR Pay requests.</td></tr>';
            return;
        }

        for (const transaction of response.documents) {
            // यूज़र की ईमेल प्राप्त करें
            const userProfile = (await databases.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('userId', transaction.userId)]
            )).documents[0];
            const userEmail = userProfile ? userProfile.email : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userEmail}</td>
                <td>₹${transaction.amount.toFixed(2)}</td>
                <td>${transaction.payeeName || '-'}</td>
                <td>${transaction.transactionRefId || '-'}</td>
                <td>${transaction.status}</td>
                                <td>
                    <button class="btn btn-small" onclick="updateQrPayStatus('${transaction.$id}', '${transaction.userId}', ${transaction.amount}, 'completed')">Approve</button>
                    <button class="btn btn-small" onclick="updateQrPayStatus('${transaction.$id}', '${transaction.userId}', ${transaction.amount}, 'rejected')" style="background-color: var(--error-red);">Reject</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

    } catch (error) {
        console.error('Error loading QR Pay collection:', error);
        showMessage('error', 'Failed to load QR Pay collection.');
    }
}

async function updateQrPayStatus(transactionId, userId, amount, newStatus) {
    try {
        // 1. ट्रांजैक्शन का स्टेटस अपडेट करें
        await databases.updateDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transactionId,
            { status: newStatus }
        );

        // 2. यदि अप्रूव हुआ है, तो यूज़र का वॉलेट बैलेंस अपडेट करें
        if (newStatus === 'completed') {
            const userProfile = (await databases.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )).documents[0];

            if (userProfile) {
                const currentBalance = userProfile.walletBalance || 0;
                await databases.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    userProfile.$id, // यूज़र प्रोफाइल डॉक्यूमेंट ID
                    { walletBalance: currentBalance + amount }
                );
                showMessage('success', `Transaction ${newStatus} and user wallet updated.`);
            } else {
                showMessage('warning', `Transaction ${newStatus}, but user profile not found for wallet update.`);
            }
        } else {
            showMessage('success', `Transaction ${newStatus}.`);
        }

        loadQrPayCollection(); // लिस्ट रीलोड करें
        loadUsersList(); // यूज़र लिस्ट भी रीलोड करें ताकि बैलेंस अपडेट दिखे
    } catch (error) {
        console.error('Error updating QR Pay status:', error);
        showMessage('error', 'Failed to update QR Pay status or wallet balance.');
    }
}