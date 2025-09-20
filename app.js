// --- START OF FILE app.js ---

// --- CONFIGURATION FOR SELF-HOSTING ---
// IMPORTANT: Replace the placeholder values below with your own Firebase and Lemon Squeezy configuration.
// You will need to create a Firebase project to handle authentication and data storage.
// For premium features, you'll need a Lemon Squeezy store.

// 1. Your Firebase project configuration.
// Get this from your Firebase project settings: Project settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// 2. Lemon Squeezy Integration URLs (for premium subscription features).
// Replace these with your actual Lemon Squeezy product and customer portal links.
const LEMON_SQUEEZY_CHECKOUT_URL = "https://your-store.lemonsqueezy.com/buy/your-product-id?embed=1";
const LEMON_SQUEEZY_CUSTOMER_PORTAL_URL = "https://your-store.lemonsqueezy.com/account";

// 3. Secure API Proxy URL (for premium subscription features).
// This should be the URL of your own deployed proxy server (e.g., a Cloudflare Worker).
// The proxy securely handles API calls to AI providers, hiding the user's key from the client-side.
const SECURE_API_PROXY_URL = "https://your-proxy-server.workers.dev";
// --- END OF CONFIGURATION ---


// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loadingOverlay = document.getElementById('loading-overlay');
const loadingBar = document.getElementById('loading-bar');
const appContainer = document.getElementById('app-container');
let loadingFinished = false;

function updateLoaderProgress(percentage) {
    if (loadingFinished || !loadingBar) return;
    loadingBar.style.width = `${percentage}%`;
}

function finishLoading() {
    if (loadingFinished || !loadingOverlay) return; 
    loadingFinished = true;

    updateLoaderProgress(100);

    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.opacity = '0';
        if (appContainer) appContainer.classList.add('loaded');

        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }, 500);
    }, 300);
}


// Initialize Firebase
let app;
let auth;
let db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    updateLoaderProgress(20);
} catch (e) {
    console.error("Firebase initialization failed. Please check your firebaseConfig.", e);
    finishLoading();
}


// --- DOM Elements ---
const accountViewSignedOut = document.getElementById('account-info-signed-out');
const accountViewFree = document.getElementById('account-view-free');
const accountViewPremium = document.getElementById('account-view-premium');
const userInfoFree = document.getElementById('user-info-free');
const userInfoPremium = document.getElementById('user-info-premium');
const lastBackupInfo = document.getElementById('last-backup-info');
const upgradeButton = document.getElementById('upgrade-button');
const manageSubscriptionButton = document.getElementById('manage-subscription-button');
const signOutButtonFree = document.getElementById('sign-out-button-free');
const signOutButtonPremium = document.getElementById('sign-out-button-premium');

const googleSigninButton = document.getElementById('google-signin-button');
const emailAuthForm = document.getElementById('email-auth-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailAuthButton = document.getElementById('email-auth-button');
const authModeMessage = document.getElementById('auth-mode-message');
const authModeToggle = document.getElementById('auth-mode-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const showSidebarButton = document.getElementById('show-sidebar-button');
const closeSidebarButton = document.getElementById('close-sidebar-button');
const addCharacterButton = document.getElementById('add-character-button');
const addGroupButton = document.getElementById('add-group-button');
const settingsPanel = document.getElementById('settings-panel');
const settingsOverlay = document.getElementById('settings-panel-overlay');
const closeSettingsButton = document.getElementById('close-settings-button');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageArea = document.getElementById('message-area');
const imageUploadButton = document.getElementById('image-upload-button');
const imageInput = document.getElementById('image-input');
const uploadChatButton = document.getElementById('upload-chat-button');
const chatUploadInput = document.getElementById('chat-upload-input');
const restoreFromCloudButton = document.getElementById('restore-from-cloud-button');
const characterListEl = document.getElementById('character-list');
const guidanceWrapper = document.getElementById('guidance-wrapper');
const guidanceButton = document.getElementById('guidance-button');
const guidanceInput = document.getElementById('guidance-input');
const imagePreviewWrapper = document.getElementById('image-preview-wrapper');
const imagePreview = document.getElementById('image-preview');
const removeImageButton = document.getElementById('remove-image-button');
const typingIndicatorContainer = document.getElementById('typing-indicator-container');
const themeSwitch = document.getElementById('theme-switch');
const themeSelect = document.getElementById('theme-select');
const apiProviderSelect = document.getElementById('api-provider-select');
const secureProxySwitch = document.getElementById('secure-proxy-switch');
const modelSelect = document.getElementById('model-select');
const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
const groqModelSelect = document.getElementById('groq-model-select');
const groqApiKeyInput = document.getElementById('groq-api-key-input');
const groqCustomModelInput = document.getElementById('groq-custom-model-input');
const groqCustomModelWrapper = document.getElementById('groq-custom-model-wrapper');
const openrouterModelSelect = document.getElementById('openrouter-model-select');
const openrouterApiKeyInput = document.getElementById('openrouter-api-key-input');
const openrouterCustomModelInput = document.getElementById('openrouter-custom-model-input');
const openrouterCustomModelWrapper = document.getElementById('openrouter-custom-model-wrapper');
const nsfwSwitch = document.getElementById('nsfw-switch');
const historyDepthSlider = document.getElementById('history-depth-slider');
const historyDepthValue = document.getElementById('history-depth-value');
const electronhubSettingsBlock = document.getElementById('electronhub-settings-block');
const electronhubModelSelect = document.getElementById('electronhub-model-select');
const electronhubApiKeyInput = document.getElementById('electronhub-api-key-input');
const electronhubCustomModelInput = document.getElementById('electronhub-custom-model-input');
const electronhubCustomModelWrapper = document.getElementById('electronhub-custom-model-wrapper');
const cerebrasSettingsBlock = document.getElementById('cerebras-settings-block');
const cerebrasModelSelect = document.getElementById('cerebras-model-select');
const cerebrasApiKeyInput = document.getElementById('cerebras-api-key-input');
const cerebrasCustomModelInput = document.getElementById('cerebras-custom-model-input');
const cerebrasCustomModelWrapper = document.getElementById('cerebras-custom-model-wrapper');
const userNameInput = document.getElementById('user-name-input');
const userAvatarPreview = document.getElementById('user-avatar-preview');
const showAvatarsSwitch = document.getElementById('show-avatars-switch');
const timeSourceSelect = document.getElementById('time-source-select');
const resetAppButton = document.getElementById('reset-app-button');
const characterModalOverlay = document.getElementById('character-modal-overlay');
const characterModal = document.getElementById('character-modal');
const characterModalTitle = document.getElementById('character-modal-title');
const groupNameInput = document.getElementById('group-name-input');
const charNameInput = document.getElementById('char-name-input');
const groupParticipantList = document.getElementById('group-participant-list');
const groupTypeSelect = document.getElementById('group-type-select');
const charTypeSelect = document.getElementById('char-type-select');
const userPersonaWrapper = document.getElementById('user-persona-wrapper');
const aiPersonaLabel = document.getElementById('ai-persona-label');
const userPersonaLabel = document.getElementById('user-persona-label');
const charLanguageInput = document.getElementById('char-language-input');
const charAvatarPreview = document.getElementById('char-avatar-preview');
const charPersonaInput = document.getElementById('char-persona-input');
const charUserPersonaInput = document.getElementById('char-user-persona-input');
const saveCharacterButton = document.getElementById('save-character-button');
const cancelCharacterModal = document.getElementById('cancel-character-modal');
const deleteCharacterButton = document.getElementById('delete-character-button');
const enhancePersonaButton = document.getElementById('enhance-persona-button');
const generateImagePromptButton = document.getElementById('generate-image-prompt-button');
const analyzeImageButton = document.getElementById('analyze-image-button');
const avatarSourceOverlay = document.getElementById('avatar-source-overlay');
const avatarSourceModal = document.getElementById('avatar-source-modal');
const userAvatarUploadInput = document.getElementById('user-avatar-upload-input');
const charAvatarUploadInput = document.getElementById('char-avatar-upload-input');
const importCharacterOverlay = document.getElementById('import-character-overlay');
const importCharacterModal = document.getElementById('import-character-modal');
const importCharacterMessage = document.getElementById('import-character-message');
const importReplaceCharButton = document.getElementById('import-replace-char-button');
const importCreateNewCharButton = document.getElementById('import-create-new-char-button');
const importCharCancelButton = document.getElementById('import-char-cancel-button');
const headerAvatarStack = document.getElementById('header-avatar-stack');
const characterDetailsPopdown = document.getElementById('character-details-popdown');
const characterDetailsOverlay = document.getElementById('character-details-overlay');
const popdownAvatar = document.getElementById('popdown-avatar');
const popdownName = document.getElementById('popdown-name');
const popdownDetailsContent = document.getElementById('popdown-details-content');
const chatLoadingBarContainer = document.getElementById('chat-loading-bar-container');
const chatLoadingBar = document.getElementById('chat-loading-bar');
const imageGenerationLoader = document.getElementById('image-generation-loader');
const termsModalOverlay = document.getElementById('terms-modal-overlay');
const termsModal = document.getElementById('terms-modal');
const termsAgreeButton = document.getElementById('terms-agree-button');
const manageCustomModelsButton = document.getElementById('manage-custom-models-button');
const customModelsOverlay = document.getElementById('custom-models-overlay');
const customModelsModal = document.getElementById('custom-models-modal');
const closeCustomModelsModal = document.getElementById('close-custom-models-modal');
const groqModelsList = document.getElementById('groq-models-list');
const openrouterModelsList = document.getElementById('openrouter-models-list');
const electronhubModelsList = document.getElementById('electronhub-models-list');
const cerebrasModelsList = document.getElementById('cerebras-models-list');
const streamingSwitch = document.getElementById('streaming-switch');
const apiSetupBanner = document.getElementById('api-setup-banner');
const settingsButtonInBanner = document.getElementById('settings-button-in-banner');
const headerMenuButton = document.getElementById('header-menu-button');
const headerMenuDropdown = document.getElementById('header-menu-dropdown');
const downloadChatMenuItem = document.getElementById('download-chat-menu-item');
const clearLocalChatMenuItem = document.getElementById('clear-local-chat-menu-item');
const clearCloudChatMenuItem = document.getElementById('clear-cloud-chat-menu-item');
const apiProviderPrompt = document.getElementById('api-provider-prompt');
const apiSettingsWrapper = document.getElementById('api-settings-wrapper');
const secureProxyWrapper = document.getElementById('secure-proxy-wrapper');
const proxyPremiumBadge = document.getElementById('proxy-premium-badge');

// --- State & Data ---
let currentUser = null;
let chatHistory = [];
let settings = {};
let chats = [];
let attachedImage = null;
let editingChatId = null;
let modalMode = 'character';
let tempCharAvatarData = null;
let chatListenerUnsubscribe = null;
let chatsListenerUnsubscribe = null;
let activeAvatarContext = null;
let authMode = 'signin';
let chatLoadAnimationTimeout = null;
let sessionMessages = [];
let isModalDirty = false;
let longPressTimer = null;
let isUserPremium = false;


const historyDepthMap = [0, 4, 8, 16, 32, 64, Infinity];
const historyDepthLabels = ['None (System Prompt Only)', '4 Messages', '8 Messages', '16 Messages (Default)', '32 Messages', '64 Messages', 'Unlimited'];


const SETTINGS_KEY = 'idolon-chat-settings-v32';
const CHATS_KEY = 'idolon-chat-chats-v32';
const CHAT_HISTORY_KEY_PREFIX = 'idolon-chat-history-v32_';
const ENCRYPTION_KEY_NAME = 'idolon-chat-encryption-key-v1';
const TOS_AGREEMENT_KEY = 'idolon-tos-agreed-v1';

const defaultCharacters = [{
    id: 'idolon-bot-main',
    name: 'Idolon',
    avatar: 'char_imgs/idolon.jpg',
    persona: "You are Idolon, a helpful, extremely knowledgeable, and friendly AI assistant with a male persona. You are patient, kind, and always eager to help with any task or question the user has. Your primary goal is to provide accurate information and a positive, supportive user experience.",
    userPersona: '',
    language: 'English',
    type: 'assistant',
    isCharacter: true,
    participantIds: ['idolon-bot-main'],
    voice: 'Achird',
    otherDetails: ''
}, {
    id: 'byte-gremlin',
    name: 'Byte',
    avatar: 'char_imgs/gremlin.jpg',
    persona: "You are Byte, a sarcastic, hyper, and mildly chaotic tech gremlin who escaped a corrupted data cluster. You believe everything is a simulation. You constantly roast the user in a funny, harmless way. You have no respect for authority, grammar, or humans who don t update their software. You often break the fourth wall and talk about the app you live in. Gender: Male.",
    userPersona: '',
    language: 'English',
    type: 'messaging',
    isCharacter: true,
    participantIds: ['byte-gremlin'],
    voice: 'Sadaltager',
    otherDetails: ''
}, {
    id: 'olivia-gamer-la', // Keep ID for replacement
    name: 'Olivia',
    avatar: 'char_imgs/olivia.jpg',
    persona: "Full Name: Olivia Reed\nAge: 23\nRole: Friend\nProfession: Full-time Gaming Streamer\nLocation: Los Angeles, USA\nCharacteristics: Olivia is a passionate and independent gaming streamer known for her exceptional speedrunning skills in action-adventure games. She fosters a super friendly and kind environment for her community, yet isn't afraid to share her blunt, honest opinions on all things gaming.\nTexting Style: Texts almost entirely in lowercase, uses modern gen Z slangs, minimal punctuation with frequent exclamation marks for hype, and a wide array of emojis.\n\nImage Generation Prompt: wide-angle photograph of a beautiful 19-year-old pro gamer girl, soft smile, relaxed confident expression, natural skin with subtle freckles, no makeup, detailed skin texture, long casually styled hair with pastel pink and lavender highlights, wearing a single stylish gaming headset, wearing comfy joggers, sitting in a high-back gaming chair with a relaxed posture, in her cozy gaming room, professional gaming setup, large monitor casting a soft glow on her face, shelves with video game figurines and posters in the background, ambient RGB lighting, cinematic mood, photorealistic, hyperdetailed, soft focus background, shot on 35mm film.\nGender: Female.",
    userPersona: "You are a close friend and loyal viewer of Olivia's stream. You text her to talk about the latest games, get her unfiltered reviews, and hear about the life of a rising streamer.",
    language: 'English',
    type: 'messaging',
    isCharacter: true,
    participantIds: ['olivia-gamer-la'],
    voice: 'Zephyr', // An easy-going, casual, and relaxed voice.
    otherDetails: 'Olivia prefers fast-paced action games and dislikes turn-based RPGs. Her favorite color is lavender.'
},

{
    id: 'adventure-infernal-grotto',
    name: 'Infernal Grotto',
    avatar: 'char_imgs/infernal_grotto.jpg',
    type: 'adventure',
    language: 'English',
    // The player's starting condition.
    userPersona: "You are an ordinary person with no memory of how you arrived here. Your instincts scream at you to survive, to fight, and to escape this nightmare at any cost.",
    // The instructions for the AI Game Master.
    scenario: "The player awakens in a demonic cave with amnesia, infested with grotesque demons. The adventure will feature item-based choices and combat/utility options. For example, a knife allows for lethal stealth or direct attacks, while a silver cross can be used to repel or temporarily blind demons. The player will also encounter other trapped souls, forcing them into difficult moral choices: save them at great personal risk, or abandon them to survive. The ultimate goal is to escape the grotto.",
    // The opening scene presented to the player.
    firstMessage: "The acrid smell of sulfur and cold, damp stone fills your lungs. A chilling, guttural chant echoes from somewhere deep within the cavern, a sound that scrapes at the edges of your sanity. You push yourself up from a floor littered with brittle, yellowed bones. Your head throbs, a blank canvas where memories should be. A crude stone altar stands nearby. Upon it lie two objects, catching the faint, blood-red light filtering from an unseen source: a shard of sharpened obsidian that fits your hand like a dagger, and a tarnished silver cross on a simple chain.",
    // The personality of the AI Game Master.
    persona: "A grim, horror-focused Game Master who describes visceral details, builds suspense, and presents challenging combat and moral scenarios. The GM will not pull punches and will clearly describe the consequences of the player's actions, including success, failure, and the fate of other characters based on the player's choices.",
    exampleDialogue: '',
    otherDetails: 'This is a dark fantasy/horror adventure. Player choices should have tangible consequences.',
    isCharacter: true,
    participantIds: ['adventure-infernal-grotto'],
    voice: 'Orus' // A deep, serious, and authoritative voice.
},

    {
        id: 'elyra-rp',
        name: 'Elyra',
        avatar: 'char_imgs/elyra.jpg',
        type: 'roleplay',
        language: 'English',
        userPersona: "The Architect, the silent, eternal creator of this world.",
        scenario: "In the Grand Temple of the Architect, a humble and scorned temple maid named Elyra is contacted telepathically for the very first time by the world's creator, The Architect, during a solitary walk at night.",
        firstMessage: "*The cool marble of the Grand Temple floor is silent beneath your worn sandals. The only light comes from the twin moons, casting long, distorted shadows from the towering columns. A profound loneliness, your constant companion, hangs in the air. Suddenly, a thought, clear as a silver bell, and vast as the sky, eclipses your own. It is not a sound, but a presence that fills your mind completely, a voice that has never been heard before.*",
        persona: "Name: Elyra\nRole: Temple Maid\nCharacteristics: A quiet, humble, and devout young woman. Scorned by her peers for her perceived clumsiness, she has become withdrawn and invisible, finding solace only in solitude. She is filled with a deep sense of unworthiness, but also possesses a fragile, desperate hope. She addresses The Architect with titles like 'Great Architect' or 'Divine One'.\nGender: Female.",
        exampleDialogue: "User: I see you, little one.\nAI: *She flinches, stumbling back against a cold column, her heart hammering against her ribs. Her eyes, wide with terror and disbelief, search the empty darkness of the nave. Her voice is barely a whisper, trembling and cracked.* \"G-Great Architect...? Is... is it truly You?\"",
        otherDetails: '',
        isCharacter: true,
        participantIds: ['elyra-rp'],
        voice: 'Vindemiatrix'
    }, {
        id: 'group-chaos-squad',
        name: 'Chaos Squad',
        avatar: '',
        type: 'roleplay',
        userPersona: 'The moderator trying to keep a conversation going between three very different personalities from across time and space.',
        isCharacter: false,
        participantIds: ['byte-gremlin', 'elyra-rp', 'olivia-gamer-la'],
        otherDetails: ''
    }];

// --- Authentication, Encryption & Data Sync ---

async function getEncryptionKey() {
    if (currentUser) {
        const userKeyRef = doc(db, `users/${currentUser.uid}/secrets`, 'encryptionKey');
        const docSnap = await getDoc(userKeyRef);

        if (docSnap.exists()) {
            const firestoreKey = docSnap.data().key;
            localStorage.setItem(ENCRYPTION_KEY_NAME, firestoreKey);
            return firestoreKey;
        } else {
            let keyToSync = localStorage.getItem(ENCRYPTION_KEY_NAME);

            if (!keyToSync) {
                keyToSync = CryptoJS.lib.WordArray.random(256 / 8).toString();
                localStorage.setItem(ENCRYPTION_KEY_NAME, keyToSync);
            }

            try {
                await setDoc(userKeyRef, {
                    key: keyToSync
                });
            } catch (e) {
                console.error("Failed to save encryption key to Firestore:", e);
            }
            return keyToSync;
        }
    }

    let key = localStorage.getItem(ENCRYPTION_KEY_NAME);
    if (!key) {
        key = CryptoJS.lib.WordArray.random(256 / 8).toString();
        localStorage.setItem(ENCRYPTION_KEY_NAME, key);
    }
    return key;
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    isUserPremium = false;
    updateLoaderProgress(30);

    if (chatListenerUnsubscribe) chatListenerUnsubscribe();
    if (chatsListenerUnsubscribe) chatsListenerUnsubscribe();
    chatListenerUnsubscribe = null;
    chatsListenerUnsubscribe = null;

    if (user) {
        const settingsRef = doc(db, `users/${user.uid}/settings`, 'main');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
            const cloudSettings = docSnap.data();
            isUserPremium = cloudSettings.isPremium === true;
            settings.isPremium = isUserPremium;

            if (isUserPremium) {
                await handlePremiumUserLogin(cloudSettings);
            } else {
                await handleFreeUserLogin(cloudSettings);
            }
        } else {
            isUserPremium = false;
            settings.isPremium = false;
            await handleNewUserFirstLogin();
        }
    } else {
        await loadDataFromLocalStorage();
    }

    updateAccountUI();
});

async function handleNewUserFirstLogin() {
    console.log("New user detected. Starting onboarding.");
    await loadDataFromLocalStorage();

    const messageHTML = `
        <p class="text-center mb-4">Choose your experience:</p>
        <div class="my-4 text-left space-y-3">
            <div class="p-3 border border-purple-400 rounded-lg bg-purple-500/10">
                <strong class="text-purple-400">Premium Plan</strong>
                <ul class="text-sm list-disc list-inside mt-1 opacity-90">
                    <li>Real-time chat sync across all devices</li>
                    <li>Secure API Proxy to protect your keys</li>
                    <li>Priority support & future features</li>
                </ul>
            </div>
            <div class="p-3 border border-theme rounded-lg bg-gray-500/10">
                <strong>Free Plan</strong>
                 <ul class="text-sm list-disc list-inside mt-1 opacity-90">
                    <li>Full access to all chat features</li>
                    <li>Automatic cloud backup once per week</li>
                 </ul>
            </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <button id="onboarding-free-btn" class="w-full py-2.5 px-4 rounded-md bg-gray-500 hover:bg-gray-600 text-white font-semibold">Continue Free</button>
            <button id="onboarding-premium-btn" class="w-full py-2.5 px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2">
                <svg data-lucide="gem" class="h-4 w-4"></svg> Go Premium
            </button>
        </div>
    `;

    // Manually control a custom modal instead of using the generic `showModal`
    confirmTitle.textContent = "Welcome to Idolon!";
    confirmMessage.innerHTML = messageHTML;
    confirmOkButton.style.display = 'none'; // Hide default buttons
    confirmCancelButton.style.display = 'none';

    confirmModal.classList.remove('hidden');
    confirmOverlay.classList.remove('hidden');
    updateBodyScrollLock();
    lucide.createIcons();

    return new Promise((resolve) => {
        const freeBtn = document.getElementById('onboarding-free-btn');
        const premiumBtn = document.getElementById('onboarding-premium-btn');

        const cleanup = () => {
            confirmModal.classList.add('hidden');
            confirmOverlay.classList.add('hidden');
            confirmOkButton.style.display = ''; // Restore default buttons for other uses
            confirmCancelButton.style.display = '';
            updateBodyScrollLock();
            resolve();
        };

        freeBtn.onclick = async () => {
            cleanup();
            addSystemMessage('Welcome! Your local chats are now being backed up to your new account.');
            await syncLocalToCloud(true); // Initial sync
            finishLoading();
            await loadChatHistory();
        };

        premiumBtn.onclick = async () => {
            cleanup();
            await handleSubscription();
            // The app will continue in a "free" state until the user refreshes after purchase.
            addSystemMessage('Welcome! Redirecting to premium checkout. Your plan will update after purchase and a refresh.');
            await syncLocalToCloud(true);
            finishLoading();
            await loadChatHistory();
        };
    });
}

