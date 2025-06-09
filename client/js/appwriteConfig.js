// client/js/appwriteConfig.js

// Appwrite SDK Client को इनिशियलाइज़ करें
const client = new Appwrite.Client();

// अपने Appwrite प्रोजेक्ट की जानकारी यहाँ डालें
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // आपका Appwrite Endpoint
    .setProject('684649ca001e5492b7e5');      // आपका Project ID

// Appwrite की विभिन्न सर्विसेज़ को एक्सपोर्ट करें ताकि अन्य फ़ाइलें उन्हें उपयोग कर सकें
const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);
const functions = new Appwrite.Functions(client); // Appwrite Functions सर्विस को भी इम्पोर्ट करें

// Appwrite Collection IDs
const DATABASE_ID = '68465dd7001554783aa6';
const USERS_COLLECTION_ID = '68465de5001f51fb6472';
const QRS_COLLECTION_ID = '68466238002a5e2cfd41';
const TRANSACTIONS_COLLECTION_ID = '6846630e000f7ff16ac0';

// इन सभी को ग्लोबल स्कोप में उपलब्ध कराएं
// (ध्यान दें: <script type="module"> का उपयोग करने पर export/import का तरीका अलग होगा,
// लेकिन सामान्य <script> टैग के लिए, इन्हें सीधे ग्लोबल बना सकते हैं या एक ऑब्जेक्ट में रैप कर सकते हैं)
window.appwriteClient = client;
window.appwriteAccount = account;
window.appwriteDatabases = databases;
window.appwriteStorage = storage;
window.appwriteFunctions = functions;
window.APPWRITE_DATABASE_ID = DATABASE_ID;
window.APPWRITE_USERS_COLLECTION_ID = USERS_COLLECTION_ID;
window.APPWRITE_QRS_COLLECTION_ID = QRS_COLLECTION_ID;
window.APPWRITE_TRANSACTIONS_COLLECTION_ID = TRANSACTIONS_COLLECTION_ID;

// Appwrite के सहायक फंक्शंस (जैसे ID, Query, Permission, Role) को भी ग्लोबल करें
window.AppwriteID = Appwrite.ID;
window.AppwriteQuery = Appwrite.Query;
window.AppwritePermission = Appwrite.Permission;
window.AppwriteRole = Appwrite.Role;