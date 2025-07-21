'use strict';

const settings = {
    // Post settings
    maxPostLength: 300,
    maxPostsPerThread: 200,
    
    // UI settings
    showCharacterWarningAt: 0.8, // 80% of maxPostLength
    showCharacterDangerAt: 0.9,  // 90% of maxPostLength
    
    // API settings
    baseDelay: 1000,              // Base delay between posts (ms)
    longThreadDelay: 2000,        // Delay for threads >20 posts (ms)
    longThreadThreshold: 20,      // When to use longer delay
    
    // LocalStorage keys
    localStorage: {
        handleKey: 'bluesky_handle',
        passwordKey: 'bluesky_app_password',
        draftsKey: 'bluesky_thread_drafts'
    },
    
    // Bluesky API endpoints
    api: {
        baseUrl: 'https://bsky.social/xrpc',
        createSession: 'com.atproto.server.createSession',
        createRecord: 'com.atproto.repo.createRecord'
    },
    
    // Post record settings
    postRecord: {
        type: 'app.bsky.feed.post',
        collection: 'app.bsky.feed.post'
    },
    
    // UI text and labels
    text: {
        mainPostLabel: 'Post 1 (Hauptpost):',
        postLabelTemplate: 'Post {index}:',
        mainPostPlaceholder: 'Schreibe deinen ersten Post hier...',
        postPlaceholderTemplate: 'Schreibe deinen {index}. Post hier...'
    }
};

export default settings;