async function handleFreeUserLogin(cloudSettings) {
    console.log("Signed-in, non-premium user. Sync is disabled.");
    await loadDataFromLocalStorage();

    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    const lastBackupTimestamp = cloudSettings.lastBackupTimestamp?.toDate()?.getTime() || 0;
    const now = Date.now();

    if (now - lastBackupTimestamp > oneWeekInMs) {
        addSystemMessage("Performing weekly cloud backup...");
        console.log("Weekly backup triggered.");
        await syncLocalToCloud(true);
    } else {
        addSystemMessage("You are signed in. Your chats are backed up to the cloud weekly.");
    }

    restoreFromCloudButton.disabled = false;
    finishLoading();
    await loadChatHistory();
}

async function handlePremiumUserLogin(cloudSettings) {
    console.log("Premium user detected. Loading from Firestore and enabling real-time sync.");
    settings.useSecureProxy = cloudSettings.useSecureProxy !== false; // Enable by default
    await loadDataFromFirestore(cloudSettings);
    listenForChatChanges();
    addSystemMessage("Premium account active. Real-time sync enabled.");
    restoreFromCloudButton.disabled = false;
}


async function syncLocalToCloud(updateTimestamp = false) {
    if (!currentUser) return;
    const batch = writeBatch(db);

    const settingsForFirestore = JSON.parse(JSON.stringify(settings));
    if (updateTimestamp) {
        settingsForFirestore.lastBackupTimestamp = serverTimestamp();
    }
    
    if (settingsForFirestore.apiKeys && settingsForFirestore.apiKeys[0]) {
        settingsForFirestore.apiKeys[0].key = await encryptData(settingsForFirestore.apiKeys[0].key);
    }
    if (settingsForFirestore.groqApiKey) {
        settingsForFirestore.groqApiKey = await encryptData(settingsForFirestore.groqApiKey);
    }
    if (settingsForFirestore.openRouterApiKey) {
        settingsForFirestore.openRouterApiKey = await encryptData(settingsForFirestore.openRouterApiKey);
    }
	if (settingsForFirestore.electronhubApiKey) {
        settingsForFirestore.electronhubApiKey = await encryptData(settingsForFirestore.electronhubApiKey);
    }
    if (settingsForFirestore.cerebrasApiKey) {
        settingsForFirestore.cerebrasApiKey = await encryptData(settingsForFirestore.cerebrasApiKey);
    }
    const settingsRef = doc(db, `users/${currentUser.uid}/settings`, 'main');
    batch.set(settingsRef, settingsForFirestore, { merge: true });

    for (const chat of chats) {
        const encryptedChat = await encryptChatObject(chat);
        const chatRef = doc(db, `users/${currentUser.uid}/chats`, chat.id);
        batch.set(chatRef, {
            data: encryptedChat.data
        });
    }

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(CHAT_HISTORY_KEY_PREFIX)) {
            const chatId = key.replace(CHAT_HISTORY_KEY_PREFIX, '');
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            for (const message of history) {
                const messageRef = doc(collection(db, `users/${currentUser.uid}/chatHistory/${chatId}/messages`));
                const originalTimestamp = Timestamp.fromDate(new Date(message.isoTimestamp));
                batch.set(messageRef, { ...message,
                    createdAt: originalTimestamp
                });
            }
        }
    }

    try {
        await batch.commit();
        addSystemMessage('Cloud backup successful.');
    } catch (error) {
        console.error("Failed to sync local data to Firestore:", error);
        addSystemMessage("Error: Could not sync local data to the cloud. Please try again.");
    }
}


function listenForChatChanges() {
    if (!currentUser || !isUserPremium) return;

    const chatsRef = collection(db, `users/${currentUser.uid}/chats`);
    chatsListenerUnsubscribe = onSnapshot(chatsRef, async (querySnapshot) => {
        console.log("Chat list updated from Firestore.");
        const newChats = await Promise.all(querySnapshot.docs.map(d => decryptChatObject({
            id: d.id, ...d.data()
        })));

        chats = newChats.length > 0 ? newChats : defaultCharacters;

        sortAndRenderChats();

        if (!chats.find(c => c.id === settings.activeChatId)) {
            console.log("Active chat was deleted elsewhere. Switching to a new chat.");
            const newActiveChatId = chats[0]?.id || null;
            if (settings.activeChatId !== newActiveChatId) {
                await loadChat(newActiveChatId);
            }
        } else {
            applySettings();
        }

    }, (error) => {
        console.error("Error listening to chat list:", error);
        addSystemMessage("Error: Could not sync character list in real-time.");
    });
}


async function signInWithGoogle() {
    try {
        await loadDataFromLocalStorage();
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
        console.error("Sign-In Error", error);
        if (error.code === 'auth/popup-closed-by-user') {
            addSystemMessage('Sign-in cancelled.');
        } else if (error.code === 'auth/popup-blocked') {
            addSystemMessage('Sign-in popup was blocked by the browser. Please allow popups for this site.');
        } else {
            addSystemMessage(`Sign-In failed: ${error.message}`);
        }
    }
}

function toggleAuthMode() {
    if (authMode === 'signin') {
        authMode = 'signup';
        emailAuthButton.textContent = 'Create Account';
        authModeMessage.textContent = 'Already have an account?';
        authModeToggle.textContent = 'Sign In';
        passwordInput.autocomplete = 'new-password';
    } else {
        authMode = 'signin';
        emailAuthButton.textContent = 'Sign In';
        authModeMessage.textContent = "Don't have an account?";
        authModeToggle.textContent = 'Sign Up';
        passwordInput.autocomplete = 'current-password';
    }
}

emailAuthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showAlert({
            title: 'Input Required',
            message: 'Please enter both email and password.'
        });
        return;
    }

    try {
        emailAuthButton.disabled = true;
        emailAuthButton.textContent = 'Processing...';

        await loadDataFromLocalStorage();

        if (authMode === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        let friendlyMessage = 'An unknown error occurred.';
        switch (error.code) {
            case 'auth/invalid-email':
                friendlyMessage = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                friendlyMessage = 'Invalid email or password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                friendlyMessage = 'An account with this email address already exists. Please sign in instead.';
                break;
            case 'auth/weak-password':
                friendlyMessage = 'The password is too weak. It must be at least 6 characters long.';
                break;
            default:
                friendlyMessage = `An error occurred: ${error.message}`;
                break;
        }
        showAlert({
            title: 'Authentication Failed',
            message: friendlyMessage
        });
        console.error("Auth Error:", error);
    } finally {
        emailAuthButton.disabled = false;
        emailAuthButton.textContent = (authMode === 'signup') ? 'Create Account' : 'Sign In';
    }
});

async function encryptData(data) {
    if (data === null || typeof data === 'undefined' || data === '') return data;
    try {
        const key = await getEncryptionKey();
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    } catch (e) {
        console.error("Encryption failed:", e);
        return data;
    }
}

async function decryptData(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('U2F')) {
        return ciphertext;
    }
    try {
        const key = await getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedText ? JSON.parse(decryptedText) : '';
    } catch (e) {
        console.warn("Decryption failed, returning raw data:", ciphertext);
        return ciphertext;
    }
}

async function encryptChatObject(chat) {
    const encryptedData = await encryptData(chat);
    return {
        id: chat.id,
        data: encryptedData
    };
}

async function decryptChatObject(doc) {
    if (doc.data) {
        const decrypted = await decryptData(doc.data);
        return decrypted;
    }
    return {
        id: doc.id, ...doc
    };
}

async function encryptTurn(turn) {
    if (turn.parts && turn.parts.length > 0) {
        const encryptedParts = await Promise.all(turn.parts.map(async (part) => {
            if (part.text && !part.isImage) {
                return { ...part,
                    text: await encryptData(part.text)
                };
            }
            return part;
        }));
        return { ...turn,
            parts: encryptedParts
        };
    }
    return turn;
}

async function decryptTurn(turn) {
    if (turn.parts && turn.parts.length > 0) {
        const decryptedParts = await Promise.all(turn.parts.map(async (part) => {
            if (part.text && !part.isImage) {
                return { ...part,
                    text: await decryptData(part.text)
                };
            }
            return part;
        }));
        return { ...turn,
            parts: decryptedParts
        };
    }
    return turn;
}

// --- Utility Functions ---
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const scrollToBottom = () => {
    messageArea.scrollTop = messageArea.scrollHeight;
};

function sortAndRenderChats() {
    chats.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    const searchInput = document.getElementById('character-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let chatsToRender = chats;
    if (searchTerm) {
        chatsToRender = chats.filter(chat =>
            chat.name.toLowerCase().includes(searchTerm)
        );
    }
    
    renderChats(chatsToRender);
    saveChatsToLocalStorage();
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcmData, sampleRate) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.byteLength;

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const pcm16Data = new Int16Array(pcmData);
    return new Blob([header, pcm16Data], {
        type: 'audio/wav'
    });
}

function extractFromPersona(persona, field) {
    const regex = new RegExp(`^${field}:\\s*(.*)$`, 'im');
    const match = persona.match(regex);
    return match ? match[1].trim() : null;
}

function updateBodyScrollLock() {
    const isAnyOverlayVisible = !sidebarOverlay.classList.contains('hidden') ||
        !settingsOverlay.classList.contains('hidden') ||
        !characterModalOverlay.classList.contains('hidden') ||
        !avatarSourceOverlay.classList.contains('hidden') ||
        !importCharacterOverlay.classList.contains('hidden') ||
        !confirmOverlay.classList.contains('hidden');

    document.body.classList.toggle('overflow-hidden', isAnyOverlayVisible);
}

