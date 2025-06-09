// client/js/appwriteConfig.js

// Appwrite SDK से सीधे Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role इम्पोर्ट करें
// ध्यान दें: /dist/esm/sdk.js ES Modules के लिए है
import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role } from 'https://unpkg.com/appwrite@12.0.0/dist/esm/sdk.js';

const client = new Client();

// अपने Appwrite प्रोजेक्ट की जानकारी यहाँ डालें
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // आपका Appwrite Endpoint
    .setProject('684649ca001e5492b7e5');      // आपका Project ID

// Appwrite की विभिन्न सर्विसेज़ को एक्सपोर्ट करें ताकि अन्य फ़ाइलें उन्हें उपयोग कर सकें
export const appwriteClient = client;
export const appwriteAccount = new Account(client);
export const appwriteDatabases = new Databases(client);
export const appwriteStorage = new Storage(client);
export const appwriteFunctions = new Functions(client);

// Appwrite Collection IDs को एक्सपोर्ट करें
export const DATABASE_ID = '68465dd7001554783aa6';
export const USERS_COLLECTION_ID = '68465de5001f51fb6472';
export const QRS_COLLECTION_ID = '68466238002a5e2cfd41';
export const TRANSACTIONS_COLLECTION_ID = '6846630e000f7ff16ac0';

// Appwrite के सहायक फंक्शंस (जैसे ID, Query, Permission, Role) को भी एक्सपोर्ट करें
export const AppwriteID = ID;
export const AppwriteQuery = Query;
export const AppwritePermission = Permission;
export const AppwriteRole = Role;