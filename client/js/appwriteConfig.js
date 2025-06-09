// client/js/appwriteConfig.js

// Appwrite SDK अब HTML में सीधे <script> टैग से लोड हो रहा है (appwrite.js),
// इसलिए 'Appwrite' ऑब्जेक्ट ग्लोबल स्कोप में उपलब्ध होगा।
// इस फ़ाइल में कोई import/export स्टेटमेंट नहीं होनी चाहिए।

const client = new Appwrite.Client();

// अपने Appwrite प्रोजेक्ट की जानकारी यहाँ डालें
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // आपका Appwrite Endpoint
    .setProject('684649ca001e5492b7e5');      // आपका Project ID

// Appwrite की विभिन्न सर्विसेज़ को 'window' ऑब्जेक्ट पर अटैच करें
// ताकि वे अन्य JavaScript फाइलों में ग्लोबल रूप से उपलब्ध हों।
window.appwriteClient = client;
window.appwriteAccount = new Appwrite.Account(client);
window.appwriteDatabases = new Appwrite.Databases(client);
window.appwriteStorage = new Appwrite.Storage(client);
window.appwriteFunctions = new Appwrite.Functions(client);

// Appwrite Collection IDs को भी 'window' ऑब्जेक्ट पर अटैच करें
window.APPWRITE_DATABASE_ID = '68465dd7001554783aa6';
window.APPWRITE_USERS_COLLECTION_ID = '68465de5001f51fb6472';
window.APPWRITE_QRS_COLLECTION_ID = '68466238002a5e2cfd41';
window.APPWRITE_TRANSACTIONS_COLLECTION_ID = '6846630e000f7ff16ac0';

// Appwrite के सहायक फंक्शंस (जैसे ID, Query, Permission, Role) को भी 'window' पर अटैच करें
window.AppwriteID = Appwrite.ID;
window.AppwriteQuery = Appwrite.Query;
window.AppwritePermission = Appwrite.Permission;
window.AppwriteRole = Appwrite.Role;