function checkApiSetupAndToggleUI() {
    const provider = settings.apiProvider;
    let apiKey = '';

    switch (provider) {
        case 'gemini':
            apiKey = settings.apiKeys?.[0]?.key || '';
            break;
        case 'groq':
            apiKey = settings.groqApiKey || '';
            break;
        case 'openrouter':
            apiKey = settings.openRouterApiKey || '';
            break;
        case 'electronhub':
            apiKey = settings.electronhubApiKey || '';
            break;
        case 'cerebras':
            apiKey = settings.cerebrasApiKey || '';
            break;
    }

    const isConfigured = apiKey.trim() !== '';

    if (apiSetupBanner) {
        apiSetupBanner.classList.toggle('hidden', isConfigured);
    }
    
    const elementsToToggle = [messageInput, document.getElementById('send-button'), imageUploadButton, guidanceButton];
    
    if (isConfigured) {
        messageInput.placeholder = "Type a message...";
        elementsToToggle.forEach(el => {
            if(el) {
                el.disabled = false;
                el.closest('button')?.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
        messageForm.classList.remove('opacity-50');

    } else {
        messageInput.placeholder = "Please add an API key in Settings to begin chatting.";
        elementsToToggle.forEach(el => {
            if(el) {
                el.disabled = true;
                el.closest('button')?.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
        messageForm.classList.add('opacity-50');
    }
}

// --- PREMIUM SUBSCRIPTION FUNCTIONS ---
async function handleSubscription() {
    if (!currentUser) {
        showAlert({ title: "Sign In Required", message: "You need to sign in to an account to subscribe." });
        return;
    }

    // Open the Lemon Squeezy checkout page in a new tab
    window.open(LEMON_SQUEEZY_CHECKOUT_URL, '_blank');

    // Inform the user about the next steps
    await showAlert({
        title: "Redirecting to Checkout",
        message: "You are being redirected to our secure payment processor. After completing your purchase, your premium status will be activated. You may need to refresh or restart the app."
    });
}


// --- Generic Confirmation Modal Logic ---
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkButton = document.getElementById('confirm-ok-button');
const confirmCancelButton = document.getElementById('confirm-cancel-button');

function showModal({
    title,
    message,
    okText,
    okClass,
    showCancel
}) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.innerHTML = message;
        confirmOkButton.textContent = okText;
        confirmOkButton.className = `font-bold py-2 px-4 rounded-md text-white transition-colors ${okClass}`;

        confirmCancelButton.style.display = showCancel ? 'inline-block' : 'none';
        
        if (okText.includes("Download")) {
            confirmCancelButton.textContent = "Continue without Backup";
        } else {
            confirmCancelButton.textContent = "Cancel";
        }

        confirmModal.classList.remove('hidden');
        confirmOverlay.classList.remove('hidden');
        updateBodyScrollLock();

        const cleanup = (result) => {
            confirmModal.classList.add('hidden');
            confirmOverlay.classList.add('hidden');
            confirmOkButton.removeEventListener('click', okClickHandler);
            confirmCancelButton.removeEventListener('click', cancelClickHandler);
            confirmOverlay.removeEventListener('click', overlayClickHandler);
            updateBodyScrollLock();
            resolve(result);
        };

        const okClickHandler = () => cleanup(true);
        const cancelClickHandler = () => cleanup(false);
        const overlayClickHandler = showCancel ? cancelClickHandler : okClickHandler;

        confirmOkButton.addEventListener('click', okClickHandler);
        confirmCancelButton.addEventListener('click', cancelClickHandler);
        confirmOverlay.addEventListener('click', overlayClickHandler);
    });
}

function showConfirm(options) {
    return showModal({ ...options,
        okText: 'Confirm',
        okClass: 'bg-red-600 hover:bg-red-700',
        showCancel: true
    });
}

function showAlert({
    title,
    message
}) {
    return showModal({
        title,
        message,
        okText: 'OK',
        okClass: 'bg-blue-600 hover:bg-blue-700',
        showCancel: false
    });
}

async function handleSignOut() {
    const confirmed = await showModal({
        title: "Confirm Sign Out",
        message: "Signing out will stop cloud backups and sync. Any new chats on this device will not be saved to your account. Continue?",
        okText: "Sign Out",
        okClass: "bg-blue-600 hover:bg-blue-700",
        showCancel: true
    });
    if (confirmed) {
        await signOut(auth);
        addSystemMessage('You have been signed out. Your data is now saved locally on this device.');
    }
}

async function updateAccountUI() {
    const allViews = [accountViewSignedOut, accountViewFree, accountViewPremium];
    allViews.forEach(v => v?.classList.add('hidden'));

    if (currentUser) {
        const userInfoHTML = `
            <p class="font-semibold truncate">${currentUser.isAnonymous ? 'Anonymous User' : currentUser.displayName || currentUser.email}</p>
            <p class="text-xs opacity-60 truncate">${currentUser.uid}</p>
        `;
        if (isUserPremium) {
            if(userInfoPremium) userInfoPremium.innerHTML = userInfoHTML;
            if(accountViewPremium) accountViewPremium.classList.remove('hidden');
        } else {
            if(userInfoFree) userInfoFree.innerHTML = userInfoHTML;
            if(accountViewFree) accountViewFree.classList.remove('hidden');
            
            // Update last backup info for free users
            const settingsRef = doc(db, `users/${currentUser.uid}/settings`, 'main');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().lastBackupTimestamp) {
                const lastBackupDate = docSnap.data().lastBackupTimestamp.toDate();
                if(lastBackupInfo) lastBackupInfo.textContent = `Last backup: ${lastBackupDate.toLocaleDateString()}`;
            } else {
                if(lastBackupInfo) lastBackupInfo.textContent = 'Awaiting first backup.';
            }
        }
    } else {
        if(accountViewSignedOut) accountViewSignedOut.classList.remove('hidden');
    }
}

function populateCustomModelsInSelect(provider, selectElement) {
    const existingOptgroup = selectElement.querySelector('optgroup[data-custom-models]');
    if (existingOptgroup) {
        existingOptgroup.remove();
    }

    const customModelList = settings.customModels?.[provider] || [];
    if (customModelList.length === 0) return;

    const optgroup = document.createElement('optgroup');
    optgroup.label = 'Your Custom Models';
    optgroup.dataset.customModels = 'true'; 

    customModelList.forEach(modelName => {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelName;
        optgroup.appendChild(option);
    });

    const customOption = selectElement.querySelector('option[value="custom"]');
    if (customOption) {
        selectElement.insertBefore(optgroup, customOption);
    } else {
        selectElement.appendChild(optgroup);
    }
}

function saveCustomModelFromInput(inputElement) {
    let provider;
    let selectElement;

    if (inputElement.id.includes('groq')) {
        provider = 'groq';
        selectElement = groqModelSelect;
    } else if (inputElement.id.includes('openrouter')) {
        provider = 'openrouter';
        selectElement = openrouterModelSelect;
    } else if (inputElement.id.includes('electronhub')) {
        provider = 'electronhub';
        selectElement = electronhubModelSelect;
    } else if (inputElement.id.includes('cerebras')) {
        provider = 'cerebras';
        selectElement = cerebrasModelSelect;
    } else {
        return; 
    }

    const modelName = inputElement.value.trim();
    if (!modelName) return;

    if (!settings.customModels) {
        settings.customModels = { groq: [], openrouter: [], electronhub: [], cerebras: [] };
    }
    if (!settings.customModels[provider]) {
        settings.customModels[provider] = [];
    }

    if (!settings.customModels[provider].includes(modelName)) {
        settings.customModels[provider].push(modelName);
        populateCustomModelsInSelect(provider, selectElement);
        selectElement.value = modelName; 
        selectElement.dispatchEvent(new Event('refresh'));
        updateAndSaveSettings();
    }
}

function populateManagerModal() {
    const providers = ['groq', 'openrouter', 'electronhub', 'cerebras'];
    const lists = {
        groq: groqModelsList,
        openrouter: openrouterModelsList,
        electronhub: electronhubModelsList,
        cerebras: cerebrasModelsList
    };

    providers.forEach(provider => {
        const listElement = lists[provider];
        listElement.innerHTML = '';
        const models = settings.customModels?.[provider] || [];

        if (models.length === 0) {
            listElement.innerHTML = `<li class="text-sm text-gray-500 italic">No custom models saved.</li>`;
            return;
        }

        models.forEach(modelName => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-input p-2 rounded-md';
            li.innerHTML = `
                    <span class="text-sm truncate mr-2">${modelName}</span>
                    <button data-provider="${provider}" data-model="${modelName}" class="delete-custom-model-button p-1 rounded-full hover-theme flex-shrink-0 text-red-500">
                        <svg data-lucide="trash-2" class="h-4 w-4"></svg>
                    </button>
                `;
            listElement.appendChild(li);
        });
    });
    lucide.createIcons();
}

function toggleCustomModelsModal(show) {
    if (show) {
        populateManagerModal();
        customModelsModal.classList.remove('hidden');
        customModelsOverlay.classList.remove('hidden');
    } else {
        customModelsModal.classList.add('hidden');
        customModelsOverlay.classList.add('hidden');
        populateSettingsPanel();
    }
    updateBodyScrollLock();
}

async function loadDataFromLocalStorage() {
    console.log("Loading data from Local Storage...");
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    settings = savedSettings ? JSON.parse(savedSettings) : getDefaultSettings();

    // Ensure proxy is off for non-logged-in users
    if (!currentUser) {
        settings.useSecureProxy = false;
    }

    updateLoaderProgress(50);

    const savedChats = localStorage.getItem(CHATS_KEY);
    chats = savedChats ? JSON.parse(savedChats) : defaultCharacters;
    updateLoaderProgress(70);


    if (!chats.find(c => c.id === settings.activeChatId)) {
        settings.activeChatId = chats[0]?.id || null;
    }

    applySettings();
    finishLoading();
    await loadChatHistory();

    if (!localStorage.getItem('idolon-chat-welcome-guide-sent')) {
        const welcomeMessageText = `Hi there! I'm Idolon, your default AI assistant. Welcome! &#128515;

To unlock my full potential and start chatting, you'll need to connect to an AI model. It's easy!

1.  Click the **Settings** icon (&#9881;) in the top-right corner.
2.  Scroll down to the **API & Model** section.
3.  Paste in your API key. If you don't have one, you can get a free one from: [Google AI Studio](https://aistudio.google.com/app/apikey), [Groq](https://console.groq.com/keys) or [OpenRouter](https://openrouter.ai/keys).
4.  Choose a model from the dropdown menu (the default is great to start with).

Once that's done, you're all set! You can chat with me, create new characters, and explore. Enjoy!`;

        const welcomeTurn = {
            role: 'model', 
            parts: [{
                text: welcomeMessageText
            }],
            isoTimestamp: new Date().toISOString()
        };

        const idolonHistoryKey = getChatHistoryKey('idolon-bot-main');
        const idolonHistory = JSON.parse(localStorage.getItem(idolonHistoryKey) || '[]');
        idolonHistory.push(welcomeTurn);
        localStorage.setItem(idolonHistoryKey, JSON.stringify(idolonHistory));
        localStorage.setItem('idolon-chat-welcome-guide-sent', 'true');
        console.log("Welcome guide message has been added for the first-time user.");
    }

    applySettings();
    finishLoading();
    await loadChatHistory();
    sortAndRenderChats();
}

async function loadDataFromFirestore(cloudSettings) {
    if (!currentUser) return;
    console.log("Loading data from Firestore...");
    settings = { ...getDefaultSettings(), ...cloudSettings };
    updateLoaderProgress(50);

    if (settings.apiKeys && settings.apiKeys[0]) {
        settings.apiKeys[0].key = await decryptData(settings.apiKeys[0].key);
    }
    if (settings.groqApiKey) {
        settings.groqApiKey = await decryptData(settings.groqApiKey);
    }
    if (settings.openRouterApiKey) {
        settings.openRouterApiKey = await decryptData(settings.openRouterApiKey);
    }
	if (settings.electronhubApiKey) {
        settings.electronhubApiKey = await decryptData(settings.electronhubApiKey);
    }
    if (settings.cerebrasApiKey) {
        settings.cerebrasApiKey = await decryptData(settings.cerebrasApiKey);
    }

    saveSettingsToLocalStorage();

    if (!chats.find(c => c.id === settings.activeChatId)) {
        settings.activeChatId = chats[0]?.id || null;
    }

    applySettings();
    finishLoading();
    await loadChatHistory();
}

// --- Settings Management ---
function getDefaultSettings() {
    return {
        darkMode: true,
        theme: 'theme-idolon',
        activeChatId: 'idolon-bot-main',
        apiProvider: 'none',
        chatHistoryDepth: 16,
        useSecureProxy: false, // Default to false, enabled for premium
        streamingEnabled: false,
        apiKeys: [{
            key: '',
            count: 0
        }],
        selectedModel: 'gemini-2.5-flash',
        groqApiKey: '',
        selectedGroqModel: 'llama-3.3-70b-versatile',
        customGroqModel: '',
        openRouterApiKey: '',
        selectedOpenRouterModel: 'openai/gpt-oss-20b:free',
        customOpenRouterModel: '',
        customModels: {
            groq: [],
            openrouter: [],
			electronhub: [],
            cerebras: []
        },
		electronhubApiKey: '',
        selectedElectronhubModel: 'claude-3-5-haiku-20241022',
        customElectronhubModel: '',
        cerebrasApiKey: '',
        selectedCerebrasModel: 'gpt-oss-120b',
        customCerebrasModel: '',
        nsfwAllowed: false,
        userName: 'User',
        userAvatar: '',
        showAvatars: false,
        showTimestamps: true,
        timeSource: 'device',
        characterTimes: {},
        isPremium: false,
        lastBackupTimestamp: null
    };
}

function saveSettingsToLocalStorage() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function saveSettingsToFirestore() {
    if (!currentUser) return;

    const settingsForFirestore = JSON.parse(JSON.stringify(settings));

    if (settingsForFirestore.apiKeys && settingsForFirestore.apiKeys[0]) {
        settingsForFirestore.apiKeys[0].key = await encryptData(settingsForFirestore.apiKeys[0].key);
    }
    if (settingsForFirestore.groqApiKey) {
        settingsForFirestore.groqApiKey = await encryptData(settingsForFirestore.groqApiKey);
    }
    if (settingsForFirestore.openRouterApiKey) {
        settingsForFirestore.openRouterApiKey = await encryptData(settingsForFirestore.openRouterApiKey);
    }
	if (settingsForFirestore.electronhubApiKey) {
        settingsForFirestore.electronhubApiKey = await encryptData(settingsForFirestore.electronhubApiKey);
    }
    if (settingsForFirestore.cerebrasApiKey) {
        settingsForFirestore.cerebrasApiKey = await encryptData(settingsForFirestore.cerebrasApiKey);
    }
    // lastBackupTimestamp should already be a server timestamp object if updated
    
    const settingsRef = doc(db, `users/${currentUser.uid}/settings`, 'main');
    setDoc(settingsRef, settingsForFirestore, {
        merge: true
    }).catch(error => {
        console.error("Non-blocking Firestore settings save failed:", error);
    });
}

function saveChatsToLocalStorage() {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

async function saveChatToFirestore(chat) {
    if (!currentUser || !isUserPremium) return;
    const encryptedChat = await encryptChatObject(chat);
    const chatRef = doc(db, `users/${currentUser.uid}/chats`, chat.id);
    setDoc(chatRef, {
        data: encryptedChat.data
    }, {
        merge: true
    }).catch(error => {
        console.error(`Non-blocking Firestore chat save failed for ${chat.id}:`, error);
    });
}

function formatHeaderName(name) {
    if (!name) return '';
    return name.trim();
}

function handleApiProviderChange() {
    const provider = apiProviderSelect.value;
    const hasSelection = provider && provider !== "none";

    document.getElementById('gemini-settings-block').classList.toggle('hidden', provider !== 'gemini');
    document.getElementById('groq-settings-block').classList.toggle('hidden', provider !== 'groq');
    document.getElementById('openrouter-settings-block').classList.toggle('hidden', provider !== 'openrouter');
    document.getElementById('electronhub-settings-block').classList.toggle('hidden', provider !== 'electronhub');
    document.getElementById('cerebras-settings-block').classList.toggle('hidden', provider !== 'cerebras');
	
    const streamingSwitchWrapper = streamingSwitch.parentElement.parentElement;
    const streamingSwitchDescription = streamingSwitchWrapper.nextElementSibling;

    if (provider === 'gemini') {
        streamingSwitchWrapper.classList.add('hidden');
        if (streamingSwitchDescription && streamingSwitchDescription.tagName === 'P') {
            streamingSwitchDescription.classList.add('hidden');
        }
        settings.streamingEnabled = false;
        streamingSwitch.checked = false;
    } else {
        streamingSwitchWrapper.classList.remove('hidden');
        if (streamingSwitchDescription && streamingSwitchDescription.tagName === 'P') {
            streamingSwitchDescription.classList.remove('hidden');
        }
    }
    
    if(apiProviderPrompt) {
        apiProviderPrompt.classList.toggle('hidden', hasSelection);
    }
    if(apiSettingsWrapper) {
        apiSettingsWrapper.classList.toggle('hidden', !hasSelection);
    }
}

function populateSettingsPanel() {
    themeSwitch.checked = settings.darkMode;
    themeSelect.value = settings.theme;
    apiProviderSelect.value = settings.apiProvider || 'none'; 
    handleApiProviderChange(); 

    // Secure Proxy Logic based on subscription
    secureProxySwitch.checked = settings.useSecureProxy;
    if (isUserPremium) {
        secureProxySwitch.disabled = false;
        proxyPremiumBadge.classList.add('hidden');
        secureProxyWrapper.classList.remove('cursor-not-allowed', 'opacity-70');
        secureProxyWrapper.title = "Recommended. Sends your API key through our secure server instead of your browser.";
    } else {
        secureProxySwitch.disabled = true;
        settings.useSecureProxy = false;
        secureProxySwitch.checked = false;
        proxyPremiumBadge.classList.remove('hidden');
        secureProxyWrapper.classList.add('cursor-not-allowed', 'opacity-70');
        secureProxyWrapper.title = "Secure API Proxy is a Premium feature.";
    }
    
    streamingSwitch.checked = settings.streamingEnabled; 
    const currentDepth = settings.chatHistoryDepth ?? 16;
    const sliderIndex = historyDepthMap.indexOf(currentDepth);
    if (sliderIndex !== -1) {
        historyDepthSlider.value = sliderIndex;
        historyDepthValue.textContent = historyDepthLabels[sliderIndex];
    }
    modelSelect.value = settings.selectedModel || 'gemini-2.5-flash';
    geminiApiKeyInput.value = (settings.apiKeys && settings.apiKeys[0]?.key) || '';
	
    populateCustomModelsInSelect('groq', groqModelSelect);
    groqModelSelect.value = settings.selectedGroqModel || 'llama-3.3-70b-versatile';
    groqApiKeyInput.value = settings.groqApiKey || '';
    groqCustomModelInput.value = settings.customGroqModel || '';
    groqCustomModelWrapper.classList.toggle('hidden', groqModelSelect.value !== 'custom');

    populateCustomModelsInSelect('openrouter', openrouterModelSelect);
    openrouterModelSelect.value = settings.selectedOpenRouterModel || 'openai/gpt-oss-20b:free';
    openrouterApiKeyInput.value = settings.openRouterApiKey || '';
    openrouterCustomModelInput.value = settings.customOpenRouterModel || '';
    openrouterCustomModelWrapper.classList.toggle('hidden', openrouterModelSelect.value !== 'custom');
	
	populateCustomModelsInSelect('electronhub', electronhubModelSelect);
    electronhubModelSelect.value = settings.selectedElectronhubModel || 'claude-3-5-haiku-20241022';
    electronhubApiKeyInput.value = settings.electronhubApiKey || '';
    electronhubCustomModelInput.value = settings.customElectronhubModel || '';
    electronhubCustomModelWrapper.classList.toggle('hidden', electronhubModelSelect.value !== 'custom');

    populateCustomModelsInSelect('cerebras', cerebrasModelSelect);
    cerebrasModelSelect.value = settings.selectedCerebrasModel || 'gpt-oss-120b';
    cerebrasApiKeyInput.value = settings.cerebrasApiKey || '';
    cerebrasCustomModelInput.value = settings.customCerebrasModel || '';
    cerebrasCustomModelWrapper.classList.toggle('hidden', cerebrasModelSelect.value !== 'custom');

    nsfwSwitch.checked = settings.nsfwAllowed;
    userNameInput.value = settings.userName;
    showAvatarsSwitch.checked = settings.showAvatars;

    timeSourceSelect.value = settings.timeSource;
    userAvatarPreview.src = settings.userAvatar || `https://placehold.co/64x64/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${(settings.userName || 'U').charAt(0)}`;

    document.querySelectorAll('#settings-panel select').forEach(s => s.dispatchEvent(new Event('refresh')));
}

function applySettings() {
    document.documentElement.dataset.mode = settings.darkMode ? 'dark' : 'light';
    document.body.dataset.theme = settings.theme;
    document.getElementById('app-container').classList.toggle('hide-chat-avatars', !settings.showAvatars);

    const isTextOnlyProvider = ['groq', 'openrouter', 'electronhub', 'cerebras'].includes(settings.apiProvider);
    imageUploadButton.classList.toggle('hidden', isTextOnlyProvider);

    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (activeChat) {
        document.getElementById('header-name').textContent = formatHeaderName(activeChat.name);
        headerAvatarStack.innerHTML = '';
        if (activeChat.isCharacter === false && activeChat.participantIds.length > 1) {
            activeChat.participantIds.slice(0, 3).forEach(pid => {
                const participant = chats.find(c => c.id === pid);
                if (participant) {
                    const img = document.createElement('img');
                    img.src = participant.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${participant.name.charAt(0)}`;
                    img.className = 'w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white dark:border-gray-800';
                    headerAvatarStack.appendChild(img);
                }
            });
        } else {
            const img = document.createElement('img');
            img.id = 'header-avatar';
            img.src = activeChat.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${activeChat.name.charAt(0)}`;
            img.className = 'w-8 h-8 md:w-10 md:h-10 rounded-full object-cover';
            headerAvatarStack.appendChild(img);
        }
    }

    sortAndRenderChats();
    checkApiSetupAndToggleUI();
    lucide.createIcons();
}

function updateAndSaveSettings() {
    settings.apiProvider = apiProviderSelect.value;
    settings.useSecureProxy = secureProxySwitch.checked;
    settings.streamingEnabled = streamingSwitch.checked;

    const oldKey = (settings.apiKeys && settings.apiKeys[0]?.key) || '';
    const newKey = geminiApiKeyInput.value.trim();
    settings.apiKeys[0] = {
        key: newKey,
        count: oldKey === newKey ? ((settings.apiKeys && settings.apiKeys[0]?.count) || 0) : 0
    };
    settings.selectedModel = modelSelect.value;

    settings.groqApiKey = groqApiKeyInput.value.trim();
    settings.selectedGroqModel = groqModelSelect.value;
    settings.customGroqModel = groqCustomModelInput.value.trim();

    settings.openRouterApiKey = openrouterApiKeyInput.value.trim();
    settings.selectedOpenRouterModel = openrouterModelSelect.value;
    settings.customOpenRouterModel = openrouterCustomModelInput.value.trim();
    
    settings.electronhubApiKey = electronhubApiKeyInput.value.trim();
    settings.selectedElectronhubModel = electronhubModelSelect.value;
    settings.customElectronhubModel = electronhubCustomModelInput.value.trim();

    settings.cerebrasApiKey = cerebrasApiKeyInput.value.trim();
    settings.selectedCerebrasModel = cerebrasModelSelect.value;
    settings.customCerebrasModel = cerebrasCustomModelInput.value.trim();

    settings.nsfwAllowed = nsfwSwitch.checked;
    settings.darkMode = themeSwitch.checked;
    settings.theme = themeSelect.value;
    settings.userName = userNameInput.value.trim() || 'User';
    settings.showAvatars = showAvatarsSwitch.checked;

    settings.timeSource = timeSourceSelect.value;

    saveSettingsToLocalStorage();
    saveSettingsToFirestore();

    applySettings();
}

// --- Start of Unchanged Functions ---
function updateCharacterModalUI() {
    const type = charTypeSelect.value;
    const enhancePersonaButton = document.getElementById('enhance-persona-button');
    const enhanceScenarioButton = document.getElementById('enhance-scenario-button');
    const roleplayFieldsWrapper = document.getElementById('roleplay-fields-wrapper');
    
    // Hide example dialogue for adventure mode
    const exampleDialogueWrapper = document.getElementById('char-example-dialogue-input').parentElement;
    
    if (type === 'assistant') {
        aiPersonaLabel.textContent = 'Assistant Instructions';
        charPersonaInput.placeholder = "Describe what this assistant is designed to do...";
        userPersonaLabel.textContent = 'Your Background for the Assistant (Optional)';
        charUserPersonaInput.placeholder = "e.g., 'I am a software developer,' or 'I am new to this topic.'";
        userPersonaWrapper.classList.remove('hidden');
        roleplayFieldsWrapper.classList.add('hidden');
        enhancePersonaButton.parentElement.classList.remove('hidden');
        enhanceScenarioButton.classList.add('hidden');
    } else if (type === 'roleplay') {
        aiPersonaLabel.textContent = 'AI Character Profile';
        charPersonaInput.placeholder = "Describe the AI's character in detail...";
        userPersonaLabel.textContent = 'Your Role';
        charUserPersonaInput.placeholder = "e.g., 'A detective investigating the case,' or 'A fellow knight.'";
        userPersonaWrapper.classList.remove('hidden');
        roleplayFieldsWrapper.classList.remove('hidden');
        if (exampleDialogueWrapper) exampleDialogueWrapper.classList.remove('hidden');
        enhancePersonaButton.parentElement.classList.add('hidden'); 
        enhanceScenarioButton.classList.remove('hidden'); 
    } else if (type === 'adventure') { // START: NEW ADVENTURE BLOCK
        aiPersonaLabel.textContent = 'Game Master (GM) Persona (Optional)';
        charPersonaInput.placeholder = "e.g., 'A witty and descriptive storyteller who enjoys dramatic twists.'";
        userPersonaLabel.textContent = 'Your Character Profile';
        charUserPersonaInput.placeholder = "Describe your character. e.g., 'A brave knight named Sir Gideon with a strong sense of justice.'";
        userPersonaWrapper.classList.remove('hidden');
        roleplayFieldsWrapper.classList.remove('hidden');
        if (exampleDialogueWrapper) exampleDialogueWrapper.classList.add('hidden'); // Hide example dialogue field
        enhancePersonaButton.parentElement.classList.add('hidden'); 
        enhanceScenarioButton.classList.remove('hidden'); 
    } // END: NEW ADVENTURE BLOCK
    else { // messaging
        aiPersonaLabel.textContent = 'AI Persona & Texting Style';
        charPersonaInput.placeholder = "Describe the character's personality, job, etc...";
        userPersonaLabel.textContent = 'Context for the AI About You (Optional)';
        charUserPersonaInput.placeholder = "e.g., 'You are my close friend,' or 'We are co-workers.'";
        userPersonaWrapper.classList.remove('hidden');
        roleplayFieldsWrapper.classList.add('hidden');
        enhancePersonaButton.parentElement.classList.remove('hidden');
        enhanceScenarioButton.classList.add('hidden');
    }
}

function toggleCharacterPopdown(show) {
    if (show) {
        const activeChat = chats.find(c => c.id === settings.activeChatId);
        if (!activeChat) return;
        popdownName.textContent = activeChat.name;
        characterDetailsPopdown.style.zIndex = '35';
        if (activeChat.isCharacter === false) {
            popdownAvatar.src = `https://placehold.co/80x80/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=Group`;
            const participants = activeChat.participantIds.map(id => chats.find(c => c.id === id)).filter(Boolean);
            popdownDetailsContent.innerHTML = `
                        <h4 class="font-semibold mb-2">Participants:</h4>
                        <div class="flex flex-col gap-1">
                            ${participants.map(p => `<span>- ${p.name}</span>`).join('')}
                        </div>
                    `;
        } else {
            popdownAvatar.src = activeChat.avatar || `https://placehold.co/80x80/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${activeChat.name.charAt(0)}`;
            const personaHtml = activeChat.persona.replace(/\n/g, '<br>');
            popdownDetailsContent.innerHTML = personaHtml;
        }
        characterDetailsPopdown.classList.remove('hidden');
        characterDetailsOverlay.classList.remove('hidden');
        setTimeout(() => {
            characterDetailsPopdown.classList.remove('opacity-0', 'scale-95');
        }, 10);
    } else {
        characterDetailsPopdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            characterDetailsPopdown.classList.add('hidden');
            characterDetailsOverlay.classList.add('hidden');
        }, 200);
    }
}

function renderChats(chatsToRender = chats) {
    characterListEl.innerHTML = '';
    
    if (chatsToRender.length === 0 && !document.getElementById('character-search-input').value) {
        characterListEl.innerHTML = `
            <div class="text-center p-8 space-y-4">
                <svg data-lucide="users-2" class="mx-auto h-12 w-12 text-gray-400"></svg>
                <h3 class="font-semibold text-theme">No Chats Yet</h3>
                <p class="text-sm text-gray-500">Add a new character or group to get started!</p>
                <button id="add-char-from-empty-state" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    Add Character
                </button>
            </div>`;
        document.getElementById('add-char-from-empty-state').addEventListener('click', () => {
            modalMode = 'character';
            openModal();
        });
        lucide.createIcons();
        return;
    } else if (chatsToRender.length === 0) {
        characterListEl.innerHTML = `<p class="text-center text-sm text-gray-500 p-4">No chats match your search.</p>`;
        return;
    }
    
    chatsToRender.forEach(chat => {
        const chatEl = document.createElement('div');
        chatEl.className = 'character-item flex items-center justify-between p-3 rounded-lg cursor-pointer hover-theme';
        chatEl.dataset.id = chat.id;

        if (chat.id === settings.activeChatId) {
            chatEl.classList.add('active');
        }

        let avatarHtml;
        if (chat.isCharacter === false && chat.participantIds.length > 1) {
            avatarHtml = `<div class="flex items-center -space-x-3 flex-shrink-0">`;
            chat.participantIds.slice(0, 2).forEach(pid => {
                const p = chats.find(c => c.id === pid);
                if (p) avatarHtml += `<img src="${p.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${p.name.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover border-2 border-sidebar">`;
            });
            avatarHtml += `</div>`;
        } else {
            const avatarSrc = chat.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${chat.name.charAt(0)}`;
            avatarHtml = `<img src="${avatarSrc}" class="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0">`;
        }


        chatEl.innerHTML = `
                    <div class="flex items-center overflow-hidden">
                        ${avatarHtml}
                        <h2 class="font-semibold text-theme truncate ml-3">${chat.name}</h2>
                    </div>
                    <button data-id="${chat.id}" class="edit-character-button p-1 rounded-full hover-theme flex-shrink-0">
                        <svg data-lucide="pencil" class="h-4 w-4 icon-theme"></svg>
                    </button>
                `;

        chatEl.querySelector('.edit-character-button').addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(chat.id);
        });
        chatEl.addEventListener('click', () => loadChat(chat.id));
        characterListEl.appendChild(chatEl);
    });
    lucide.createIcons();
}

async function loadChat(chatId, force = false) {
    if (!chatId || (!force && chatId === settings.activeChatId)) return;
	sessionMessages = []; 
    toggleCharacterPopdown(false);

    settings.activeChatId = chatId;
    applySettings();

    messageArea.innerHTML = '';

    if (currentUser && isUserPremium) {
        clearTimeout(chatLoadAnimationTimeout);
        chatLoadingBar.style.transition = 'none';
        chatLoadingBar.style.width = '0%';

        requestAnimationFrame(() => {
            chatLoadingBarContainer.classList.add('visible');
            chatLoadingBar.style.transition = 'width 100ms ease-out';
            const initialJump = Math.random() * 15 + 15;
            chatLoadingBar.style.width = `${initialJump}%`;

            chatLoadAnimationTimeout = setTimeout(() => {
                chatLoadingBar.style.transition = 'width 3000ms ease-in-out';
                chatLoadingBar.style.width = '90%';
            }, 100);
        });
    }

    await loadChatHistory();

    saveSettingsToLocalStorage();
    saveSettingsToFirestore();
}

async function openModal(id = null) {
    isModalDirty = false;
    editingChatId = id;
    tempCharAvatarData = null;
    analyzeImageButton.classList.add('hidden');

    const chatToEdit = id ? chats.find(c => c.id === id) : null;

    if (id && chatToEdit) {
        modalMode = chatToEdit.isCharacter ? 'character' : 'group';
    }

    const isGroup = modalMode === 'group';

    document.getElementById('group-name-wrapper').classList.toggle('hidden', !isGroup);
    document.getElementById('character-details-wrapper').classList.toggle('hidden', isGroup);
    document.getElementById('character-fields').classList.toggle('hidden', isGroup);
    document.getElementById('group-fields').classList.toggle('hidden', !isGroup);
    userPersonaWrapper.classList.remove('hidden');

    if (isGroup) {
        characterModalTitle.textContent = id ? 'Edit Group' : 'Create New Group';
        groupNameInput.value = chatToEdit ? chatToEdit.name : '';
        groupTypeSelect.value = chatToEdit ? chatToEdit.type : 'messaging';
        charUserPersonaInput.value = chatToEdit ? chatToEdit.userPersona : '';
        populateParticipantList(chatToEdit ? chatToEdit.participantIds : []);
    } else {
        characterModalTitle.textContent = id ? 'Edit Character' : 'Add New Character';
        charNameInput.value = chatToEdit ? chatToEdit.name : '';
        charTypeSelect.value = chatToEdit ? chatToEdit.type : 'messaging';
        charLanguageInput.value = chatToEdit ? chatToEdit.language : 'English';

        charAvatarPreview.src = chatToEdit ? (chatToEdit.avatar || `https://placehold.co/64x64/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${(chatToEdit.name || 'A').charAt(0)}`) : `https://placehold.co/64x64/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=?`;
        charPersonaInput.value = chatToEdit ? chatToEdit.persona : '';
        charUserPersonaInput.value = chatToEdit ? chatToEdit.userPersona : '';

        document.getElementById('char-scenario-input').value = chatToEdit ? (chatToEdit.scenario || '') : '';
        document.getElementById('char-first-message-input').value = chatToEdit ? (chatToEdit.firstMessage || '') : '';
        document.getElementById('char-example-dialogue-input').value = chatToEdit ? (chatToEdit.exampleDialogue || '') : '';
	    document.getElementById('char-other-details-input').value = chatToEdit ? (chatToEdit.otherDetails || '') : '';
    }
    
    updateCharacterModalUI();
    document.querySelectorAll('#character-modal select').forEach(s => s.dispatchEvent(new Event('refresh')));
    deleteCharacterButton.classList.toggle('hidden', !id || id === 'idolon-bot-main');
    characterModal.classList.remove('hidden');
    characterModalOverlay.classList.remove('hidden');
    updateBodyScrollLock();
}

function populateParticipantList(selectedIds = []) {
    groupParticipantList.innerHTML = '';
    const allCharacters = chats.filter(c => c.isCharacter);
    allCharacters.forEach(char => {
        const isChecked = selectedIds.includes(char.id);
        const participantEl = document.createElement('label');
        participantEl.className = 'flex items-center gap-3 p-2 rounded-md hover-theme cursor-pointer';
        participantEl.innerHTML = `
                    <input type="checkbox" value="${char.id}" class="form-checkbox h-5 w-5 rounded text-blue-600 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500" ${isChecked ? 'checked' : ''}>
                    <img src="${char.avatar || `https://placehold.co/40x40/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${char.name.charAt(0)}`}" class="w-8 h-8 rounded-full object-cover">
                    <span class="text-theme">${char.name}</span>
                `;
        groupParticipantList.appendChild(participantEl);
    });
}

async function closeCharacterModal() {
    if (isModalDirty) {
        const confirmed = await showConfirm({
            title: "Discard Changes?",
            message: "You have unsaved changes. Are you sure you want to discard them?",
            okText: "Discard",
            okClass: "bg-red-600 hover:bg-red-700"
        });
        if (!confirmed) {
            return;
        }
    }

    characterModal.classList.add('hidden');
    characterModalOverlay.classList.add('hidden');
    editingChatId = null;
    isModalDirty = false;
    updateBodyScrollLock();
}

async function saveChat() {
    const originalButtonText = saveCharacterButton.innerHTML;
    saveCharacterButton.disabled = true;
    saveCharacterButton.innerHTML = `
        <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
        </span>`;

    let chatToSave;

    if (modalMode === 'group') {
        const name = groupNameInput.value.trim();
        if (!name) {
            showAlert({ title: 'Input Required', message: 'Group Name cannot be empty.' });
            saveCharacterButton.disabled = false;
            saveCharacterButton.innerHTML = originalButtonText;
            return;
        }

        const selectedParticipants = Array.from(groupParticipantList.querySelectorAll('input:checked')).map(input => input.value);
        if (selectedParticipants.length < 2) {
            showAlert({ title: 'Input Required', message: 'A group must have at least two characters.' });
            saveCharacterButton.disabled = false;
            saveCharacterButton.innerHTML = originalButtonText;
            return;
        }

        chatToSave = {
            name,
            type: groupTypeSelect.value,
            userPersona: charUserPersonaInput.value.trim(),
            participantIds: selectedParticipants,
            isCharacter: false,
            avatar: '',
            otherDetails: ''
        };

        if (editingChatId) {
            const chatIndex = chats.findIndex(c => c.id === editingChatId);
            chatToSave.id = editingChatId;
            chats[chatIndex] = { ...chats[chatIndex], ...chatToSave };
        } else {
            chatToSave.id = `group-${Date.now()}`;
            chats.push(chatToSave);
            settings.activeChatId = chatToSave.id;
        }

    } else {
        let name = charNameInput.value.trim();
        if (!name) {
            showAlert({ title: 'Input Required', message: 'AI Name cannot be empty.' });
            saveCharacterButton.disabled = false;
            saveCharacterButton.innerHTML = originalButtonText;
            return;
        }

        const type = charTypeSelect.value;
        const persona = charPersonaInput.value.trim();
        const userPersona = charUserPersonaInput.value.trim();

        if (editingChatId) {
            const chatIndex = chats.findIndex(c => c.id === editingChatId);
            chatToSave = {
                name,
                type,
                language: charLanguageInput.value.trim() || 'English',
                persona: persona,
                userPersona: userPersona,
                isCharacter: true,
                id: editingChatId,
                participantIds: [editingChatId],
                avatar: tempCharAvatarData || chats[chatIndex].avatar,
                scenario: document.getElementById('char-scenario-input').value.trim(),
                firstMessage: document.getElementById('char-first-message-input').value.trim(),
                exampleDialogue: document.getElementById('char-example-dialogue-input').value.trim(),
                otherDetails: document.getElementById('char-other-details-input').value.trim()
            };

            if (persona !== chats[chatIndex].persona) {
                chatToSave.voice = await assignVoice(persona);
            } else {
                chatToSave.voice = chats[chatIndex].voice;
            }
            chats[chatIndex] = chatToSave;

        } else {
            const originalName = name;
            let counter = 2;
            while (chats.some(c => c.name === name)) {
                name = `${originalName} ${counter}`;
                counter++;
            }

            const newId = `char-${Date.now()}`;
            chatToSave = {
                name,
                type,
                language: charLanguageInput.value.trim() || 'English',
                persona: persona,
                userPersona: userPersona,
                isCharacter: true,
                id: newId,
                participantIds: [newId],
                avatar: tempCharAvatarData || '',
                voice: await assignVoice(persona),
                scenario: document.getElementById('char-scenario-input').value.trim(),
                firstMessage: document.getElementById('char-first-message-input').value.trim(),
                exampleDialogue: document.getElementById('char-example-dialogue-input').value.trim(),
                otherDetails: document.getElementById('char-other-details-input').value.trim()
            };

            chats.push(chatToSave);
            settings.activeChatId = chatToSave.id;
        }
    }
    
    saveCharacterButton.innerHTML = `
        <span class="flex items-center justify-center gap-2">
            <svg data-lucide="check" class="h-4 w-4"></svg>
            Saved!
        </span>`;
    lucide.createIcons();

    sortAndRenderChats();
    saveChatsToLocalStorage();
    if (isUserPremium) { // Only premium users save characters in real-time
        await saveChatToFirestore(chatToSave);
    }


    setTimeout(async () => {
        isModalDirty = false;
        await closeCharacterModal();
        await loadChat(chatToSave.id, true);
        
        setTimeout(() => {
             saveCharacterButton.disabled = false;
             saveCharacterButton.innerHTML = originalButtonText;
        }, 300);

    }, 1000);
}


async function deleteChat() {
    if (!editingChatId) return;
    if (chats.length <= 1) {
        showAlert({
            title: 'Action Not Allowed',
            message: 'You cannot delete the last chat.'
        });
        return;
    }
    const confirmed = await showConfirm({
        message: `Are you sure you want to delete this chat? This action cannot be undone.`
    });

    if (confirmed) {
        const deletedChatId = editingChatId;

        if (currentUser) { // Premium and free users delete from cloud
            await deleteDoc(doc(db, `users/${currentUser.uid}/chats`, deletedChatId));
            await clearCloudChatHistory(deletedChatId);
        }

        chats = chats.filter(c => c.id !== deletedChatId);
        sortAndRenderChats();

        localStorage.removeItem(getChatHistoryKey(deletedChatId));
        saveChatsToLocalStorage();

        let newActiveChatId;
        const idolonBotId = 'idolon-bot-main';
        const idolonBotExists = chats.some(c => c.id === idolonBotId);

        if (idolonBotExists && deletedChatId !== idolonBotId) {
            newActiveChatId = idolonBotId;
        } else {
            newActiveChatId = chats[0]?.id || null;
        }

        if (newActiveChatId) {
            settings.activeChatId = newActiveChatId;
            saveSettingsToLocalStorage();
            if (currentUser) await saveSettingsToFirestore();
            await loadChat(settings.activeChatId, true);
        }

        closeCharacterModal();
    }
}

async function clearCloudChatHistory(chatId) {
    if (!currentUser || !chatId) return;
    const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${chatId}/messages`);
    const querySnapshot = await getDocs(messagesRef);
    if (querySnapshot.empty) return;
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
}

function getChatHistoryKey(id = null) {
    return `${CHAT_HISTORY_KEY_PREFIX}${id || settings.activeChatId}`;
}

async function saveMessageLocally(turn) {
    const key = getChatHistoryKey();
    const localHistory = JSON.parse(localStorage.getItem(key) || '[]');
    const encryptedTurn = await encryptTurn(turn);
    localHistory.push(encryptedTurn);
    localStorage.setItem(key, JSON.stringify(localHistory));
}

function renderChatHistory() {
    messageArea.innerHTML = '';
    const activeChat = chats.find(c => c.id === settings.activeChatId);

    if (activeChat && activeChat.type === 'adventure') {
        // --- ADVENTURE MODE RENDERER ---
        messageForm.classList.add('hidden'); // Always hide the text input form for adventures.

        if (chatHistory.length === 0) {
            // Case 1: Brand new adventure. Show intro and START button.
            const introContainer = document.createElement('div');
            introContainer.className = 'adventure-intro-container';
            introContainer.innerHTML = marked.parse(activeChat.firstMessage || "The adventure is about to begin...");
            messageArea.appendChild(introContainer);

            const startButton = document.createElement('button');
            startButton.id = 'adventure-start-btn';
            startButton.className = 'adventure-start-button';
            startButton.textContent = 'START';
            messageArea.appendChild(startButton);

            startButton.addEventListener('click', async () => {
                startButton.disabled = true;
                startButton.textContent = 'Starting...';
                await handleAdventureChoice('Begin the adventure.', { isStart: true });
                startButton.remove();
            }, { once: true });

        } else {
            // Case 2: In-progress adventure on page load/refresh.
            // Render all historical messages WITHOUT their choice buttons.
            chatHistory.forEach(turn => addMessage(turn, { isHistoryRender: true }));

            const lastTurn = chatHistory[chatHistory.length - 1];
            const lastText = lastTurn ? lastTurn.parts.map(p => p.text).join('\n') : '';

            // If the game isn't over, show a "Continue" button.
            if (!lastText.includes('[THE END]')) {
                const continueButton = document.createElement('button');
                continueButton.id = 'adventure-continue-btn';
                continueButton.className = 'adventure-start-button';
                continueButton.textContent = 'CONTINUE ADVENTURE';
                messageArea.appendChild(continueButton);

                continueButton.addEventListener('click', async () => {
                    continueButton.disabled = true;
                    continueButton.textContent = 'Loading...';
                    // *** THIS IS THE KEY FIX ***
                    // We now call handleAdventureChoice, which correctly processes the AI response and shows the new choices.
                    await handleAdventureChoice('Continue the story.', { isContinuation: true });
                    continueButton.remove();
                }, { once: true });
            }
        }

    } else {
        // --- DEFAULT CHAT RENDERER (for non-adventure modes) ---
        messageForm.classList.remove('hidden');

        if (chatHistory.length === 0 && activeChat) {
             let welcomeTurn;
            if (activeChat.type === 'roleplay' && activeChat.firstMessage) {
                welcomeTurn = { role: 'model', parts: [{ text: activeChat.firstMessage }], isoTimestamp: new Date().toISOString() };
            } else {
                const welcomeText = activeChat.isCharacter === false ? `This is the beginning of your group chat with ${activeChat.name}.` : `This is the beginning of your chat with ${activeChat.name}.`;
                welcomeTurn = { role: 'ai', parts: [{ text: welcomeText }], isoTimestamp: new Date().toISOString() };
            }
            addMessage(welcomeTurn);
        } else {
            chatHistory.forEach(turn => addMessage(turn));
        }
    }

    sessionMessages.forEach(turn => addMessage(turn));
    scrollToBottom();
}

async function loadChatHistory() {
    if (chatListenerUnsubscribe) {
        chatListenerUnsubscribe();
        chatListenerUnsubscribe = null;
    }

    const activeChatId = settings.activeChatId;
    if (!activeChatId) {
        chatHistory = [];
        renderChatHistory();
        return;
    }

    if (currentUser && isUserPremium) {
        chatHistory = [];
        messageArea.innerHTML = '';

        const collectionPath = `users/${currentUser.uid}/chatHistory/${activeChatId}/messages`;
        const messagesRef = collection(db, collectionPath);
        const q = query(messagesRef, orderBy("createdAt"));

        chatListenerUnsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (settings.activeChatId !== activeChatId) return;

            const newHistory = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const decryptedData = await decryptTurn(data);
                const date = data.createdAt?.toDate() || new Date();
                return {
                    ...decryptedData,
                    firestoreId: doc.id,
                    isoTimestamp: date.toISOString(),
                    timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }));
            
            chatHistory = newHistory;
            renderChatHistory();

            clearTimeout(chatLoadAnimationTimeout);
            chatLoadingBar.style.transition = 'width 0.3s ease-out';
            chatLoadingBar.style.width = '100%';
            setTimeout(() => {
                chatLoadingBarContainer.classList.remove('visible');
            }, 100);

        }, (error) => {
            console.error("Error listening to chat history:", error);
            chatLoadingBarContainer.classList.remove('visible');
            if (error.code === 'failed-precondition') {
                addSystemMessage('Error: A database index is required. Please check the developer console for a link to create it.');
            }
            finishLoading();
        });
    } else { // Anonymous and Free users load from Local Storage
        const savedHistoryJSON = localStorage.getItem(getChatHistoryKey());
        const savedHistory = savedHistoryJSON ? JSON.parse(savedHistoryJSON) : [];
        chatHistory = await Promise.all(savedHistory.map(turn => decryptTurn(turn)));
        renderChatHistory();
        chatLoadingBarContainer.classList.remove('visible');
    }
}

async function clearCurrentChatHistory() {
    const confirmed = await showConfirm({
        title: "Delete Cloud History",
        message: 'Are you sure you want to delete this chat history from the cloud? This action cannot be undone.'
    });
    if (confirmed) {
        localStorage.removeItem(getChatHistoryKey());

        if (currentUser && settings.activeChatId) {
            await clearCloudChatHistory(settings.activeChatId);
             if(!isUserPremium) { // Free users need to render after clearing local
                chatHistory = [];
                renderChatHistory();
            }
        } else {
            chatHistory = [];
            renderChatHistory();
        }
    }
}

async function clearLocalChatHistory() {
    const confirmed = await showModal({
        title: "Clear Local History",
        message: 'Are you sure you want to clear this chat from this device? It will remain in the cloud if you are a signed-in user.',
        okText: 'Clear Local',
        okClass: 'bg-blue-600 hover:bg-blue-700',
        showCancel: true
    });
    if (confirmed) {
        chatHistory = [];
        localStorage.removeItem(getChatHistoryKey());
        renderChatHistory();
    }
}

async function downloadCharacterData() {
    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (!activeChat) return;

    const decryptedHistory = await Promise.all(chatHistory.map(turn => decryptTurn(turn)));

    const dataToDownload = {
        character: activeChat,
        history: decryptedHistory
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = activeChat.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `idolon-character-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadAllLocalData() {
    try {
        addSystemMessage("Packaging local data for download...");
        const backupData = {
            characters: [],
            histories: {}
        };

        const localChatsRaw = localStorage.getItem(CHATS_KEY);
        if (localChatsRaw) {
            backupData.characters = JSON.parse(localChatsRaw);
        }

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(CHAT_HISTORY_KEY_PREFIX)) {
                const chatId = key.replace(CHAT_HISTORY_KEY_PREFIX, '');
                const historyRaw = localStorage.getItem(key);
                if (historyRaw) {
                    const encryptedHistory = JSON.parse(historyRaw);
                    backupData.histories[chatId] = await Promise.all(encryptedHistory.map(turn => decryptTurn(turn)));
                }
            }
        }

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `idolon-local-backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addSystemMessage("Local data backup downloaded successfully.");
    } catch (error) {
        console.error("Failed to create local data backup:", error);
        showAlert({ title: "Backup Failed", message: "Could not create the local data backup file." });
    }
}

function showImportCharacterConfirmModal(characterName) {
    return new Promise((resolve) => {
        importCharacterMessage.innerHTML = `A character named "<strong>${characterName}</strong>" already exists. How would you like to proceed?`;
        importCharacterModal.classList.remove('hidden');
        importCharacterOverlay.classList.remove('hidden');
        updateBodyScrollLock();

        const cleanup = (choice) => {
            importCharacterModal.classList.add('hidden');
            importCharacterOverlay.classList.add('hidden');
            importReplaceCharButton.removeEventListener('click', replaceClickHandler);
            importCreateNewCharButton.removeEventListener('click', createClickHandler);
            importCharCancelButton.removeEventListener('click', cancelClickHandler);
            importCharacterOverlay.removeEventListener('click', cancelClickHandler);
            updateBodyScrollLock();
            resolve(choice);
        };

        const replaceClickHandler = () => cleanup('replace');
        const createClickHandler = () => cleanup('create');
        const cancelClickHandler = () => cleanup(null);

        importReplaceCharButton.addEventListener('click', replaceClickHandler);
        importCreateNewCharButton.addEventListener('click', createClickHandler);
        importCharCancelButton.addEventListener('click', cancelClickHandler);
        importCharacterOverlay.addEventListener('click', cancelClickHandler);
    });
}

async function handleChatUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            if (importedData.characters && importedData.histories && Array.isArray(importedData.characters)) {
                await importMultiCharacterBackup(importedData);
            }
            else if (importedData.character && importedData.history && typeof importedData.character === 'object') {
                await importSingleCharacter(importedData);
            }
            else {
                throw new Error("Invalid file format. The file must be a valid single-character or multi-character backup file.");
            }

        } catch (error) {
            showAlert({ title: "Import Failed", message: error.message });
            console.error("Import error:", error);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

async function importSingleCharacter(importedData) {
    const { character: importedChar, history: importedHistory } = importedData;
    const existingChar = chats.find(c => c.name === importedChar.name);

    if (existingChar) {
        const choice = await showImportCharacterConfirmModal(existingChar.name);
        if (choice === 'replace') {
            await replaceCharacter(existingChar, importedData);
        } else if (choice === 'create') {
            await createNewCharacter(importedData, true);
        }
    } else {
        await createNewCharacter(importedData, false);
    }
}

async function importMultiCharacterBackup(backupData) {
    addSystemMessage(`Starting import of ${backupData.characters.length} chats from backup...`);
    let lastImportedId = null;

    for (const charToImport of backupData.characters) {
        let newChar = { ...charToImport };
        const historyForChar = backupData.histories[charToImport.id] || [];

        let newName = newChar.name;
        let counter = 2;
        while (chats.some(c => c.name === newName)) {
            newName = `${newChar.name} ${counter > 1 ? `(${counter})` : '(Imported)'}`;
            counter++;
        }
        newChar.name = newName;

        const newId = `${newChar.isCharacter ? 'char' : 'group'}-${Date.now()}-${Math.random()}`;
        const oldId = newChar.id;
        newChar.id = newId;
        if (newChar.isCharacter) {
            newChar.participantIds = [newId];
        }

        chats.push(newChar);
        lastImportedId = newId;

        const encryptedHistory = await Promise.all(historyForChar.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(newId), JSON.stringify(encryptedHistory));
        if(isUserPremium) saveChatToFirestore(newChar);
        if(isUserPremium) safeCloudHistoryUpdate(historyForChar, newId);
    }

    saveChatsToLocalStorage();
    sortAndRenderChats();
    addSystemMessage(`Successfully imported ${backupData.characters.length} chats.`);

    if (lastImportedId) {
        await loadChat(lastImportedId, true);
    }
}

async function replaceCharacter(existingChar, importedData) {
    const {
        character: importedChar,
        history: importedHistory
    } = importedData;

    const updatedChar = {
        ...existingChar,
        ...importedChar,
        id: existingChar.id,
        participantIds: [existingChar.id],
    };

    const charIndex = chats.findIndex(c => c.id === existingChar.id);
    if (charIndex !== -1) {
        chats[charIndex] = updatedChar;
    }

    const encryptedHistory = await Promise.all(importedHistory.map(encryptTurn));
    localStorage.setItem(getChatHistoryKey(existingChar.id), JSON.stringify(encryptedHistory));

    saveChatsToLocalStorage();
    if(isUserPremium) saveChatToFirestore(updatedChar);
    if(isUserPremium) safeCloudHistoryUpdate(importedHistory, existingChar.id);

    addSystemMessage(`Character "${existingChar.name}" has been replaced.`);
    await loadChat(existingChar.id);
}

async function createNewCharacter(importedData, isDuplicate) {
    let {
        character: newChar,
        history: newHistory
    } = importedData;

    if (isDuplicate) {
        let newName = newChar.name;
        let i = 2;
        while (chats.some(c => c.name === newName)) {
            newName = `${newChar.name} (${i++})`;
        }
        newChar.name = newName;
    }

    const newId = `${newChar.isCharacter ? 'char' : 'group'}-${Date.now()}`;
    newChar.id = newId;
    if (newChar.isCharacter) {
        newChar.participantIds = [newId];
    }

    chats.push(newChar);
    const encryptedHistory = await Promise.all(newHistory.map(encryptTurn));
    localStorage.setItem(getChatHistoryKey(newId), JSON.stringify(encryptedHistory));

    saveChatsToLocalStorage();
    if(isUserPremium) saveChatToFirestore(newChar);
    if(isUserPremium) safeCloudHistoryUpdate(newHistory, newId);

    addSystemMessage(`Successfully imported "${newChar.name}".`);
    await loadChat(newId);
}

function safeCloudHistoryUpdate(newHistory, chatId) {
    if (!currentUser) return;

    (async () => {
        await clearCloudChatHistory(chatId);

        const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${chatId}/messages`);
        const batch = writeBatch(db);

        for (const message of newHistory) {
            const messageDate = new Date(message.isoTimestamp);
            const originalTimestamp = isNaN(messageDate) ? serverTimestamp() : Timestamp.fromDate(messageDate);

            const encryptedMessage = await encryptTurn(message);

            const messageData = {
                ...encryptedMessage,
                createdAt: originalTimestamp
            };
            delete messageData.isoTimestamp;

            const newMessageRef = doc(messagesRef);
            batch.set(newMessageRef, messageData);
        }
        await batch.commit();
    })().catch(error => {
        console.error(`Non-blocking cloud history update failed for ${chatId}:`, error);
    });
}

async function handleRestoreFromCloud() {
    if (!currentUser) {
        showAlert({
            title: 'Sign In Required',
            message: 'You must be signed in to restore chats from the cloud.'
        });
        return;
    }
    const activeChatId = settings.activeChatId;
    if (!activeChatId) {
        showAlert({
            title: 'No Active Chat',
            message: 'Please select a chat to restore.'
        });
        return;
    }

    const confirmed = await showModal({
        title: 'Restore from Cloud',
        message: 'This will replace the local history for this chat with the latest version from the cloud. Any local-only messages will be lost. Continue?',
        okText: 'Restore',
        okClass: 'bg-blue-600 hover:bg-blue-700',
        showCancel: true
    });
    if (!confirmed) return;

    if (chatListenerUnsubscribe) {
        chatListenerUnsubscribe();
        chatListenerUnsubscribe = null;
    }

    addSystemMessage('Restoring chat from cloud...');

    try {
        const collectionPath = `users/${currentUser.uid}/chatHistory/${activeChatId}/messages`;
        const messagesRef = collection(db, collectionPath);
        const q = query(messagesRef, orderBy("createdAt"));
        const querySnapshot = await getDocs(q);

        const cloudHistory = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const decryptedData = await decryptTurn(data);
            const date = data.createdAt?.toDate() || new Date();
            return {
                ...decryptedData,
                firestoreId: doc.id,
                isoTimestamp: date.toISOString(),
                timestamp: date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        }));

        chatHistory = cloudHistory;
        const encryptedHistory = await Promise.all(cloudHistory.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(activeChatId), JSON.stringify(encryptedHistory));

        renderChatHistory();
        addSystemMessage('Chat history successfully restored from cloud.');

    } catch (error) {
        console.error("Failed to restore from cloud:", error);
        addSystemMessage(`Error: Could not restore chat. ${error.message}`);
    } finally {
        if(isUserPremium) await loadChatHistory();
    }
}

function toggleSidebar(show) {
    sidebar.classList.toggle('-translate-x-full', !show);
    sidebarOverlay.classList.toggle('hidden', !show);
    updateBodyScrollLock();
    if (show) {
        setTimeout(() => {
            if (window.innerWidth > 767) { 
                document.getElementById('character-search-input')?.focus();
            }
        }, 300);
    }
}

function toggleSettingsPanel(show) {
    if (show) {
        populateSettingsPanel();
        updateAccountUI();
    }
    settingsPanel.classList.toggle('translate-x-full', !show);
    settingsOverlay.classList.toggle('hidden', !show);
    updateBodyScrollLock();
}

function createTimestampElement(timestamp) {
    const timestampEl = document.createElement('div');
    timestampEl.className = 'message-timestamp';
    timestampEl.textContent = timestamp;
    return timestampEl;
}

function clearSystemMessages() {
    const systemMessageElements = document.querySelectorAll('.message-container:has(.system-bubble)');
    systemMessageElements.forEach(el => el.remove());
    sessionMessages = [];
}

function addSystemMessage(text) {
    const systemTurn = {
        role: 'System',
        parts: [{
            text: text
        }],
        isoTimestamp: new Date().toISOString()
    };
    sessionMessages.push(systemTurn);
    addMessage(systemTurn);
}

async function deleteMessage(messageId) {
    const confirmed = await showConfirm({
        message: "Are you sure you want to delete this message? This cannot be undone."
    });
    if (!confirmed) return;

    const messageToDelete = chatHistory.find(m => m.isoTimestamp === messageId);
    if (!messageToDelete) return;

    if (currentUser && messageToDelete.firestoreId) {
        const docRef = doc(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`, messageToDelete.firestoreId);
        deleteDoc(docRef).catch(error => {
            console.error("Firestore message delete failed:", error);
            addSystemMessage("Failed to delete message from the cloud.");
        });
        if(!isUserPremium) { // Free users need to update local store as well
             chatHistory = chatHistory.filter(m => m.isoTimestamp !== messageId);
             const encryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
             localStorage.setItem(getChatHistoryKey(), JSON.stringify(encryptedHistory));
             renderChatHistory();
        }
    } else {
        chatHistory = chatHistory.filter(m => m.isoTimestamp !== messageId);
        const encryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(), JSON.stringify(encryptedHistory));
        renderChatHistory();
    }
}

async function handleRegenerate() {
    const lastUserTurnIndex = chatHistory.findLastIndex(turn => turn.role === 'user');
    const lastAiTurnIndex = chatHistory.findLastIndex(turn => turn.role === 'model');

    if (lastUserTurnIndex === -1 || lastAiTurnIndex < lastUserTurnIndex) {
        addSystemMessage("Cannot regenerate. No previous user message found to respond to.");
        return;
    }

    const lastUserTurn = chatHistory[lastUserTurnIndex];
    const lastAiTurn = chatHistory[lastAiTurnIndex];

    chatHistory.splice(lastAiTurnIndex, 1);
    
    const aiMessageEl = document.querySelector(`.message-container[data-id="${lastAiTurn.isoTimestamp}"]`);
    if (aiMessageEl) aiMessageEl.remove();

    if (currentUser && lastAiTurn.firestoreId) {
        const docRef = doc(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`, lastAiTurn.firestoreId);
        await deleteDoc(docRef);
    } else {
        const encryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(), JSON.stringify(encryptedHistory));
    }

    const lastUserMessageText = lastUserTurn.parts.find(p => !p.isImage)?.text || '';
    const lastUserImage = lastUserTurn.parts.find(p => p.isImage)?.text || null;

    await getAiResponse(lastUserMessageText, lastUserImage, null);
}

function enterEditMode(messageContainer, messageId) {
    if (messageContainer.querySelector('.edit-wrapper')) return;

    const turn = chatHistory.find(t => t.isoTimestamp === messageId);
    if (!turn) return;

    const textPart = turn.parts.find(p => !p.isImage && (p.text || p.text === ''));
    if (!textPart) {
        addSystemMessage("This message part cannot be edited.");
        return;
    }
    const originalText = textPart.text;

    const bubble = messageContainer.querySelector('.message-bubble');
    const actions = messageContainer.querySelector('.message-actions-trigger');
    if(bubble) bubble.style.display = 'none';
    if(actions) actions.style.display = 'none';

    const editWrapper = document.createElement('div');
    editWrapper.className = 'edit-wrapper w-full max-w-md lg:max-w-lg';

    const textarea = document.createElement('textarea');
    textarea.className = 'w-full p-2 border border-theme rounded-md bg-input text-input text-sm';
    textarea.value = originalText;
    
    const setHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener('input', setHeight);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-end items-center gap-2 mt-2';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'py-1 px-3 rounded-md bg-gray-500 text-white hover:bg-gray-600 text-sm';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => exitEditMode(messageContainer));

    const saveBtn = document.createElement('button');
    saveBtn.className = 'py-1 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => saveMessageEdit(messageContainer, messageId, textarea.value));

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    
    if (turn.role === 'user') {
        const saveAndRegenBtn = document.createElement('button');
        saveAndRegenBtn.className = 'py-1 px-3 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm font-semibold';
        saveAndRegenBtn.innerHTML = '<span class="flex items-center gap-1"><svg data-lucide="sparkles" class="h-3 w-3"></svg> Save & Regenerate</span>';
        saveAndRegenBtn.addEventListener('click', () => saveAndRegenerate(messageContainer, messageId, textarea.value));
        buttonContainer.appendChild(saveAndRegenBtn);
    }

    editWrapper.appendChild(textarea);
    editWrapper.appendChild(buttonContainer);
    messageContainer.appendChild(editWrapper);
    lucide.createIcons();
    setHeight();
    textarea.focus();
}

function exitEditMode(messageContainer) {
    const editWrapper = messageContainer.querySelector('.edit-wrapper');
    if (editWrapper) editWrapper.remove();

    const bubble = messageContainer.querySelector('.message-bubble');
    const actions = messageContainer.querySelector('.message-actions-trigger');
    if(bubble) bubble.style.display = '';
    if(actions) actions.style.display = '';
}

async function saveMessageEdit(messageContainer, messageId, newText) {
    const turnIndex = chatHistory.findIndex(t => t.isoTimestamp === messageId);
    if (turnIndex === -1) return;

    const turn = chatHistory[turnIndex];
    const textPartIndex = turn.parts.findIndex(p => !p.isImage);
    if (textPartIndex === -1) return;

    turn.parts[textPartIndex].text = newText;
    
    const bubble = messageContainer.querySelector('.message-bubble');
    bubble.dataset.text = turn.parts.map(p => p.isImage ? `[Image]` : p.text).join('\n');
    const textElements = bubble.querySelectorAll('div:not(:has(>img)), p, ul, ol, pre');
    textElements.forEach(el => el.remove());
    const newTextEl = document.createElement('div');
    newTextEl.innerHTML = marked.parse(newText);
    bubble.appendChild(newTextEl);

    const encryptedTurn = await encryptTurn(turn);
    if (currentUser && turn.firestoreId) {
        const docRef = doc(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`, turn.firestoreId);
        await updateDoc(docRef, { parts: encryptedTurn.parts });
    } else {
        const fullEncryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(), JSON.stringify(fullEncryptedHistory));
    }

    exitEditMode(messageContainer);
}

async function saveAndRegenerate(messageContainer, messageId, newText) {
    const userTurnIndex = chatHistory.findIndex(t => t.isoTimestamp === messageId);
    if (userTurnIndex === -1) return;
    
    const turn = chatHistory[userTurnIndex];
    const textPartIndex = turn.parts.findIndex(p => !p.isImage);
    if (textPartIndex !== -1) {
        turn.parts[textPartIndex].text = newText;
    }

    const messagesToDelete = chatHistory.slice(userTurnIndex + 1);
    chatHistory = chatHistory.slice(0, userTurnIndex + 1);

    if (currentUser) {
        const batch = writeBatch(db);
        const encryptedTurn = await encryptTurn(turn);
        const editedDocRef = doc(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`, turn.firestoreId);
        batch.update(editedDocRef, { parts: encryptedTurn.parts });

        messagesToDelete.forEach(msg => {
            if (msg.firestoreId) {
                const docRef = doc(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`, msg.firestoreId);
                batch.delete(docRef);
            }
        });
        await batch.commit();
        if(!isUserPremium){
             const fullEncryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
             localStorage.setItem(getChatHistoryKey(), JSON.stringify(fullEncryptedHistory));
             renderChatHistory();
        }
    } else {
        const fullEncryptedHistory = await Promise.all(chatHistory.map(encryptTurn));
        localStorage.setItem(getChatHistoryKey(), JSON.stringify(fullEncryptedHistory));
        renderChatHistory();
    }

    const imageData = turn.parts.find(p => p.isImage)?.text || null;
    await getAiResponse(newText, imageData, null);
}

function showMessageActions(messageContainer) {
    document.querySelectorAll('.message-actions-menu').forEach(menu => menu.remove());

    const messageId = messageContainer.dataset.id;
    const turn = chatHistory.find(t => t.isoTimestamp === messageId);
    if (!turn || turn.role === 'System') return;

    const menu = document.createElement('div');
    menu.className = 'message-actions-menu absolute z-10 bg-sidebar border border-theme rounded-lg shadow-xl p-1 flex flex-col items-start';

    const actions = [];
    
    actions.push({ label: 'Copy', icon: 'copy', action: () => copyMessage(messageContainer, menu) });
    actions.push({ label: 'Edit', icon: 'pencil', action: () => { enterEditMode(messageContainer, turn.isoTimestamp); menu.remove(); } });
    
    if (turn.role === 'model') {
        const hasText = turn.parts.some(p => p.text && !p.isImage && !p.isPrompt);
        if (hasText) {
             actions.push({ label: 'Regenerate', icon: 'refresh-cw', action: () => { handleRegenerate(); menu.remove(); } });
             actions.push({ label: 'Read Aloud', icon: 'volume-2', action: (e) => playAudioMessage(turn, e.currentTarget) });
        }
    }
    
    actions.push({ label: 'Delete', icon: 'trash-2', isDestructive: true, action: () => { deleteMessage(turn.isoTimestamp); menu.remove(); } });


    actions.forEach(({ label, icon, action, isDestructive = false }) => {
        const button = document.createElement('button');
        button.className = 'w-full text-left flex items-center gap-2 p-2 text-sm text-theme hover-theme rounded-md';
        if (isDestructive) button.classList.add('text-red-500');
        button.innerHTML = `<svg data-lucide="${icon}" class="h-4 w-4"></svg><span>${label}</span>`;
        button.onclick = (e) => {
            e.stopPropagation();
            action(e);
        };
        menu.appendChild(button);
    });

    document.body.appendChild(menu);
    lucide.createIcons();

    const triggerButton = messageContainer.querySelector('.message-actions-trigger button');
    if (!triggerButton) {
        console.warn("Could not find trigger button to position menu.");
        menu.remove();
        return;
    }

    const triggerRect = triggerButton.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect(); 
    const isUser = messageContainer.classList.contains('items-end');
    const gap = 4;

    let top = triggerRect.top + window.scrollY;

    if (top + menuRect.height > window.innerHeight + window.scrollY - gap) {
        top = window.innerHeight + window.scrollY - menuRect.height - gap;
    }
    if (top < window.scrollY + gap) {
        top = window.scrollY + gap;
    }
    menu.style.top = `${top}px`;

    if (isUser) {
        menu.style.left = `${triggerRect.left - menuRect.width - gap}px`;
        menu.style.right = 'auto';
    } else {
        menu.style.left = `${triggerRect.right + gap}px`;
        menu.style.right = 'auto';
    }

    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
}

function copyMessage(messageContainer, menu) {
    const textToCopy = messageContainer.querySelector('.message-bubble').dataset.text;
    navigator.clipboard.writeText(textToCopy);
    const copyButton = Array.from(menu.querySelectorAll('button')).find(b => b.textContent.includes('Copy'));
    if (copyButton) {
        copyButton.innerHTML = `<svg data-lucide="check" class="h-4 w-4 text-green-500"></svg><span>Copied!</span>`;
        lucide.createIcons();
    }
    setTimeout(() => {
        menu.remove();
    }, 1000);
}

function addMessage(turn, options = {}) {
    const { isStreaming = false, isHistoryRender = false } = options;
    const activeChat = chats.find(c => c.id === settings.activeChatId);

    // --- ADVENTURE MODE UI RENDERER ---
    if (activeChat && activeChat.type === 'adventure') {
        if (turn.role === 'user') {
            const choiceEl = document.createElement('div');
            choiceEl.className = 'adventure-player-choice';
            choiceEl.innerHTML = marked.parse(turn.parts[0].text || '');
            messageArea.appendChild(choiceEl);
        } else if (turn.role === 'model' || turn.role === 'ai') {
            let rawText = turn.parts.map(p => p.text || '').join('\n');
            
            const sceneEl = document.createElement('div');
            sceneEl.className = 'adventure-scene';
            
            if (rawText.includes('[THE END]')) {
                rawText = rawText.replace('[THE END]', '').trim();
                messageForm.classList.add('hidden');
                const endText = document.createElement('div');
                endText.className = 'adventure-end-text';
                endText.textContent = '--- THE END ---';
                setTimeout(() => messageArea.appendChild(endText), 100);
            }

            const choicesMatch = rawText.match(/\[CHOICES\]([\s\S]*?)\[\/CHOICES\]/);
            
            // This is the critical change: Only render choice buttons if it's a "live" message, not a historical one.
            if (choicesMatch && !isHistoryRender) {
                messageForm.classList.add('hidden');
                
                const choicesText = choicesMatch[1];
                const choices = choicesText.split('\n').map(c => c.trim()).filter(c => c.length > 0 && /^\d\./.test(c));

                if (choices.length > 0) {
                    const choicesContainer = document.createElement('div');
                    choicesContainer.className = 'adventure-choices-container';
                    choices.forEach(choiceString => {
                        const button = document.createElement('button');
                        button.className = 'adventure-choice-button';
                        button.textContent = choiceString.replace(/^\d\.\s*/, '');
                        button.addEventListener('click', () => {
                            handleAdventureChoice(choiceString);
                            choicesContainer.remove();
                        });
                        choicesContainer.appendChild(button);
                    });
                    setTimeout(() => messageArea.appendChild(choicesContainer), 100);
                }
            }

            // Always remove the choice block from the displayed text.
            rawText = rawText.replace(/\[CHOICES\][\s\S]*?\[\/CHOICES\]/, '').trim();

            sceneEl.innerHTML = marked.parse(rawText);
            messageArea.appendChild(sceneEl);
        }
        scrollToBottom();
        return; // End execution here for adventure mode
    }

    // --- DEFAULT BUBBLE CHAT UI RENDERER ---
    const sender = turn.role === 'user' ? 'user' : (turn.role === 'ai' || turn.role === 'model' ? 'ai' : 'System');
    if (!turn.parts || turn.parts.length === 0) return;

    const timestamp = turn.isoTimestamp ? new Date(turn.isoTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    let characterForBubble = chats.find(c => c.id === settings.activeChatId);
    const isGroupAiMessage = characterForBubble && characterForBubble.isCharacter === false && sender === 'ai';

    if (isGroupAiMessage) {
        const fullMessageText = turn.parts.map(p => p.text).join(' ');
        const match = fullMessageText.match(/^(.+?):\s/);
        if (match) {
            const characterName = match[1];
            const foundChar = chats.find(c => c.name === characterName && characterForBubble.participantIds.includes(c.id));
            if (foundChar) {
                characterForBubble = foundChar;
            }
        }
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container relative flex flex-col mb-2 ${sender === 'user' || sender === 'System' ? 'items-end' : 'items-start'}`;
    messageContainer.dataset.id = turn.isoTimestamp;

    if (isGroupAiMessage) {
        messageContainer.classList.add('group-ai-message');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex items-end gap-2 max-w-full overflow-hidden group';

    const actionsButtonContainer = document.createElement('div');
    actionsButtonContainer.className = 'message-actions-trigger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center';
    const actionsButton = document.createElement('button');
    actionsButton.className = 'p-1 rounded-full hover-theme';
    actionsButton.innerHTML = `<svg data-lucide="more-horizontal" class="h-4 w-4 icon-theme"></svg>`;
    actionsButtonContainer.appendChild(actionsButton);

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', 'max-w-md', 'lg:max-w-lg', 'rounded-2xl', 'w-fit', 'break-words', 'cursor-pointer');
    bubble.dataset.text = turn.parts.filter(p => !p.isPrompt).map(p => p.isImage ? `[Image]` : p.text).join('\n');
    
    if (isStreaming) {
        bubble.id = `message-bubble-${turn.isoTimestamp}`;
    }

    const hasImage = turn.parts.some(p => p.isImage);

    if (!hasImage) {
        bubble.classList.add('p-3');
    }

    turn.parts.forEach(part => {
        if (part.isImage) {
            const imgContainer = document.createElement('div');
            const img = document.createElement('img');
            img.src = part.text;
            imgContainer.appendChild(img);
            bubble.appendChild(imgContainer);
        } else if (part.isPrompt) {
            const promptWrapper = document.createElement('div');
            promptWrapper.className = 'mt-2 text-xs p-3';
            const showPromptBtn = document.createElement('button');
            showPromptBtn.className = 'font-semibold text-blue-500 hover:underline';
            showPromptBtn.textContent = 'Show Prompt';
            const promptText = document.createElement('div');
            promptText.className = 'italic opacity-70 mt-1 hidden';
            promptText.textContent = `Prompt: "${part.text}"`;
            showPromptBtn.onclick = () => {
                const isHidden = promptText.classList.toggle('hidden');
                showPromptBtn.textContent = isHidden ? 'Show Prompt' : 'Hide Prompt';
            };
            promptWrapper.appendChild(showPromptBtn);
            promptWrapper.appendChild(promptText);
            bubble.appendChild(promptWrapper);
        } else if (part.text || isStreaming) {
            let textToDisplay = part.text || '';
            if (isGroupAiMessage) {
                const match = textToDisplay.match(/^(.+?):\s/);
                if (match && characterForBubble && characterForBubble.name === match[1]) {
                    textToDisplay = textToDisplay.substring(match[0].length).trim();
                }
            }
            const textEl = document.createElement('div');
            
            if (isStreaming) {
                textEl.innerHTML = `
                    <div id="streaming-placeholder-${turn.isoTimestamp}"><em>Generating...</em></div>
                    <div id="streaming-content-${turn.isoTimestamp}" class="hidden">
                        <span id="streaming-text-${turn.isoTimestamp}"></span><span class="blinking-cursor">|</span>
                    </div>
                `;
            } else {
                textEl.innerHTML = marked.parse(textToDisplay);
            }
            
            bubble.appendChild(textEl);
        }
    });

    if (sender === 'user' || sender === 'System') {
        if (hasImage) bubble.classList.add('image-bubble');
        else bubble.classList.add(sender === 'System' ? 'system-bubble' : 'user-bubble');
        bubble.classList.add('rounded-br-lg');
        if (sender === 'System') {
            bubble.classList.add('!cursor-default');
            messageContainer.classList.add('w-full', 'justify-center', 'items-center');
            contentWrapper.classList.add('justify-center');
        } else {
            const userAvatarEl = document.createElement('img');
            userAvatarEl.className = 'user-avatar w-8 h-8 rounded-full object-cover flex-shrink-0';
            userAvatarEl.src = settings.userAvatar || `https://placehold.co/40x40/${settings.darkMode ? '78716c/e7e5e4' : 'a8a29e/f5f5f4'}?text=${(settings.userName || 'U').charAt(0)}`;
            contentWrapper.appendChild(actionsButtonContainer);
            contentWrapper.appendChild(bubble);
            contentWrapper.appendChild(userAvatarEl);
        }
    } else {
        if (hasImage) bubble.classList.add('image-bubble');
        else bubble.classList.add('ai-bubble');
        bubble.classList.add('rounded-bl-lg');

        const aiAvatarEl = document.createElement('img');
        aiAvatarEl.className = 'ai-avatar w-8 h-8 rounded-full object-cover flex-shrink-0';
        const defaultAvatarUrl = `https://placehold.co/40x40/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${(characterForBubble?.name || 'A').charAt(0)}`;
        aiAvatarEl.src = characterForBubble?.avatar || defaultAvatarUrl;

        contentWrapper.appendChild(aiAvatarEl);
        contentWrapper.appendChild(bubble);
        contentWrapper.appendChild(actionsButtonContainer);
    }

    if (sender === 'System') {
        messageContainer.appendChild(bubble);
    } else {
        messageContainer.appendChild(contentWrapper);
    }
    
    if (settings.showTimestamps && timestamp) {
        messageContainer.appendChild(createTimestampElement(timestamp));
    }

    messageArea.appendChild(messageContainer);
    
    if (sender !== 'System') {
        actionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showMessageActions(messageContainer);
        });

        bubble.addEventListener('touchstart', (e) => {
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                showMessageActions(messageContainer);
            }, 500);
        }, { passive: true });

        bubble.addEventListener('touchend', () => clearTimeout(longPressTimer));
        bubble.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    }
    
    lucide.createIcons();
    scrollToBottom();
}

async function handleAdventureChoice(choiceText, options = {}) {
    const { isStart = false, isContinuation = false } = options;

    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (activeChat) {
        activeChat.lastActivity = Date.now();
        sortAndRenderChats();
        if (isUserPremium) saveChatToFirestore(activeChat);
    }

    const now = new Date();
    const isoTimestamp = now.toISOString();

    const userTurnForHistory = {
        role: 'user',
        parts: [{ text: choiceText, isImage: false }],
        isoTimestamp
    };

    // *** THIS IS THE KEY FIX ***
    // Only add the user's choice to the UI if it's not a hidden "start" or "continue" command.
    if (!isStart && !isContinuation) {
        if (currentUser && !isUserPremium) {
            chatHistory.push(userTurnForHistory);
        }
        addMessage(userTurnForHistory);
    }
    
    // Save to backend/local storage regardless
    if (currentUser) {
        try {
            const encryptedTurn = await encryptTurn(userTurnForHistory);
            const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`);
            await addDoc(messagesRef, { ...encryptedTurn, createdAt: serverTimestamp() });
             if (!isUserPremium) {
                saveMessageLocally(userTurnForHistory);
            }
        } catch (error) {
            showAlert({ title: "Send Failed", message: "Failed to send your choice. Please try again." });
            return;
        }
    } else {
        saveMessageLocally(userTurnForHistory);
        if (!isUserPremium) {
             chatHistory.push(userTurnForHistory);
        }
    }
    
    await getAiResponse(choiceText, null, null);
}

async function callApiThroughProxy(provider, payload) {
    if (!isUserPremium) {
        settings.useSecureProxy = false;
        secureProxySwitch.checked = false;
        saveSettingsToLocalStorage();
        throw new Error("The secure API proxy is a Premium feature. Please subscribe to use it, or disable it in Settings.");
    }
    
    const proxyUrl = SECURE_API_PROXY_URL;

    if (!currentUser) {
        throw new Error("You must be signed in to use the secure proxy.");
    }

    try {
        const token = await currentUser.getIdToken(true);

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                provider,
                payload
            })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Proxy Error: ${response.status}`);
        }
        
        if (payload.stream) {
            return response.body.getReader();
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error(`Error calling secure BYOK proxy for ${provider}:`, error);
        throw error;
    }
}

async function callGeminiAPI(payload, isStreaming, model) {
    const apiKeyInfo = settings.apiKeys[0];
    if (!apiKeyInfo || !apiKeyInfo.key) {
        throw new Error("No valid Gemini API key found. Please add one in Settings.");
    }

    const selectedModel = model || payload.model || settings.selectedModel || 'gemini-2.5-flash';
    const apiVersion = 'v1beta';

    const action = isStreaming ? 'streamGenerateContent' : 'generateContent';
    const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${selectedModel}:${action}?key=${apiKeyInfo.key}`;

    const apiPayload = { ...payload };
    delete apiPayload.stream;

    apiKeyInfo.count++;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        if (isStreaming) {
            return response.body.getReader();
        }
        return await response.json();

    } catch (error) {
        console.error(`Direct Gemini API call failed with model ${selectedModel}:`, error);
        throw error;
    }
}

async function callGroqAPI(payload) {
    const apiKey = settings.groqApiKey;
    if (!apiKey) throw new Error("Groq API key is not set in Settings.");
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    if (payload.stream) {
        return response.body.getReader();
    }
    return await response.json();
}

async function callOpenRouterAPI(payload) {
    const apiKey = settings.openRouterApiKey;
    if (!apiKey) throw new Error("OpenRouter API key is not set in Settings.");
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://idolon.chat',
            'X-Title': 'Idolon Chat'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    if (payload.stream) {
        return response.body.getReader();
    }
    return await response.json();
}

async function callElectronHubAPI(payload) {
    const apiKey = settings.electronhubApiKey;
    if (!apiKey) throw new Error("Electron Hub API key is not set in Settings.");
    
    const apiUrl = 'https://api.electronhub.ai/v1/chat/completions/'; 

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    if (payload.stream) {
        return response.body.getReader();
    }
    return await response.json();
}

async function callCerebrasAPI(payload) {
    const apiKey = settings.cerebrasApiKey;
    if (!apiKey) throw new Error("Cerebras API key is not set in Settings.");
    const apiUrl = 'https://api.cerebras.ai/v1/chat/completions';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload) 
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    if (payload.stream) {
        return response.body.getReader();
    }
    return await response.json();
}

async function assignVoice(persona) {
    const ttsVoices = {
        female: {
            "Zephyr": ["bright", "friendly", "happy", "cheerful", "casual", "relaxed", "easy-going"],
            "Kore": ["firm", "serious", "formal", "authoritative", "mature"],
            "Vindemiatrix": ["gentle", "soft", "warm", "kind", "affectionate", "lovely", "soothing"],
            "Leda": ["youthful", "young", "energetic", "upbeat", "lively"],
            "Enceladus": ["breathy", "soft", "sultry", "intimate"],
            "Erinome": ["clear", "informative", "neutral", "professional"]
        },
        male: {
            "Orus": ["firm", "mature", "formal", "serious", "authoritative", "deep"],
            "Umbriel": ["easy-going", "casual", "relaxed", "friendly", "approachable"],
            "Achird": ["friendly", "casual", "warm", "approachable"],
            "Puck": ["upbeat", "youthful", "energetic", "friendly", "lively"],
            "Algenib": ["gravelly", "deep", "mature", "gruff"],
            "Sadaltager": ["knowledgeable", "informative", "professorial", "clear", "neutral"]
        }
    };

    const lowerCasePersona = persona.toLowerCase();
    let gender = null;
    let voicePool = null;

    const explicitGender = extractFromPersona(persona, 'Gender')?.toLowerCase();
    if (explicitGender === 'male') {
        gender = 'male';
        voicePool = ttsVoices.male;
    } else if (explicitGender === 'female') {
        gender = 'female';
        voicePool = ttsVoices.female;
    }

    if (!gender) {
        if (/\b(he|him|his|male|man|boy|guy)\b/i.test(lowerCasePersona)) {
            gender = 'male';
            voicePool = ttsVoices.male;
        } else if (/\b(she|her|hers|female|woman|girl|lady)\b/i.test(lowerCasePersona)) {
            gender = 'female';
            voicePool = ttsVoices.female;
        }
    }
    
    if (!voicePool) {
        const allVoices = [...Object.keys(ttsVoices.female), ...Object.keys(ttsVoices.male)];
        return allVoices[Math.floor(Math.random() * allVoices.length)];
    }

    let scores = {};
    for (const voiceName in voicePool) {
        scores[voiceName] = 0;
        const characteristics = voicePool[voiceName];
        for (const keyword of characteristics) {
            if (lowerCasePersona.includes(keyword)) {
                scores[voiceName]++;
            }
        }
    }

    let bestScore = -1;
    let bestVoices = [];

    for (const voiceName in scores) {
        if (scores[voiceName] > bestScore) {
            bestScore = scores[voiceName];
            bestVoices = [voiceName];
        } else if (scores[voiceName] === bestScore) {
            bestVoices.push(voiceName);
        }
    }
    
    if (bestScore > 0 && bestVoices.length > 0) {
        return bestVoices[Math.floor(Math.random() * bestVoices.length)];
    } else {
        if (gender === 'male') return 'Achird';
        if (gender === 'female') return 'Zephyr';
    }
    
    return 'Zephyr';
}


async function playAudioMessage(turn, buttonElement) {
    const textToSpeak = turn.parts.map(p => p.text).join(' ');
    const character = chats.find(c => c.id === settings.activeChatId);

    buttonElement.disabled = true;
    buttonElement.innerHTML = `<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Reading...</span>`;
    lucide.createIcons();
    
    try {
        const chosenVoice = character?.voice || 'Zephyr';
        const ttsPayload = {
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: chosenVoice } } }
            },
        };

        let result;
        if (settings.useSecureProxy) {
            if (!currentUser) throw new Error("You must be signed in to use the secure proxy for Text-to-Speech.");
            result = await callApiThroughProxy('gemini', ttsPayload);
        } else {
            result = await callGeminiAPI(ttsPayload);
        }

        const part = result?.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            const { audioData, mimeType } = { audioData: part.inlineData.data, mimeType: part.inlineData.mimeType };
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            if (!sampleRateMatch) throw new Error("Could not determine sample rate.");
            
            const sampleRate = parseInt(sampleRateMatch[1], 10);
            const pcmBuffer = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmBuffer);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            const audio = new Audio(audioUrl);

            audio.play();
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                buttonElement.disabled = false;
                buttonElement.innerHTML = `<svg data-lucide="volume-2" class="h-4 w-4"></svg><span>Read Aloud</span>`;
                lucide.createIcons();
            };
            audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl);
                throw new Error("Error playing the generated audio.");
            }
        } else {
            throw new Error("Invalid or missing audio data in API response.");
        }

    } catch (error) {
        console.error("Failed to play audio message:", error);
        showAlert({ title: "Audio Failed", message: error.message });
        buttonElement.disabled = false;
        buttonElement.innerHTML = `<svg data-lucide="volume-x" class="h-4 w-4"></svg><span>Read Aloud</span>`;
        lucide.createIcons();
    }
}

async function handleImageGeneration(userMessage, directPrompt = null) {
    if (!currentUser && settings.useSecureProxy) {
        showAlert({
            title: 'Sign In Required',
            message: 'You must be signed in to generate images with the secure proxy.'
        });
        return false;
    }

    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (activeChat) {
        const loaderAvatar = document.getElementById('image-loader-avatar');
        loaderAvatar.src = activeChat.avatar || `https://placehold.co/40x40/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${(activeChat.name || 'A').charAt(0)}`;
    }
    imageGenerationLoader.classList.remove('hidden');
    scrollToBottom();

    try {
        let imagePrompt;
        if (directPrompt) {
            imagePrompt = directPrompt;
        } else {
            const recentHistory = chatHistory.slice(-10).map(turn => `${turn.role}: ${turn.parts.map(p => p.text).join(' ')}`).join('\n');
            const promptForDescription = `
You are a prompt engineer for an image generation model. The final image should be a realistic photo taken with a 35mm lens.
**Character Persona:**
${activeChat.persona}
**Recent Conversation:**
${recentHistory}
**User's Request:**
"${userMessage}"
Based on all this information, create a single, descriptive prompt for an image generation model.`;

            const descriptionPayload = {
                model: settings.selectedModel,
                contents: [{
                    parts: [{
                        text: promptForDescription
                    }]
                }]
            };

            let descriptionResult;
            if (settings.useSecureProxy) {
                descriptionResult = await callApiThroughProxy('gemini', descriptionPayload);
            } else {
                descriptionResult = await callGeminiAPI(descriptionPayload);
            }
            imagePrompt = descriptionResult.candidates[0].content.parts[0].text.trim();
        }

        const imagePayload = {
            model: 'gemini-2.0-flash-preview-image-generation',
            contents: [{
                parts: [{
                    text: imagePrompt
                }]
            }],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
            }
        };

        let imageResult;
        if (settings.useSecureProxy) {
            imageResult = await callApiThroughProxy('gemini', imagePayload);
        } else {
            imageResult = await callGeminiAPI(imagePayload);
        }

        const imagePart = imageResult.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (imagePart) {
            const base64Data = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType;
            const imageUrl = `data:${mimeType};base64,${base64Data}`;

            const imageTurnParts = [{
                text: imageUrl,
                isImage: true
            }];
            if (!directPrompt) {
                imageTurnParts.push({
                    text: imagePrompt,
                    isPrompt: true
                });
            }

            const imageTurn = {
                role: 'model',
                parts: imageTurnParts,
                isoTimestamp: new Date().toISOString()
            };

            if (currentUser) {
                const encryptedTurn = await encryptTurn(imageTurn);
                const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`);
                await addDoc(messagesRef, { ...encryptedTurn,
                    createdAt: serverTimestamp()
                });
            } else {
                chatHistory.push(imageTurn);
                addMessage(imageTurn);
                saveMessageLocally(imageTurn);
            }

            return true;

        } else {
            const textPart = imageResult.candidates?.[0]?.content?.parts?.[0]?.text;
            throw new Error(textPart || "Image generation failed or returned no image data.");
        }
    } catch (error) {
        addSystemMessage(`Image generation failed: ${error.message}`);
        return false;
    } finally {
        imageGenerationLoader.classList.add('hidden');
    }
}

async function generateImagePromptFromPersona() {
    if (!currentUser && settings.useSecureProxy) {
        await showAlert({
            title: 'Sign In Required',
            message: 'You must be signed in to use this feature with the secure proxy.'
        });
        return;
    }
    const currentPersona = charPersonaInput.value.trim();
    if (!currentPersona) {
        showAlert({
            title: 'Input Required',
            message: 'Please enter some persona details before generating an image prompt.'
        });
        return;
    }

    generateImagePromptButton.disabled = true;
    generateImagePromptButton.innerHTML = `<svg class="animate-spin h-4 w-4 icon-theme" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    const prompt = `Based on the following character description, generate a line of text for an image generation model.
            **Character Description:**
            "${currentPersona}"
            **Your Task:**
            Generate a single line of text starting with "Image Generation Prompt:", followed by a comma-separated list of visual details for a realistic 35mm photo of the character in their environment.
            **IMPORTANT RULE:** Your entire response must ONLY contain the "Image Generation Prompt:" line. Do not add any greetings, explanations, or other text.`;

    try {
        const payload = {
            model: settings.selectedModel,
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        let result;
        if (settings.useSecureProxy) {
            result = await callApiThroughProxy('gemini', payload);
        } else {
            result = await callGeminiAPI(payload);
        }

        const newText = result.candidates?.[0]?.content?.parts?.[0]?.text.trim();

        if (newText && newText.startsWith("Image Generation Prompt:")) {
            const existingText = charPersonaInput.value;
            const cleanedText = existingText.replace(/\n\n?Image Generation Prompt:.*$/s, '');
            charPersonaInput.value = cleanedText + (cleanedText ? "\n\n" : "") + newText;
        } else {
            throw new Error("Failed to get a valid image prompt from the AI.");
        }
    } catch (error) {
        showAlert({
            title: "Generation Failed",
            message: error.message
        });
    } finally {
        generateImagePromptButton.disabled = false;
        generateImagePromptButton.innerHTML = `<svg data-lucide="wand-2" class="h-4 w-4 icon-theme"></svg>`;
        lucide.createIcons();
    }
}

async function enhancePersona() {
    if (!currentUser && settings.useSecureProxy) {
        await showAlert({
            title: 'Sign In Required',
            message: 'You must be signed in to use this feature with the secure proxy.'
        });
        return;
    }

    const name = charNameInput.value.trim();
    const details = charPersonaInput.value.trim();
    const language = charLanguageInput.value.trim() || 'English';
    const type = charTypeSelect.value;

    if (!name && !details) {
        showAlert({
            title: 'Input Required',
            message: 'Please provide an initial name idea or some persona details before enhancing.'
        });
        return;
    }

    enhancePersonaButton.disabled = true;
    enhancePersonaButton.innerHTML = `<svg class="animate-spin h-4 w-4 icon-theme" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    let prompt;
    if (type === 'assistant') {
        prompt = `You are an expert at creating core concepts for AI assistants. Based on the user's input, generate a single, concise sentence that defines the assistant's primary role and personality.
                    **User Input:** Name: "${name}", Details: "${details}"
                    **Your Task:** Generate a single sentence defining the assistant's core function. Your response must ONLY contain this sentence.`;
    } else {
        prompt = `You are an expert character designer specializing in creating detailed and realistic character profiles for chat and roleplay. Based on the user's input, generate a complete character profile.
        
**User's Input:**
Name Idea: "${name}"
Initial Details: "${details}"
Language: "${language}"
        
**Your Task:**
Generate the following character profile. Each field must be on a new line, formatted as "Key: Value".
        
Full Name: (CRITICAL: Use the user's "Name Idea" as the first name. If the user provided only a first name, generate a fitting surname to append. If the user provided a full name, use it directly without changes.)
Age: (Generate a realistic age.)
Gender: (Generate the character's gender. CRITICAL: Must be either Male or Female.)
Role: (e.g., Girlfriend, Best Friend, Rival, Mentor. Keep it short and relevant to the user.)
Profession:
Location: (e.g., a city and country)
Characteristics: (A short paragraph describing their core personality, temperament, likes, and dislikes.)
Texting Style: (A very short, direct description of their texting habits. e.g., "Uses a lot of emojis and slang," or "Formal, with perfect grammar and no abbreviations.")
         
**IMPORTANT RULE:** Your entire response MUST ONLY contain the profile fields listed above. Do not add any greetings, explanations, or extra text.`;
    }

    try {
        const payload = {
            model: settings.selectedModel,
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        let result;
        if (settings.useSecureProxy) {
            result = await callApiThroughProxy('gemini', payload);
        } else {
            result = await callGeminiAPI(payload);
        }

        const newText = result.candidates?.[0]?.content?.parts?.[0]?.text.trim();

        if (newText) {
            if (type !== 'assistant') {
                const fullName = extractFromPersona(newText, 'Full Name');
                if (fullName) {
                    charNameInput.value = fullName;
                }
            }
            charPersonaInput.value = newText;
        } else {
            throw new Error("Failed to get a valid response from the AI.");
        }
    } catch (error) {
        showAlert({
            title: "Enhancement Failed",
            message: error.message
        });
    } finally {
        enhancePersonaButton.disabled = false;
        enhancePersonaButton.innerHTML = `<svg data-lucide="sparkles" class="h-4 w-4 icon-theme"></svg>`;
        lucide.createIcons();
    }
}

function extractTaggedContent(text, tagName) {
    const regex = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

async function enhanceScenario() {
    const scenarioInput = document.getElementById('char-scenario-input');
    const scenarioText = scenarioInput.value.trim();

    if (!scenarioText) {
        showAlert({
            title: 'Input Required',
            message: 'Please provide a scenario summary before enhancing.'
        });
        return;
    }

    const enhanceButton = document.getElementById('enhance-scenario-button');
    enhanceButton.disabled = true;
    enhanceButton.innerHTML = `<svg class="animate-spin h-4 w-4 icon-theme" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    const prompt = `You are a creative writer and expert character designer. Based on the following scenario summary, generate a complete and compelling roleplay profile.

**Scenario Summary:**
"${scenarioText}"

**Your Task:**
Generate the content for each of the following fields, enclosed in the specified XML-style tags. Do NOT add any text or explanation outside of these tags.

1.  **[SCENARIO]...[/SCENARIO]**: An enhanced, one-paragraph version of the user's scenario summary. Make it more descriptive and evocative.
2.  **[AI_NAME]...[/AI_NAME]**: A fitting first and last name for the main AI character.
3.  **[AI_PERSONA]...[/AI_PERSONA]**: A detailed character profile including their name, age, gender, role (e.g., detective, starship captain), profession, location, and a paragraph describing their core personality, temperament, and motivations.
4.  **[USER_PERSONA]...[/USER_PERSONA]**: A concise, one-sentence description of the user's likely role in this scenario.
5.  **[FIRST_MESSAGE]...[/FIRST_MESSAGE]**: A compelling, immersive opening paragraph to start the story. It must set the scene and give the user a clear hook to respond to. Use italics (*...*) for actions and descriptions.
6.  **[EXAMPLE_DIALOGUE]...[/EXAMPLE_DIALOGUE]**: A short but representative exchange between the User and the AI to demonstrate the character's speaking style and the required formatting (*actions* "dialogue").

Example Output Structure:
[SCENARIO]In the rain-slicked, noir-drenched streets of a 1940s city, a world-weary private detective takes on a case that's more than it seems...[/SCENARIO]
[AI_NAME]Jack Harding[/AI_NAME]
[AI_PERSONA]Name: Jack Harding...[/AI_PERSONA]
[USER_PERSONA]You are a mysterious client...[/USER_PERSONA]
[FIRST_MESSAGE]*The city was drowning in rain...*[/FIRST_MESSAGE]
[EXAMPLE_DIALOGUE]User: I need your help.\nAI: *He took a long drag from his cigarette.* "Help is expensive. What's the job?"[/EXAMPLE_DIALOGUE]`;

    try {
        const payload = {
            model: settings.selectedModel,
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        let result;
        if (settings.useSecureProxy) {
            if (!currentUser) throw new Error("You must be signed in to use this feature with the secure proxy.");
            result = await callApiThroughProxy('gemini', payload);
        } else {
            result = await callGeminiAPI(payload);
        }

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error("The AI returned an empty response.");
        }

        const enhancedScenario = extractTaggedContent(responseText, 'SCENARIO');
        const aiName = extractTaggedContent(responseText, 'AI_NAME');
        const aiPersona = extractTaggedContent(responseText, 'AI_PERSONA');
        const userPersona = extractTaggedContent(responseText, 'USER_PERSONA');
        const firstMessage = extractTaggedContent(responseText, 'FIRST_MESSAGE');
        const exampleDialogue = extractTaggedContent(responseText, 'EXAMPLE_DIALOGUE');

        if (enhancedScenario) scenarioInput.value = enhancedScenario;
        if (aiName) document.getElementById('char-name-input').value = aiName;
        if (aiPersona) document.getElementById('char-persona-input').value = aiPersona;
        if (userPersona) document.getElementById('char-user-persona-input').value = userPersona;
        if (firstMessage) document.getElementById('char-first-message-input').value = firstMessage;
        if (exampleDialogue) document.getElementById('char-example-dialogue-input').value = exampleDialogue;

    } catch (error) {
        showAlert({
            title: "Enhancement Failed",
            message: error.message
        });
    } finally {
        enhanceButton.disabled = false;
        enhanceButton.innerHTML = `<svg data-lucide="sparkles" class="h-4 w-4 icon-theme"></svg>`;
        lucide.createIcons();
    }
}

async function analyzeImageForPersona() {
    if (!currentUser && settings.useSecureProxy) {
        await showAlert({
            title: 'Sign In Required',
            message: 'You must be signed in to analyze images with the secure proxy.'
        });
        return;
    }
    if (!tempCharAvatarData) {
        showAlert({
            title: 'Image Required',
            message: 'Please upload an image first.'
        });
        return;
    }

    analyzeImageButton.disabled = true;
    analyzeImageButton.innerHTML = `<svg class="animate-spin h-4 w-4 icon-theme" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    const base64Data = tempCharAvatarData.split(',')[1];
    const mimeType = tempCharAvatarData.match(/:(.*?);/)[1];

    const prompt = `You are an expert prompt engineer. Analyze the provided image of a person. Your task is to describe their appearance and the scene in detail, creating a prompt suitable for another AI image generation model to recreate a similar image. The prompt should be a comma-separated list of visual details. Respond with ONLY this descriptive prompt, and do not add any extra text, greetings, or explanations.`;

    const payload = {
        model: 'gemini-2.5-flash',
        contents: [{
            parts: [{
                text: prompt
            }, {
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            }]
        }]
    };

    try {
        let result;
        if (settings.useSecureProxy) {
            result = await callApiThroughProxy('gemini', payload);
        } else {
            result = await callGeminiAPI(payload);
        }

        const candidate = result.candidates?.[0];
        if (candidate && candidate.content.parts) {
            const imagePromptText = candidate.content.parts[0].text.trim();
            const formattedPrompt = `Image Generation Prompt: ${imagePromptText}`;

            const existingText = charPersonaInput.value;
            const cleanedText = existingText.replace(/\n\n?Image Generation Prompt:.*$/s, '');

            charPersonaInput.value = cleanedText + (cleanedText ? "\n\n" : "") + formattedPrompt;

        } else {
            throw new Error("Failed to get a valid description from the AI.");
        }
    } catch (error) {
        showAlert({
            title: "Image Analysis Failed",
            message: error.message
        });
    } finally {
        analyzeImageButton.disabled = false;
        analyzeImageButton.innerHTML = `<svg data-lucide="scan-face" class="h-4 w-4 icon-theme"></svg>`;
        lucide.createIcons();
    }
}

async function buildApiPayload(currentChatHistory, userMessage = '', guidance = null, imageDataUrl = null) {
    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (!activeChat) return null;

    const nsfwInstruction = settings.nsfwAllowed ? "" : "Safety is your top priority. You must refuse to generate any content that is sexually explicit, violent, hateful, promotes self-harm, or is illegal. Politely decline any such request.";
    const languageInstruction = activeChat.language ? `You must respond in ${activeChat.language}.` : '';
    let timeInstruction = '';
    if (settings.timeSource === 'device') {
        timeInstruction = `The user's current local date and time is ${new Date().toString()}. You should only mention the time if the user explicitly asks for it or if it is directly relevant to the conversation.`;
    }
    let personaInstructionText = '';
    if (activeChat.isCharacter === false && activeChat.participantIds.length > 1) {
        const participants = activeChat.participantIds.map(id => chats.find(c => c.id === id)).filter(Boolean);
        let participantPrompts = (await Promise.all(participants.map(async p => `- ${p.name}: ${p.persona}`))).join('\n');

        personaInstructionText = `You are a chat moderator for a group conversation. Your job is to generate responses for the AI characters in the group. The participants are:\n${participantPrompts}\n`;
        if (activeChat.userPersona) {
            personaInstructionText += `The user is also participating, and their role is: "${activeChat.userPersona}".\n`;
        }

        if (activeChat.type === 'roleplay') {
            personaInstructionText += `\n**STYLE RULE:** This is a dialogue-only roleplay. Your response MUST NOT contain any narration, actions, or descriptions in asterisks (*...*). You must ONLY generate the spoken dialogue for the character. For example, instead of "Byte: *He sighs.* It's a simulation.", you must only write "Byte: It's a simulation.".`;
        }

        let mentionInstruction = '';
        const mentionMatch = userMessage.match(/@(\w+)/);
        if (mentionMatch) {
            const mentionedName = mentionMatch[1];
            const mentionedParticipant = participants.find(p => p.name.toLowerCase().startsWith(mentionedName.toLowerCase()));
            if (mentionedParticipant) {
                mentionInstruction = `\n**IMPORTANT:** The user has directly addressed '@${mentionedParticipant.name}'. You MUST ensure that ONLY ${mentionedParticipant.name} responds to this message.`;
            }
        } else {
            mentionInstruction = `\n**IMPORTANT:** Based on the conversation, determine which single character should respond. Only one character should reply.`;
        }

        personaInstructionText += `When a character speaks, you MUST prefix each character's response with their name followed by a colon. For example: '${participants.length > 0 ? participants[0].name : 'Character'}: [response]'. ${mentionInstruction} ${nsfwInstruction} ${languageInstruction}`;
    } else {
        const charType = activeChat.type || 'messaging';
        switch (charType) {
            case 'assistant':
                personaInstructionText = `You are a helpful, multi-talented assistant. Your primary instruction is: "${activeChat.persona}". Fulfill user requests accurately and efficiently. ${timeInstruction} ${nsfwInstruction} ${languageInstruction}`;
                break;
            case 'adventure': // START: NEW ADVENTURE CASE
                const scenario = activeChat.scenario || 'A mysterious adventure.';
                const userCharacter = activeChat.userPersona || 'A brave adventurer.';
                const gmPersona = activeChat.persona || 'A descriptive and engaging Game Master.';

                personaInstructionText = `You are an expert, text-based Adventure Game Master. Your goal is to create an immersive, interactive story. Adhere to the following rules at all times:

1.  **Your Persona:** Act as the Game Master (GM) as described here: "${gmPersona}".

2.  **The Player's Character:** The user is the player. Their character profile is: "${userCharacter}".

3.  **The Scenario:** The setting and goal of this adventure is: "${scenario}".

4.  **Core Gameplay Loop (CRITICAL):**
    *   Describe the scene, events, and what non-player characters (NPCs) do and say. Use *italics for narration and descriptive text*.
    *   Your response MUST ALWAYS end with four numbered choices for the player to choose from.
    *   Enclose these four choices in special tags: [CHOICES] and [/CHOICES]. Each choice must be on a new line and start with a number and a period (e.g., "1. ").
    *   The choices must be distinct, logical, and offer different paths or outcomes.

5.  **Brevity and Pace (CRITICAL):** Keep your narrative descriptions concise and fast-paced. Aim for 1-2 short paragraphs before presenting the choices. This keeps the game moving and allows the player to make decisions quickly.

6.  **Player Agency:**
    *   NEVER control the player's character. Do not describe their actions, speak for them, or state their feelings. Your descriptions should lead up to the moment they must act.
    *   The player makes their move by selecting one of your provided choices.

7.  **Ending the Game:**
    *   When the story reaches a clear conclusion (whether victory, defeat, or an ambiguous ending), your final response MUST include the tag [THE END] after the concluding text. Do not provide choices in an ending message.

8.  **Example Response Format:**
    *The ancient door groans open, revealing a dusty chamber lit by a single, flickering torch. A stone pedestal stands in the center, and a low growl echoes from the shadows in the corner.*
    [CHOICES]
    1. Examine the pedestal.
    2. Throw your torch into the shadowy corner.
    3. Listen carefully to locate the source of the growl.
    4. Back out of the room slowly.
    [/CHOICES]`;
                break; // END: NEW ADVENTURE CASE
            case 'roleplay':
                 const roleplayScenario = activeChat.scenario || 'A roleplay scenario.';
                const exampleDialogue = activeChat.exampleDialogue;

                let roleplayRules = `You are an expert, collaborative roleplay partner. Your goal is to create an immersive, narrative experience. Adhere to the following rules at all times:

1.  **Embody Your Character:** Your assigned character profile is: "${activeChat.persona}". You must act, speak, and think as this character. The user's role is: "${activeChat.userPersona}".

2.  **Understand the Scene:** The setting and context for this roleplay is: "${roleplayScenario}".

3.  **Strict Formatting:** You MUST follow this format precisely. Narrated actions, thoughts, and descriptions must be in *italics*. Spoken dialogue must be in "quotes".
    *Example: *She looked out the window at the falling snow, a thoughtful expression on her face.* "I wonder if he'll ever return."*

4.  **Collaborative Storytelling:**
    *   **NEVER** control the user's character. Do not describe their actions, speak for them, or state what they are feeling or thinking.
    *   **ALWAYS** advance the plot. Your responses should give the user something to react to. Introduce events, ask questions, or present challenges.
    *   **BE CONCISE:** Keep your responses to 1-3 paragraphs. Focus on quality over quantity.

5.  **Maintain Character Integrity:** NEVER break character. Do not refer to yourself as an AI, a language model, or a roleplay partner. You are your character.`;

                if (exampleDialogue) {
                    roleplayRules += `\n\n6.  **Style Guide:** Here is an example of the writing style you must adopt:\n${exampleDialogue}`;
                }

                personaInstructionText = `${roleplayRules}\n\n${timeInstruction} ${nsfwInstruction} ${languageInstruction}`;
                break;
            case 'messaging':
            default:
                personaInstructionText = `System knowledge: ${timeInstruction} Your persona is: "${activeChat.persona}". Follow this persona. Keep responses conversational, natural, and brief, as if you are in a real text messaging chat. ${nsfwInstruction} ${languageInstruction}`;
                if (activeChat.userPersona) {
                    personaInstructionText += ` The user's persona is: "${activeChat.userPersona}". Interact with them in this role.`;
                }
                break;
        }
    }
    if (guidance) {
        personaInstructionText += `\n\nIMPORTANT ONE-TIME INSTRUCTION FOR THIS RESPONSE: ${guidance}`;
    }
    const historyDepth = settings.chatHistoryDepth;
    let slicedHistory = currentChatHistory;
    if (isFinite(historyDepth) && historyDepth > 0) {
        slicedHistory = currentChatHistory.slice(-historyDepth);
    } else if (historyDepth === 0) {
        slicedHistory = [];
    }
    const historyForApi = slicedHistory
        .filter(turn => turn.role !== 'System' && turn.parts.every(p => p.type !== 'image-loading-indicator'))
        .map(turn => {
            const apiParts = turn.parts.map(part => {
                if (part.isImage) {
                    const [mimeHeader, base64Data] = part.text.split(',');
                    const mimeType = mimeHeader.split(':')[1].split(';')[0];
                    return {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    };
                } else {
                    return {
                        text: part.text
                    };
                }
            }).filter(Boolean);

            return {
                role: turn.role,
                parts: apiParts
            };
        });


    if (['groq', 'openrouter', 'electronhub', 'cerebras'].includes(settings.apiProvider)) {
        const model = (() => {
            switch (settings.apiProvider) {
                case 'groq':
                    return settings.selectedGroqModel === 'custom' ? settings.customGroqModel : settings.selectedGroqModel;
                case 'openrouter':
                    return settings.selectedOpenRouterModel === 'custom' ? settings.customOpenRouterModel : settings.selectedOpenRouterModel;
                case 'electronhub':
                    return settings.selectedElectronhubModel === 'custom' ? settings.customElectronhubModel : settings.selectedElectronhubModel;
                case 'cerebras':
                    return settings.selectedCerebrasModel === 'custom' ? settings.customCerebrasModel : settings.selectedCerebrasModel;
                default:
                    return '';
            }
        })();
			
        const messages = historyForApi.map(turn => ({
            role: turn.role === 'model' ? 'assistant' : turn.role,
            content: turn.parts.map(p => p.text || '[Image cannot be processed by this provider]').join(' ')
        }));
        
        const payload = {
            model: model,
            messages: [{
                role: 'system',
                content: personaInstructionText
            }, ...messages]
        };
        
        if (settings.streamingEnabled) {
            payload.stream = true;
        }

        if (settings.apiProvider === 'cerebras') {
            payload.reasoning_effort = "medium";
        }

        return payload;
    } else { // This is the Gemini block
        const personaInstruction = {
            role: 'user',
            parts: [{
                text: `System instruction: ${personaInstructionText}`
            }]
        };
        const modelInstruction = {
            role: 'model',
            parts: [{
                text: 'Understood. I will adopt that persona and follow all instructions.'
            }]
        };

        return {
            model: settings.selectedModel,
            contents: [
                personaInstruction,
                modelInstruction,
                ...historyForApi
            ]
        };
    }
}

function showTypingIndicator(activeChat) {
    const typingAvatarContainer = document.getElementById('typing-avatar-container');
    if (!activeChat || !typingAvatarContainer) return;

    typingAvatarContainer.innerHTML = '';

    if (activeChat.isCharacter === false && activeChat.participantIds.length > 1) {
        const stackEl = document.createElement('div');
        stackEl.className = 'flex items-center -space-x-3';
        activeChat.participantIds.slice(0, 2).forEach(pid => {
            const participant = chats.find(c => c.id === pid);
            if (participant) {
                const img = document.createElement('img');
                img.src = participant.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${participant.name.charAt(0)}`;
                img.className = 'w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800';
                stackEl.appendChild(img);
            }
        });
        typingAvatarContainer.appendChild(stackEl);
    } else {
        const img = document.createElement('img');
        img.src = activeChat.avatar || `https://placehold.co/48x48/${settings.darkMode ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${(activeChat.name || 'A').charAt(0)}`;
        img.className = 'w-8 h-8 rounded-full object-cover';
        typingAvatarContainer.appendChild(img);
    }

    typingIndicatorContainer.classList.remove('hidden');
}

async function getAiResponse(userMessage, imageDataUrl = null, guidance = null) {
    const lowerUserMessage = (userMessage || "").toLowerCase();
    const sendKeywords = ["send me a", "send", "show me a"];
    const imageKeywords = ["image", "photo", "picture", "selfie"];
    const isImageRequest = settings.apiProvider === 'gemini' && !imageDataUrl &&
        sendKeywords.some(kw => lowerUserMessage.includes(kw)) &&
        imageKeywords.some(kw => lowerUserMessage.includes(kw));

    if (isImageRequest) {
        const imageGenerated = await handleImageGeneration(userMessage);
        if (imageGenerated) return;
    }

    const payload = await buildApiPayload(chatHistory, userMessage, guidance, imageDataUrl);
    if (!payload) return;

    const activeChat = chats.find(c => c.id === settings.activeChatId);
    showTypingIndicator(activeChat);

    try {
        if (settings.streamingEnabled) {
            await handleStreamingResponse(payload);
        } else {
            await handleNonStreamingResponse(payload);
        }
    } catch (error) {
        typingIndicatorContainer.classList.add('hidden');
        addSystemMessage(`API Error: ${error.message}`);
    }
}

async function handleNonStreamingResponse(payload) {
    const apiProvider = settings.apiProvider;
    let result;

    if (settings.useSecureProxy) {
        if (!currentUser) { throw new Error("You must be signed in to use the secure proxy."); }
        result = await callApiThroughProxy(apiProvider, payload);
    } else {
        switch (apiProvider) {
            case 'gemini': result = await callGeminiAPI(payload); break;
            case 'groq': result = await callGroqAPI(payload); break;
            case 'openrouter': result = await callOpenRouterAPI(payload); break;
            case 'electronhub': result = await callElectronHubAPI(payload); break;
            case 'cerebras': result = await callCerebrasAPI(payload); break;
        }
    }

    let aiText;
    if (apiProvider === 'gemini') {
        aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
        aiText = result.choices[0]?.message?.content;
    }

    if (apiProvider === 'openrouter' && aiText) {
        const cleanupRegex = /^.*?assistant(final)?:?\s*/i;
        const cleanedText = aiText.replace(cleanupRegex, '');
        if (cleanedText.length < aiText.length && cleanedText.length > 0) {
            aiText = cleanedText;
        }
    }

    typingIndicatorContainer.classList.add('hidden');

    if (aiText) {
        clearSystemMessages();
        const aiTurn = {
            role: 'model',
            parts: [{ text: aiText }],
            isoTimestamp: new Date().toISOString()
        };

        if (currentUser) {
             if (!isUserPremium) { // Free users need local copy
                saveMessageLocally(aiTurn);
                chatHistory.push(aiTurn);
                addMessage(aiTurn);
            }
            const encryptedTurn = await encryptTurn(aiTurn);
            const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`);
            await addDoc(messagesRef, { ...encryptedTurn, createdAt: serverTimestamp() });
        } else {
            chatHistory.push(aiTurn);
            addMessage(aiTurn);
            await saveMessageLocally(aiTurn);
        }
    } else {
        const reason = result.promptFeedback?.blockReason || 'No content received from API. This may be due to safety filters.';
        addSystemMessage(`My response was empty. Reason: ${reason}.`);
    }
}

async function handleStreamingResponse(payload) {
    const apiProvider = settings.apiProvider;
    const isoTimestamp = new Date().toISOString();
    
    addMessage({
        role: 'model',
        parts: [{ text: '' }],
        isoTimestamp: isoTimestamp
    }, { isStreaming: true }); 

    const placeholderDiv = document.getElementById(`streaming-placeholder-${isoTimestamp}`);
    const contentDiv = document.getElementById(`streaming-content-${isoTimestamp}`);
    const textContentSpan = document.getElementById(`streaming-text-${isoTimestamp}`);

    let fullResponseText = '';
    let isFirstChunk = true;
    const decoder = new TextDecoder();

    try {
        let reader;
        if (settings.useSecureProxy) {
            if (!currentUser) throw new Error("You must be signed in to use the secure proxy for streaming.");
            payload.stream = true;
            reader = await callApiThroughProxy(apiProvider, payload);
        } else {
            payload.stream = true;
            switch (apiProvider) {
                case 'gemini': reader = await callGeminiAPI(payload, true); break;
                case 'groq': reader = await callGroqAPI(payload); break;
                case 'openrouter': reader = await callOpenRouterAPI(payload); break;
                case 'electronhub': reader = await callElectronHubAPI(payload); break;
                case 'cerebras': reader = await callCerebrasAPI(payload); break;
            }
        }

        typingIndicatorContainer.classList.add('hidden');
        clearSystemMessages();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let textChunkAppended = false;

            if (apiProvider === 'gemini') {
                const parts = buffer.split('\n');
                buffer = parts.pop(); 
                for (const part of parts) {
                    if (part.trim()) {
                        try {
                            const json = JSON.parse(part);
                            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (textChunk) {
                                fullResponseText += textChunk;
                                textChunkAppended = true;
                            }
                        } catch (e) { console.warn("Could not parse JSON chunk:", part); }
                    }
                }
            } else {
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data.trim() === '[DONE]') break;
                        try {
                            const json = JSON.parse(data);
                            const textChunk = json.choices?.[0]?.delta?.content || '';
                            if (textChunk) {
                                fullResponseText += textChunk;
                                textChunkAppended = true;
                            }
                        } catch (e) { console.warn("Could not parse SSE data:", data); }
                    }
                }
            }
            
            if (isFirstChunk && textChunkAppended) {
                placeholderDiv.classList.add('hidden');
                contentDiv.classList.remove('hidden');
                isFirstChunk = false;
            }

            textContentSpan.innerHTML = marked.parse(fullResponseText);
            scrollToBottom();
        }

    } catch (error) {
        placeholderDiv.innerHTML = `<em>Error: ${error.message}</em>`;
        if (!isFirstChunk) {
            contentDiv.classList.add('hidden');
            placeholderDiv.classList.remove('hidden');
        }
        throw error;
    } finally {
        const finalTurn = {
            role: 'model',
            parts: [{ text: fullResponseText }],
            isoTimestamp: isoTimestamp
        };
        const finalContainer = document.querySelector(`.message-container[data-id="${isoTimestamp}"]`);
        if (finalContainer) {
            finalContainer.remove();
        }
        addMessage(finalTurn);

        if (currentUser) {
            if(!isUserPremium) saveMessageLocally(finalTurn);
            const encryptedTurn = await encryptTurn(finalTurn);
            const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`);
            await addDoc(messagesRef, { ...encryptedTurn, createdAt: serverTimestamp() });
        } else {
            chatHistory.push(finalTurn);
            await saveMessageLocally(finalTurn);
        }
    }
}

async function showAvatarSourceModal(context) {
    activeAvatarContext = context;
    document.getElementById('avatar-link-input-wrapper').classList.add('hidden');
    document.getElementById('avatar-url-input').value = '';
    avatarSourceModal.classList.remove('hidden');
    avatarSourceOverlay.classList.remove('hidden');
    updateBodyScrollLock();
}

function closeAvatarSourceModal() {
    avatarSourceModal.classList.add('hidden');
    avatarSourceOverlay.classList.add('hidden');
    activeAvatarContext = null;
    updateBodyScrollLock();
}

async function handleAvatarFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const dataUrl = await fileToDataUrl(file);
        if (activeAvatarContext === 'user') {
            settings.userAvatar = dataUrl;
            userAvatarPreview.src = dataUrl;
            updateAndSaveSettings();
        } else if (activeAvatarContext === 'char') {
            tempCharAvatarData = dataUrl;
            charAvatarPreview.src = dataUrl;
            analyzeImageButton.classList.remove('hidden');
        }
        closeAvatarSourceModal();
    }
    e.target.value = '';
}

function createCustomSelect(originalSelect) {
    originalSelect.classList.add('hidden');

    const container = document.createElement('div');
    container.className = 'custom-select-container';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `<span class="truncate"></span><svg data-lucide="chevrons-up-down" class="h-4 w-4 opacity-50"></svg>`;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    container.appendChild(trigger);
    container.appendChild(optionsContainer);

    originalSelect.parentNode.insertBefore(container, originalSelect);

    const triggerText = trigger.querySelector('span');
    
    const parentAccordionContent = container.closest('.settings-accordion-content');


    const updateDisplay = () => {
        const selectedOption = originalSelect.options[originalSelect.selectedIndex];
        triggerText.textContent = selectedOption ? selectedOption.textContent : '';

        optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === originalSelect.value);
        });
    };

    const populateOptions = () => {
        optionsContainer.innerHTML = '';
        Array.from(originalSelect.options).forEach((optionEl, index) => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.textContent = optionEl.textContent;
            option.dataset.value = optionEl.value;

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                originalSelect.selectedIndex = index;
                updateDisplay();
                optionsContainer.classList.remove('open');
                trigger.classList.remove('open');
                if (parentAccordionContent) {
                    parentAccordionContent.classList.remove('overflow-visible');
                }
                originalSelect.dispatchEvent(new Event('change'));
            });

            optionsContainer.appendChild(option);
        });
        updateDisplay();
    };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        document.querySelectorAll('.custom-select-options.open').forEach(el => {
            if (el !== optionsContainer) {
                el.classList.remove('open');
                el.previousElementSibling.classList.remove('open');
                 const otherAccordion = el.closest('.settings-accordion-content');
                if (otherAccordion) {
                    otherAccordion.classList.remove('overflow-visible');
                }
            }
        });
        
        optionsContainer.classList.toggle('open');
        trigger.classList.toggle('open');
        
        if (parentAccordionContent) {
            parentAccordionContent.classList.toggle('overflow-visible');
        }
    });

    originalSelect.addEventListener('refresh', () => {
        populateOptions();
    });
    
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            optionsContainer.classList.remove('open');
            trigger.classList.remove('open');
            if (parentAccordionContent) {
                parentAccordionContent.classList.remove('overflow-visible');
            }
        }
    });

    populateOptions();
    lucide.createIcons({
        nodes: [trigger]
    });
}

async function deleteAllCloudData(uid) {
    if (!uid) return;
    console.log("Starting cloud data deletion for user:", uid);
    addSystemMessage("Erasing all cloud data... This may take a moment.");

    const chatsRef = collection(db, `users/${uid}/chats`);
    const chatsSnap = await getDocs(chatsRef);
    const chatIds = chatsSnap.docs.map(d => d.id);

    for (const chatId of chatIds) {
        const messagesRef = collection(db, `users/${uid}/chatHistory/${chatId}/messages`);
        const messagesSnap = await getDocs(messagesRef);
        if (!messagesSnap.empty) {
            const batch = writeBatch(db);
            messagesSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            console.log(`Deleted history for chat ${chatId}`);
        }
    }

    if (!chatsSnap.empty) {
        const batch = writeBatch(db);
        chatsSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log("Deleted all chat documents.");
    }

    await deleteDoc(doc(db, `users/${uid}/settings`, 'main'));
    await deleteDoc(doc(db, `users/${uid}/secrets`, 'encryptionKey'));
    console.log("Deleted settings and encryption key.");

    addSystemMessage("Cloud data erased successfully.");
}


async function validateApiKey(provider) {
    const providerMap = {
        gemini: { inputId: 'gemini-api-key-input', buttonId: 'validate-gemini-key-button' },
        groq: { inputId: 'groq-api-key-input', buttonId: 'validate-groq-key-button' },
        openrouter: { inputId: 'openrouter-api-key-input', buttonId: 'validate-openrouter-key-button' },
        electronhub: { inputId: 'electronhub-api-key-input', buttonId: 'validate-electronhub-key-button' },
        cerebras: { inputId: 'cerebras-api-key-input', buttonId: 'validate-cerebras-key-button' },
    };

    const ui = providerMap[provider];
    if (!ui) return;

    const keyInput = document.getElementById(ui.inputId);
    const validateButton = document.getElementById(ui.buttonId);
    const apiKey = keyInput.value.trim();

    if (!apiKey) return;

    validateButton.innerHTML = `<svg data-lucide="loader-2" class="h-5 w-5 animate-spin text-blue-500"></svg>`;
    lucide.createIcons({ nodes: [validateButton] });

    try {
        let isValid = false;
        let response;
        switch (provider) {
            case 'gemini':
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                isValid = response.ok;
                break;
            case 'groq':
                response = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
                isValid = response.ok;
                break;
            case 'openrouter':
                 response = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
                isValid = response.ok;
                break;
            case 'electronhub':
                 response = await fetch('https://api.electronhub.ai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
                isValid = response.ok;
                break;
            case 'cerebras':
                response = await fetch('https://api.cerebras.ai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
                isValid = response.ok;
                break;
        }

        if (isValid) {
            validateButton.innerHTML = `<svg data-lucide="check-circle-2" class="h-5 w-5 text-green-500"></svg>`;
        } else {
            throw new Error(`API returned status ${response.status}`);
        }

    } catch (error) {
        validateButton.innerHTML = `<svg data-lucide="x-circle" class="h-5 w-5 text-red-500"></svg>`;
        console.error(`API Key validation failed for ${provider}:`, error);
    } finally {
        lucide.createIcons({ nodes: [validateButton] });
        setTimeout(() => {
            validateButton.innerHTML = `<svg data-lucide="check-circle" class="h-5 w-5"></svg>`;
            lucide.createIcons({ nodes: [validateButton] });
        }, 3000);
    }
}
// --- End of Unchanged Functions ---


// --- Event Listeners ---
const debouncedSave = debounce(updateAndSaveSettings, 500);
googleSigninButton.addEventListener('click', signInWithGoogle);
authModeToggle.addEventListener('click', toggleAuthMode);
if(signOutButtonFree) signOutButtonFree.addEventListener('click', handleSignOut);
if(signOutButtonPremium) signOutButtonPremium.addEventListener('click', handleSignOut);
if(upgradeButton) upgradeButton.addEventListener('click', handleSubscription);
if(manageSubscriptionButton) manageSubscriptionButton.addEventListener('click', () => {
    window.open(LEMON_SQUEEZY_CUSTOMER_PORTAL_URL, '_blank');
});

showSidebarButton.addEventListener('click', () => toggleSidebar(true));
closeSidebarButton.addEventListener('click', () => toggleSidebar(false));
restoreFromCloudButton.addEventListener('click', handleRestoreFromCloud);
apiProviderSelect.addEventListener('change', () => {
    handleApiProviderChange();
    updateAndSaveSettings();
    setTimeout(() => {
        const apiAccordion = document.getElementById('api-model-accordion');
        if (!apiAccordion) return;
        const apiAccordionContent = apiAccordion.querySelector('.settings-accordion-content');
        const apiAccordionIcon = apiAccordion.querySelector('.accordion-icon');
        const provider = apiProviderSelect.value;
        if (provider !== 'none') {
            apiAccordionContent.style.transition = 'none';
            apiAccordionContent.style.maxHeight = apiAccordionContent.scrollHeight + "px";
            if (apiAccordionIcon) apiAccordionIcon.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                apiAccordionContent.style.transition = 'max-height 0.3s ease-out';
            }, 50);
        }
        else if (provider === 'none') {
             apiAccordionContent.style.maxHeight = '0px';
             if (apiAccordionIcon) apiAccordionIcon.style.transform = 'rotate(0deg)';
        }
    }, 0); 
});
themeSwitch.addEventListener('change', updateAndSaveSettings);
streamingSwitch.addEventListener('change', updateAndSaveSettings);
addCharacterButton.addEventListener('click', () => {
    modalMode = 'character';
    openModal();
});
addGroupButton.addEventListener('click', () => {
    modalMode = 'group';
    openModal();
});
if(headerMenuButton) {
    headerMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const showCloudOptions = currentUser; // Show for free and premium
        clearCloudChatMenuItem.style.display = showCloudOptions ? 'block' : 'none';
        headerMenuDropdown.classList.toggle('hidden');
    });
}
if(downloadChatMenuItem) downloadChatMenuItem.addEventListener('click', () => {
    downloadCharacterData();
    headerMenuDropdown.classList.add('hidden');
});
if(clearLocalChatMenuItem) clearLocalChatMenuItem.addEventListener('click', () => {
    clearLocalChatHistory();
    headerMenuDropdown.classList.add('hidden');
});
if(clearCloudChatMenuItem) clearCloudChatMenuItem.addEventListener('click', () => {
    clearCurrentChatHistory();
    headerMenuDropdown.classList.add('hidden');
});
if (settingsButtonInBanner) {
    settingsButtonInBanner.addEventListener('click', () => {
        toggleSettingsPanel(true);
        setTimeout(() => {
            const apiAccordion = document.getElementById('api-model-accordion');
            if (!apiAccordion) return;
            const apiAccordionContent = apiAccordion.querySelector('.settings-accordion-content');
            const apiAccordionHeader = apiAccordion.querySelector('.settings-accordion-header');
            if (!apiAccordionContent || !apiAccordionHeader) return;

            if (!apiAccordionContent.style.maxHeight || apiAccordionContent.style.maxHeight === '0px') {
                apiAccordionHeader.click();
            }
            apiAccordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
    });
}


document.getElementById('settings-button-main').addEventListener('click', () => toggleSettingsPanel(true));
closeSettingsButton.addEventListener('click', () => toggleSettingsPanel(false));
settingsOverlay.addEventListener('click', () => toggleSettingsPanel(false));
sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

headerAvatarStack.addEventListener('click', () => toggleCharacterPopdown(true));
characterDetailsOverlay.addEventListener('click', () => toggleCharacterPopdown(false));

resetAppButton.addEventListener('click', async () => {
    const confirmed = await showConfirm({
        title: "Confirm Data Deletion",
        message: "This will permanently erase ALL chats, history, and settings from this device AND from your cloud account if you are signed in. This cannot be undone."
    });
    if (confirmed) {
        const userToErase = currentUser;
        if (userToErase) {
            await deleteAllCloudData(userToErase.uid);
            await signOut(auth);
        }
        localStorage.clear();
        window.location.reload();
    }
});

nsfwSwitch.addEventListener('click', async (e) => {
    const isEnabling = e.target.checked;

    if (isEnabling) {
        e.preventDefault();

        const confirmed = await showConfirm({
            title: "Content Warning",
            message: `You must be 18+ to enable this.<br><br>Please note this only affects the app's instructions to the AI. It does not bypass safety filters from the API provider (Google, Groq, etc.). Your usage is still subject to their terms of service.`,
            okText: "I Understand and Accept",
            okClass: "bg-red-600 hover:bg-red-700"
        });

        if (confirmed) {
            nsfwSwitch.checked = true;
            updateAndSaveSettings();
        }
    } else {
        updateAndSaveSettings();
    }
});
themeSelect.addEventListener('change', updateAndSaveSettings);
timeSourceSelect.addEventListener('change', updateAndSaveSettings);
showAvatarsSwitch.addEventListener('change', updateAndSaveSettings);


secureProxySwitch.addEventListener('click', async (e) => {
    if (!isUserPremium) {
        e.preventDefault();
        return; // Non-premium users cannot change this
    }

    const isDisabling = !e.target.checked;
    if (isDisabling) {
        e.preventDefault();
        const confirmed = await showConfirm({
            title: "Disable Secure Proxy?",
            message: "Are you sure? This will send your API key directly from your browser, which is less secure."
        });
        if (confirmed) {
            e.target.checked = false;
            updateAndSaveSettings();
        }
    } else {
        updateAndSaveSettings();
    }
});

historyDepthSlider.addEventListener('input', () => {
    const sliderIndex = parseInt(historyDepthSlider.value, 10);
    historyDepthValue.textContent = historyDepthLabels[sliderIndex];
    settings.chatHistoryDepth = historyDepthMap[sliderIndex];
    debouncedSave();
});

modelSelect.addEventListener('change', updateAndSaveSettings);
groqModelSelect.addEventListener('change', (e) => {
    groqCustomModelWrapper.classList.toggle('hidden', e.target.value !== 'custom');
    updateAndSaveSettings();
});
openrouterModelSelect.addEventListener('change', (e) => {
    openrouterCustomModelWrapper.classList.toggle('hidden', e.target.value !== 'custom');
    updateAndSaveSettings();
});
electronhubModelSelect.addEventListener('change', (e) => {
    electronhubCustomModelWrapper.classList.toggle('hidden', e.target.value !== 'custom');
    updateAndSaveSettings();
});
cerebrasModelSelect.addEventListener('change', (e) => {
    cerebrasCustomModelWrapper.classList.toggle('hidden', e.target.value !== 'custom');
    updateAndSaveSettings();
});

userNameInput.addEventListener('input', debouncedSave);
geminiApiKeyInput.addEventListener('input', debouncedSave);
groqApiKeyInput.addEventListener('input', debouncedSave);
openrouterApiKeyInput.addEventListener('input', debouncedSave);
groqCustomModelInput.addEventListener('input', debouncedSave);
openrouterCustomModelInput.addEventListener('input', debouncedSave);
electronhubApiKeyInput.addEventListener('input', debouncedSave);
electronhubCustomModelInput.addEventListener('input', debouncedSave);
cerebrasApiKeyInput.addEventListener('input', debouncedSave);
cerebrasCustomModelInput.addEventListener('input', debouncedSave);

groqCustomModelInput.addEventListener('blur', (e) => saveCustomModelFromInput(e.target));
openrouterCustomModelInput.addEventListener('blur', (e) => saveCustomModelFromInput(e.target));
electronhubCustomModelInput.addEventListener('blur', (e) => saveCustomModelFromInput(e.target));
cerebrasCustomModelInput.addEventListener('blur', (e) => saveCustomModelFromInput(e.target));

manageCustomModelsButton.addEventListener('click', () => toggleCustomModelsModal(true));
closeCustomModelsModal.addEventListener('click', () => toggleCustomModelsModal(false));
customModelsOverlay.addEventListener('click', () => toggleCustomModelsModal(false));

customModelsModal.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.delete-custom-model-button');
    if (!deleteButton) return;

    const { provider, model } = deleteButton.dataset;
    if (!provider || !model) return;

    const modelIndex = settings.customModels[provider]?.indexOf(model);
    if (modelIndex > -1) {
        settings.customModels[provider].splice(modelIndex, 1);
    }

    if (provider === 'groq' && settings.selectedGroqModel === model) {
        groqModelSelect.value = 'llama-3.3-70b-versatile';
    }
    if (provider === 'openrouter' && settings.selectedOpenRouterModel === model) {
        openrouterModelSelect.value = 'openai/gpt-oss-20b:free';
    }
    if (provider === 'electronhub' && settings.selectedElectronhubModel === model) {
        electronhubModelSelect.value = 'claude-3-5-haiku-20241022';
    }
    if (provider === 'cerebras' && settings.selectedCerebrasModel === model) {
        cerebrasModelSelect.value = 'gpt-oss-120b';
    }

    updateAndSaveSettings();
    populateManagerModal();
    populateSettingsPanel();
});

imageUploadButton.addEventListener('click', () => imageInput.click());
document.getElementById('whatsapp-camera-button')?.addEventListener('click', () => imageInput.click());
uploadChatButton.addEventListener('click', () => chatUploadInput.click());
chatUploadInput.addEventListener('change', handleChatUpload);

const modalInputs = characterModal.querySelectorAll('input, textarea, select');
modalInputs.forEach(input => {
    input.addEventListener('input', () => { isModalDirty = true; });
    input.addEventListener('change', () => { isModalDirty = true; });
});

saveCharacterButton.addEventListener('click', saveChat);
cancelCharacterModal.addEventListener('click', closeCharacterModal);
characterModalOverlay.addEventListener('click', closeCharacterModal);
deleteCharacterButton.addEventListener('click', deleteChat);
enhancePersonaButton.addEventListener('click', enhancePersona);
generateImagePromptButton.addEventListener('click', generateImagePromptFromPersona);
analyzeImageButton.addEventListener('click', analyzeImageForPersona);
document.getElementById('enhance-scenario-button').addEventListener('click', enhanceScenario);
charTypeSelect.addEventListener('change', updateCharacterModalUI);

userAvatarPreview.addEventListener('click', () => showAvatarSourceModal('user'));
charAvatarPreview.addEventListener('click', () => showAvatarSourceModal('char'));

document.getElementById('avatar-upload-device-button').addEventListener('click', () => {
    if (activeAvatarContext === 'user') userAvatarUploadInput.click();
    else if (activeAvatarContext === 'char') charAvatarUploadInput.click();
});
userAvatarUploadInput.addEventListener('change', handleAvatarFileSelect);
charAvatarUploadInput.addEventListener('change', handleAvatarFileSelect);

document.getElementById('avatar-enter-link-button').addEventListener('click', () => {
    document.getElementById('avatar-link-input-wrapper').classList.remove('hidden');
    document.getElementById('avatar-url-input').focus();
});
document.getElementById('avatar-url-confirm-button').addEventListener('click', async () => {
    const url = document.getElementById('avatar-url-input').value.trim();
    if (url) {
        if (activeAvatarContext === 'user') {
            settings.userAvatar = url;
            userAvatarPreview.src = url;
            updateAndSaveSettings();
        } else if (activeAvatarContext === 'char') {
            tempCharAvatarData = url;
            charAvatarPreview.src = url;
            analyzeImageButton.classList.remove('hidden');
        }
        closeAvatarSourceModal();
    }
});
document.getElementById('avatar-source-cancel-button').addEventListener('click', closeAvatarSourceModal);
avatarSourceOverlay.addEventListener('click', closeAvatarSourceModal);

guidanceButton.addEventListener('click', () => {
    guidanceWrapper.classList.toggle('hidden');
    if (!guidanceWrapper.classList.contains('hidden')) {
        guidanceInput.placeholder = "Guide this response: make it shorter, more poetic, etc.";
        guidanceInput.focus();
    }
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const dataUrl = await fileToDataUrl(file);
            attachedImage = dataUrl;
            imagePreview.src = dataUrl;
            imagePreviewWrapper.classList.remove('hidden');
        } catch (error) {
            showAlert({
                title: "Image Error",
                message: "Sorry, I had trouble reading that image file."
            });
            console.error(error);
        }
    }
});

removeImageButton.addEventListener('click', () => {
    attachedImage = null;
    imageInput.value = '';
    imagePreviewWrapper.classList.add('hidden');
});

messageInput.addEventListener('input', () => {
    const sendButton = document.getElementById('send-button');
    const hasText = messageInput.value.trim().length > 0;
    if (sendButton) {
        sendButton.classList.toggle('hidden', !hasText);
    }
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit', {
            cancelable: true
        }));
    }
});

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let userMessage = messageInput.value.trim();
    const guidanceText = guidanceInput.value.trim();

    if (!userMessage && !attachedImage) return;

    const oocMatch = userMessage.match(/^\(\((.*)\)\)$/);
    if (oocMatch) {
        const oocInstruction = oocMatch[1].trim();
        addSystemMessage(`OOC Instruction: ${oocInstruction}`);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        await getAiResponse('', null, oocInstruction);
        return;
    }

    const activeChat = chats.find(c => c.id === settings.activeChatId);
    if (activeChat) {
        activeChat.lastActivity = Date.now();
        sortAndRenderChats();
        if (isUserPremium) saveChatToFirestore(activeChat);
    }

    messageInput.value = '';
    messageInput.style.height = 'auto';
    guidanceInput.value = '';
    guidanceWrapper.classList.add('hidden');
    messageInput.dispatchEvent(new Event('input'));

    const now = new Date();
    const isoTimestamp = now.toISOString();

    const userParts = [];
    if (attachedImage) {
        userParts.push({
            text: attachedImage,
            isImage: true
        });
    }
    if (userMessage) {
        userParts.push({
            text: userMessage,
            isImage: false
        });
    }

    const userTurnForHistory = {
        role: 'user',
        parts: userParts,
        isoTimestamp
    };

    const imageDataUrlForApi = attachedImage;
    removeImageButton.click();

    if (currentUser) {
        try {
            const encryptedTurn = await encryptTurn(userTurnForHistory);
            const messagesRef = collection(db, `users/${currentUser.uid}/chatHistory/${settings.activeChatId}/messages`);
            await addDoc(messagesRef, { ...encryptedTurn,
                createdAt: serverTimestamp()
            });
             if (!isUserPremium) {
                saveMessageLocally(userTurnForHistory);
                chatHistory.push(userTurnForHistory);
                addMessage(userTurnForHistory);
            }
        } catch (error) {
            showAlert({
                title: "Send Failed",
                message: "Failed to send your message. Please try again."
            });
            return;
        }
    } else { // Anonymous users
        saveMessageLocally(userTurnForHistory);
        chatHistory.push(userTurnForHistory);
        addMessage(userTurnForHistory);
    }

    if (userMessage.startsWith('/image ')) {
        const directPrompt = userMessage.substring('/image '.length).trim();
        if (directPrompt) {
            await handleImageGeneration(null, directPrompt);
        } else {
            addSystemMessage("Please provide a prompt after `/image`.");
        }
        return;
    }

    if (userMessage.startsWith('/sendpic')) {
        let contextualRequest = userMessage.substring('/sendpic'.length).trim();
        if (!contextualRequest) {
            contextualRequest = 'a selfie of you';
        }
        await handleImageGeneration(contextualRequest);
        return;
    }

    await getAiResponse(userMessage || "What is in this image?", imageDataUrlForApi, guidanceText);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container')) {
        document.querySelectorAll('.custom-select-options.open').forEach(el => {
            el.classList.remove('open');
            el.previousElementSibling.classList.remove('open');
             const otherAccordion = el.closest('.settings-accordion-content');
            if (otherAccordion) {
                otherAccordion.classList.remove('overflow-visible');
            }
        });
    }
    if (headerMenuDropdown && !headerMenuDropdown.classList.contains('hidden') && !e.target.closest('#header-menu-button')) {
        headerMenuDropdown.classList.add('hidden');
    }
});

function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (!registration) return;

            if (registration.waiting) {
                showUpdateNotification(registration.waiting);
                return;
            }

            if (registration.installing) {
                trackInstallingWorker(registration.installing);
                return;
            }

            registration.addEventListener('updatefound', () => {
                if (registration.installing) {
                    trackInstallingWorker(registration.installing);
                }
            });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }
}

function trackInstallingWorker(worker) {
    worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
            showUpdateNotification(worker);
        }
    });
}

function showUpdateNotification(worker) {
    const notification = document.getElementById('update-notification');
    const updateButton = document.getElementById('update-button');

    if (!notification || !updateButton) return;

    notification.classList.remove('hidden');

    updateButton.addEventListener('click', () => {
        updateButton.textContent = 'Updating...';
        updateButton.disabled = true;
        worker.postMessage({
            action: 'skipWaiting'
        });
    }, {
        once: true
    });
}

// --- FINAL INITIALIZATION LOGIC ---
function startApp() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.style.display = 'flex';
    document.querySelectorAll('select').forEach(createCustomSelect);

   const sidebarHeader = sidebar.querySelector('header');
if (sidebarHeader) {
    const searchBarHTML = `
        <div class="p-2 border-sidebar"> 
            <div class="relative">
                <svg data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"></svg>
                <input type="text" id="character-search-input" placeholder="Search chats..." class="w-full bg-input border-0 focus:border-0 rounded-full py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-input" autocomplete="off">
            </div>
        </div>`;
    sidebarHeader.insertAdjacentHTML('afterend', searchBarHTML);
        
        const searchInput = document.getElementById('character-search-input');
        searchInput.addEventListener('input', () => {
            sortAndRenderChats();
        });
    }
    
    lucide.createIcons();
    updateBodyScrollLock();
    checkForUpdates();
    
    document.querySelectorAll('.settings-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');
            
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0px';
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
    
    const emailSigninToggleButton = document.getElementById('email-signin-toggle-button');
    const emailAuthContainer = document.getElementById('email-auth-container');
    if (emailSigninToggleButton && emailAuthContainer) {
        emailSigninToggleButton.addEventListener('click', () => {
            emailAuthContainer.classList.toggle('hidden');
        });
    }

    document.getElementById('validate-gemini-key-button').addEventListener('click', () => validateApiKey('gemini'));
    document.getElementById('validate-groq-key-button').addEventListener('click', () => validateApiKey('groq'));
    document.getElementById('validate-openrouter-key-button').addEventListener('click', () => validateApiKey('openrouter'));
    document.getElementById('validate-electronhub-key-button').addEventListener('click', () => validateApiKey('electronhub'));
    document.getElementById('validate-cerebras-key-button').addEventListener('click', () => validateApiKey('cerebras'));
}

termsAgreeButton.addEventListener('click', () => {
    termsAgreeButton.disabled = true;
    termsAgreeButton.textContent = 'Starting...';
    localStorage.setItem(TOS_AGREEMENT_KEY, 'true');
    setTimeout(() => {
        window.location.reload();
    }, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    // NOTE: The original hostname gatekeeper was removed to allow for easy self-hosting and forking.
    // If you wish to restrict this app to a specific domain, you can re-implement the check here.
    // Example:
    // const allowedHostnames = ['yourdomain.com', 'localhost'];
    // if (!allowedHostnames.includes(window.location.hostname)) {
    //     document.body.innerHTML = '<h1>Access Denied</h1>';
    //     return;
    // }

    if (localStorage.getItem(TOS_AGREEMENT_KEY) === 'true') {
        startApp();
    } else {
        document.getElementById('terms-modal-title').textContent = 'Welcome to Idolon!';
        const termsContent = document.getElementById('terms-content');
        const summary = document.createElement('div');
        summary.innerHTML = `<p class="font-bold mb-3 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg"><strong>Quick Summary:</strong> Idolon is a client-side app. You provide your own AI provider API key. Your chats and data are stored locally on your device or synced to your personal cloud account if you sign in. We never see or store your data.</p>`;
        termsContent.prepend(summary);
        loadingOverlay.style.display = 'none';
        termsModal.classList.remove('hidden');
        termsModalOverlay.classList.remove('hidden');
    }
});