import settings from './settings.js';
import { toggleBold } from './unicode-formatter.js';

class BlueskyThreadPoster {
    constructor() {
        this.session = null;
        this.maxPostLength = settings.maxPostLength;
        this.draftSaveTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCharCounters();
        this.loadSavedCredentials();
    }

    saveCredentials(handle, appPassword) {
        try {
            localStorage.setItem(settings.localStorage.handleKey, handle);
            localStorage.setItem(settings.localStorage.passwordKey, appPassword);
        } catch (error) {
            console.warn('Could not save credentials to localStorage:', error);
        }
    }

    loadSavedCredentials() {
        try {
            const savedHandle = localStorage.getItem(settings.localStorage.handleKey);
            const savedPassword = localStorage.getItem(settings.localStorage.passwordKey);
            
            if (savedHandle) {
                document.getElementById('handle').value = savedHandle;
            }
            if (savedPassword) {
                document.getElementById('appPassword').value = savedPassword;
            }
        } catch (error) {
            console.warn('Could not load credentials from localStorage:', error);
        }
    }

    clearSavedCredentials() {
        try {
            localStorage.removeItem(settings.localStorage.handleKey);
            localStorage.removeItem(settings.localStorage.passwordKey);
        } catch (error) {
            console.warn('Could not clear credentials from localStorage:', error);
        }
    }

    clearCredentialsAndForm() {
        // Clear from localStorage
        this.clearSavedCredentials();
        
        // Clear form fields
        document.getElementById('handle').value = '';
        document.getElementById('appPassword').value = '';
        
        this.showStatus('Gespeicherte Anmeldedaten gelöscht', 'info');
    }

    // Draft management methods
    saveDrafts() {
        try {
            const textareas = document.querySelectorAll('.thread-posts textarea');
            const drafts = [];
            
            textareas.forEach((textarea, index) => {
                const content = textarea.value.trim();
                if (content) {
                    drafts.push({
                        index: index,
                        content: content
                    });
                }
            });
            
            if (drafts.length > 0) {
                localStorage.setItem(settings.localStorage.draftsKey, JSON.stringify(drafts));
            } else {
                // Remove drafts if no content
                localStorage.removeItem(settings.localStorage.draftsKey);
            }
        } catch (error) {
            console.warn('Could not save drafts to localStorage:', error);
        }
    }

    loadDrafts() {
        try {
            const savedDrafts = localStorage.getItem(settings.localStorage.draftsKey);
            if (!savedDrafts) return;
            
            const drafts = JSON.parse(savedDrafts);
            if (!Array.isArray(drafts)) return;
            
            // Ensure we have enough textareas for all drafts
            const maxDraftIndex = Math.max(...drafts.map(d => d.index));
            
            // Add more textareas if needed - query textareas inside the loop to get updated count
            while (document.querySelectorAll('.thread-posts textarea').length <= maxDraftIndex) {
                this.addPost();
            }
            
            // Load content into textareas
            drafts.forEach(draft => {
                const textareas = document.querySelectorAll('.thread-posts textarea');
                if (textareas[draft.index]) {
                    textareas[draft.index].value = draft.content;
                    this.updateCharCounter(textareas[draft.index]);
                }
            });
            
            this.showStatus(`${drafts.length} Entwürfe wiederhergestellt`, 'success');
        } catch (error) {
            console.warn('Could not load drafts from localStorage:', error);
        }
    }

    clearDrafts() {
        try {
            localStorage.removeItem(settings.localStorage.draftsKey);
        } catch (error) {
            console.warn('Could not clear drafts from localStorage:', error);
        }
    }

    toggleTextareaBold(textarea) {
        const currentText = textarea.value;
        if (currentText.trim().length === 0) {
            this.showStatus('Textarea ist leer', 'error');
            return;
        }
        
        const formattedText = toggleBold(currentText);
        if (formattedText !== currentText) {
            textarea.value = formattedText;
            this.updateCharCounter(textarea);
            
            // Auto-save drafts after formatting
            clearTimeout(this.draftSaveTimeout);
            this.draftSaveTimeout = setTimeout(() => {
                this.saveDrafts();
            }, 500);
            
            this.showStatus('Text formatiert', 'success');
        } else {
            this.showStatus('Text bereits formatiert oder keine Änderung', 'info');
        }
    }

    bindEvents() {
        // Auth events
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('togglePassword').addEventListener('click', () => this.togglePasswordVisibility());
        document.getElementById('clearCredentialsBtn').addEventListener('click', () => this.clearCredentialsAndForm());

        // Thread management events
        document.getElementById('addPostBtn').addEventListener('click', () => this.addPost());
        document.getElementById('removePostBtn').addEventListener('click', () => this.removePost());
        document.getElementById('postThreadBtn').addEventListener('click', () => this.postThread());
        
        // Bold button events (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('bold-btn')) {
                const textarea = e.target.closest('.textarea-container').querySelector('textarea');
                if (textarea) {
                    this.toggleTextareaBold(textarea);
                }
            }
            
            // Add button events (using event delegation)
            if (e.target.classList.contains('add-btn')) {
                const postInput = e.target.closest('.post-input');
                if (postInput) {
                    this.addPostBelow(postInput);
                }
            }
            
            // Remove button events (using event delegation)
            if (e.target.classList.contains('remove-btn')) {
                const postInput = e.target.closest('.post-input');
                if (postInput) {
                    this.removePostAt(postInput);
                }
            }
        });

        // Input events for character counting, auto-expansion, and draft saving
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA' && e.target.closest('.thread-posts')) {
                this.updateCharCounter(e.target);
                this.handleAutoExpansion(e.target);
                
                // Auto-save drafts with debouncing
                clearTimeout(this.draftSaveTimeout);
                this.draftSaveTimeout = setTimeout(() => {
                    this.saveDrafts();
                }, 1000); // Save 1 second after user stops typing
            }
        });

        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey && e.target.tagName === 'TEXTAREA') {
                this.postThread();
            }
        });
    }

    async login() {
        const handle = document.getElementById('handle').value.trim();
        const appPassword = document.getElementById('appPassword').value.trim();

        if (!handle || !appPassword) {
            this.showStatus('Bitte Handle und App Password eingeben', 'error');
            return;
        }

        // Validate handle format and clean invisible characters
        let cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
        // Remove all invisible characters, zero-width spaces, etc.
        cleanHandle = cleanHandle.replace(/[\u200B-\u200D\uFEFF\u202C\u202D\u202E]/g, '').trim();
        
        console.log('Original handle:', JSON.stringify(handle));
        console.log('Cleaned handle:', JSON.stringify(cleanHandle));
        
        if (!cleanHandle.includes('.')) {
            this.showStatus('Handle muss vollständig sein (z.B. name.bsky.social)', 'error');
            return;
        }

        // Validate app password format
        if (appPassword.length < 10) {
            this.showStatus('App Password scheint zu kurz zu sein. Verwende ein App Password aus den Bluesky Einstellungen, nicht dein normales Passwort!', 'error');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.textContent;
        loginBtn.innerHTML = '<span class="loading"></span>Anmelden...';
        loginBtn.disabled = true;

        try {
            console.log('Attempting login with handle:', cleanHandle);
            
            const response = await fetch(`${settings.api.baseUrl}/${settings.api.createSession}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: cleanHandle,
                    password: appPassword
                })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = 'Anmeldung fehlgeschlagen';
                
                try {
                    const errorData = await response.json();
                    console.log('Error response:', errorData);
                    
                    if (response.status === 401) {
                        errorMessage = 'Ungültiger Handle oder App Password. Überprüfe:\n' +
                                     '• Handle ist vollständig (z.B. name.bsky.social)\n' +
                                     '• Du verwendest ein APP PASSWORD (nicht dein normales Passwort)\n' +
                                     '• App Password ist korrekt eingegeben';
                    } else {
                        errorMessage = errorData.message || errorMessage;
                    }
                } catch (e) {
                    console.log('Could not parse error response');
                    if (response.status === 401) {
                        errorMessage = 'Ungültiger Handle oder App Password. Stelle sicher, dass du ein APP PASSWORD verwendest!';
                    }
                }
                
                throw new Error(errorMessage);
            }

            this.session = await response.json();
            console.log('Login successful for:', this.session.handle);
            
            // Save credentials to localStorage on successful login
            this.saveCredentials(cleanHandle, appPassword);
            
            this.showThreadSection();
            this.showStatus('Erfolgreich angemeldet!', 'success');

        } catch (error) {
            console.error('Login error:', error);
            this.showStatus(error.message, 'error');
        } finally {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    }

    logout() {
        this.session = null;
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('threadSection').style.display = 'none';
        
        // Keep credentials in form fields (they're saved in localStorage)
        // Only clear if user explicitly wants to
        
        this.showStatus('Erfolgreich abgemeldet', 'info');
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('appPassword');
        const toggleButton = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.textContent = '🙈';
            toggleButton.title = 'Passwort verstecken';
        } else {
            passwordInput.type = 'password';
            toggleButton.textContent = '👁️';
            toggleButton.title = 'Passwort anzeigen';
        }
    }

    showThreadSection() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('threadSection').style.display = 'block';
        document.getElementById('threadSection').classList.add('fade-in');
        
        // Show user info
        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
            <strong>Angemeldet als:</strong> ${this.session.handle}<br>
            <strong>DID:</strong> ${this.session.did}
        `;
        
        // Load any saved drafts
        this.loadDrafts();
    }

    addPost() {
        const threadPosts = document.getElementById('threadPosts');
        const postCount = threadPosts.children.length;
        
        if (postCount >= settings.maxPostsPerThread) {
            this.showStatus(`Maximum ${settings.maxPostsPerThread} Posts pro Thread empfohlen (Performance)`, 'error');
            return;
        }

        const postDiv = document.createElement('div');
        postDiv.className = 'post-input fade-in';
        postDiv.setAttribute('data-post-index', postCount);
        
        postDiv.innerHTML = `
            <label>${settings.text.postLabelTemplate.replace('{index}', postCount + 1)}</label>
            <div class="textarea-container">
                <textarea placeholder="${settings.text.postPlaceholderTemplate.replace('{index}', postCount + 1)}" maxlength="${this.maxPostLength}" data-has-created-next="false"></textarea>
                <div class="textarea-buttons">
                    <button class="bold-btn" title="Text in Unicode-Fettschrift umwandeln">𝐁</button>
                    <button class="add-btn" title="Neuen Post darunter hinzufügen">➕</button>
                    <button class="remove-btn" title="Diesen Post entfernen">🗑️</button>
                </div>
            </div>
            <div class="char-counter">0/${this.maxPostLength}</div>
        `;

        threadPosts.appendChild(postDiv);
        
        // Update remove button visibility
        document.getElementById('removePostBtn').style.display = postCount > 0 ? 'inline-block' : 'none';
        
        // Focus new textarea
        postDiv.querySelector('textarea').focus();
        
        this.updateCharCounters();
    }

    addPostBelow(currentPostInput) {
        const threadPosts = document.getElementById('threadPosts');
        const postCount = threadPosts.children.length;
        
        if (postCount >= settings.maxPostsPerThread) {
            this.showStatus(`Maximum ${settings.maxPostsPerThread} Posts pro Thread empfohlen (Performance)`, 'error');
            return;
        }

        // Find the index of the current post
        const currentIndex = parseInt(currentPostInput.getAttribute('data-post-index'));
        
        // Create new post div
        const postDiv = document.createElement('div');
        postDiv.className = 'post-input fade-in';
        postDiv.setAttribute('data-post-index', currentIndex + 1);
        
        postDiv.innerHTML = `
            <label>${settings.text.postLabelTemplate.replace('{index}', currentIndex + 2)}</label>
            <div class="textarea-container">
                <textarea placeholder="${settings.text.postPlaceholderTemplate.replace('{index}', currentIndex + 2)}" maxlength="${this.maxPostLength}" data-has-created-next="false"></textarea>
                <div class="textarea-buttons">
                    <button class="bold-btn" title="Text in Unicode-Fettschrift umwandeln">𝐁</button>
                    <button class="add-btn" title="Neuen Post darunter hinzufügen">➕</button>
                    <button class="remove-btn" title="Diesen Post entfernen">🗑️</button>
                </div>
            </div>
            <div class="char-counter">0/${this.maxPostLength}</div>
        `;

        // Insert the new post after the current one
        currentPostInput.insertAdjacentElement('afterend', postDiv);
        
        // Update indices of all posts after the inserted one
        this.reindexPosts();
        
        // Update remove button visibility
        document.getElementById('removePostBtn').style.display = threadPosts.children.length > 1 ? 'inline-block' : 'none';
        
        // Focus new textarea
        postDiv.querySelector('textarea').focus();
        
        this.updateCharCounters();
    }

    reindexPosts() {
        const threadPosts = document.getElementById('threadPosts');
        const postInputs = threadPosts.querySelectorAll('.post-input');
        
        postInputs.forEach((postInput, index) => {
            // Update data-post-index attribute
            postInput.setAttribute('data-post-index', index);
            
            // Update label text
            const label = postInput.querySelector('label');
            if (index === 0) {
                label.textContent = settings.text.mainPostLabel;
            } else {
                label.textContent = settings.text.postLabelTemplate.replace('{index}', index + 1);
            }
            
            // Update placeholder text
            const textarea = postInput.querySelector('textarea');
            if (index === 0) {
                textarea.placeholder = settings.text.mainPostPlaceholder;
            } else {
                textarea.placeholder = settings.text.postPlaceholderTemplate.replace('{index}', index + 1);
            }
        });
    }

    removePostAt(postInput) {
        const threadPosts = document.getElementById('threadPosts');
        const postCount = threadPosts.children.length;
        
        // Don't allow removing the last remaining post
        if (postCount <= 1) {
            this.showStatus('Mindestens ein Post muss vorhanden bleiben', 'error');
            return;
        }
        
        // Remove the post
        postInput.remove();
        
        // Update indices of all remaining posts
        this.reindexPosts();
        
        // Update remove button visibility
        const remainingCount = threadPosts.children.length;
        document.getElementById('removePostBtn').style.display = remainingCount > 1 ? 'inline-block' : 'none';
        
        // Update character counters
        this.updateCharCounters();
        
        this.showStatus('Post entfernt', 'success');
    }

    removePost() {
        const threadPosts = document.getElementById('threadPosts');
        const postCount = threadPosts.children.length;
        
        if (postCount > 1) {
            threadPosts.removeChild(threadPosts.lastElementChild);
        }
        
        // Update remove button visibility
        document.getElementById('removePostBtn').style.display = threadPosts.children.length > 1 ? 'inline-block' : 'none';
    }

    updateCharCounters() {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => this.updateCharCounter(textarea));
    }

    updateCharCounter(textarea) {
        // Find the counter in the post-input container (parent of textarea-container)
        const postInput = textarea.closest('.post-input');
        const counter = postInput ? postInput.querySelector('.char-counter') : null;
        
        if (!counter) {
            console.warn('Character counter not found for textarea');
            return;
        }
        
        const length = textarea.value.length;
        const maxLength = this.maxPostLength;
        
        counter.textContent = `${length}/${maxLength}`;
        
        // Update counter styling based on character count
        counter.classList.remove('warning', 'danger');
        if (length > maxLength * settings.showCharacterDangerAt) {
            counter.classList.add('danger');
        } else if (length > maxLength * settings.showCharacterWarningAt) {
            counter.classList.add('warning');
        }
    }

    handleAutoExpansion(textarea) {
        // Check if this textarea has already created a next one
        const hasCreatedNext = textarea.getAttribute('data-has-created-next') === 'true';
        
        // Only proceed if there's content and we haven't created a next textarea yet
        if (textarea.value.trim().length > 0 && !hasCreatedNext) {
            const threadPosts = document.getElementById('threadPosts');
            const currentPostDiv = textarea.closest('.post-input');
            const currentIndex = parseInt(currentPostDiv.getAttribute('data-post-index'));
            
            // Check if there's already an empty textarea after this one
            const nextSibling = currentPostDiv.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('post-input')) {
                const nextTextarea = nextSibling.querySelector('textarea');
                if (nextTextarea && nextTextarea.value.trim() === '') {
                    // There's already an empty textarea below, don't create another
                    return;
                }
            }
            
            // Check if we've reached the maximum number of posts (soft limit for performance)
            if (threadPosts.children.length >= settings.maxPostsPerThread) {
                return;
            }
            
            // Mark this textarea as having created the next one
            textarea.setAttribute('data-has-created-next', 'true');
            
            // Create new post div
            const newIndex = currentIndex + 1;
            const newPostDiv = document.createElement('div');
            newPostDiv.className = 'post-input fade-in';
            newPostDiv.setAttribute('data-post-index', newIndex);
            
            newPostDiv.innerHTML = `
                <label>${settings.text.postLabelTemplate.replace('{index}', newIndex + 1)}</label>
                <textarea placeholder="${settings.text.postPlaceholderTemplate.replace('{index}', newIndex + 1)}" maxlength="${this.maxPostLength}" data-has-created-next="false"></textarea>
                <div class="char-counter">0/${this.maxPostLength}</div>
            `;
            
            // Insert the new post div after the current one
            currentPostDiv.insertAdjacentElement('afterend', newPostDiv);
            
            // Update remove button visibility
            document.getElementById('removePostBtn').style.display = 'inline-block';
            
            // Update character counter for the new textarea
            this.updateCharCounters();
        }
    }

    async postThread() {
        if (!this.session) {
            this.showStatus('Nicht angemeldet', 'error');
            return;
        }

        const textareas = document.querySelectorAll('textarea');
        const posts = Array.from(textareas)
            .map(textarea => textarea.value.trim())
            .filter(text => text.length > 0);

        if (posts.length === 0) {
            this.showStatus('Mindestens ein Post muss Text enthalten', 'error');
            return;
        }

        // Check for posts that are too long
        const tooLongPosts = posts.filter(post => post.length > this.maxPostLength);
        if (tooLongPosts.length > 0) {
            this.showStatus(`Einige Posts sind zu lang (max. ${this.maxPostLength} Zeichen)`, 'error');
            return;
        }

        const postBtn = document.getElementById('postThreadBtn');
        const originalText = postBtn.textContent;
        postBtn.innerHTML = '<span class="loading"></span>Thread wird gepostet...';
        postBtn.disabled = true;

        // Show progress modal
        this.showProgressModal(posts.length);

        try {
            const successfulPosts = await this.createThread(posts);
            this.hideProgressModal();
            this.showStatus(`Thread mit ${successfulPosts} Posts erfolgreich gepostet! 🎉`, 'success');
            
            // Clear all textareas only if all posts were successful
            if (successfulPosts === posts.length) {
                textareas.forEach(textarea => {
                    textarea.value = '';
                    textarea.setAttribute('data-has-created-next', 'false');
                });
                this.updateCharCounters();
                
                // Clear saved drafts since posting was successful
                this.clearDrafts();
                
                // Reset to single post input
                const threadPosts = document.getElementById('threadPosts');
                while (threadPosts.children.length > 1) {
                    threadPosts.removeChild(threadPosts.lastElementChild);
                }
                document.getElementById('removePostBtn').style.display = 'none';
            }

        } catch (error) {
            this.hideProgressModal();
            console.error('Post thread error:', error);
            this.showStatus(`${error.message}`, 'error');
        } finally {
            postBtn.textContent = originalText;
            postBtn.disabled = false;
        }
    }

    async createThread(posts) {
        let parentPost = null;
        let rootPost = null;
        let successfulPosts = 0;

        try {
            for (let i = 0; i < posts.length; i++) {
                const postText = posts[i];
                
                // Update progress modal
                this.updateProgress(i + 1, postText);
                const now = new Date().toISOString();

                const postRecord = {
                    $type: settings.postRecord.type,
                    text: postText,
                    createdAt: now
                };

                // Add reply references for posts after the first one
                if (i > 0) {
                    postRecord.reply = {
                        root: {
                            uri: rootPost.uri,
                            cid: rootPost.cid
                        },
                        parent: {
                            uri: parentPost.uri,
                            cid: parentPost.cid
                        }
                    };
                }

                const response = await fetch(`${settings.api.baseUrl}/${settings.api.createRecord}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.session.accessJwt}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        repo: this.session.did,
                        collection: settings.postRecord.collection,
                        record: postRecord
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    
                    // If we've posted some successfully, give partial success message
                    if (successfulPosts > 0) {
                        throw new Error(`${successfulPosts} Posts erfolgreich gepostet. Fehler bei Post ${i + 1}: ${error.message || 'Unbekannter Fehler'}`);
                    } else {
                        throw new Error(error.message || `Fehler beim Posten von Post ${i + 1}`);
                    }
                }

                const result = await response.json();
                successfulPosts++;
                
                // Set root post reference (first post)
                if (i === 0) {
                    rootPost = result;
                }
                
                // Update parent post reference for next iteration
                parentPost = result;

                // Add delay between posts to avoid rate limiting
                // Longer delay for longer threads to be more respectful
                if (i < posts.length - 1) {
                    const delay = posts.length > settings.longThreadThreshold ? settings.longThreadDelay : settings.baseDelay;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            return successfulPosts;
            
        } catch (error) {
            // Re-throw with additional context
            throw new Error(`${error.message} (${successfulPosts}/${posts.length} Posts erfolgreich)`);
        }
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';

        // Auto-hide success and info messages after 5 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
    }

    showProgressModal(totalPosts) {
        this.progressData = {
            totalPosts: totalPosts,
            currentPost: 0,
            startTime: Date.now(),
            estimatedTotalTime: this.calculateEstimatedTime(totalPosts)
        };
        
        document.getElementById('totalPosts').textContent = totalPosts;
        document.getElementById('currentPostNumber').textContent = '0';
        document.getElementById('progressPercentage').textContent = '0%';
        document.getElementById('progressBarFill').style.width = '0%';
        document.getElementById('elapsedTime').textContent = '0s';
        document.getElementById('remainingTime').textContent = this.formatTime(this.progressData.estimatedTotalTime);
        document.getElementById('currentPostContent').textContent = 'Vorbereitung...';
        
        document.getElementById('progressModal').style.display = 'flex';
    }

    updateProgress(currentPost, postContent) {
        if (!this.progressData) return;
        
        this.progressData.currentPost = currentPost;
        const progress = (currentPost / this.progressData.totalPosts) * 100;
        const elapsedTime = Date.now() - this.progressData.startTime;
        
        // Update UI elements
        document.getElementById('currentPostNumber').textContent = currentPost;
        document.getElementById('progressPercentage').textContent = Math.round(progress) + '%';
        document.getElementById('progressBarFill').style.width = progress + '%';
        document.getElementById('elapsedTime').textContent = this.formatTime(elapsedTime);
        
        // Calculate remaining time based on actual progress
        if (currentPost > 0) {
            const avgTimePerPost = elapsedTime / currentPost;
            const remainingPosts = this.progressData.totalPosts - currentPost;
            const estimatedRemainingTime = remainingPosts * avgTimePerPost;
            document.getElementById('remainingTime').textContent = this.formatTime(estimatedRemainingTime);
        }
        
        // Update post content preview
        const truncatedContent = postContent.length > 100 
            ? postContent.substring(0, 100) + '...' 
            : postContent;
        document.getElementById('currentPostContent').textContent = truncatedContent;
    }

    hideProgressModal() {
        document.getElementById('progressModal').style.display = 'none';
        this.progressData = null;
    }

    calculateEstimatedTime(totalPosts) {
        // Calculate estimated time based on delays
        const delay = totalPosts > settings.longThreadThreshold 
            ? settings.longThreadDelay 
            : settings.baseDelay;
        
        // Add some buffer time for API calls (estimate ~500ms per post)
        const apiTime = 500;
        return (totalPosts - 1) * delay + totalPosts * apiTime;
    }

    formatTime(milliseconds) {
        if (milliseconds < 1000) return '< 1s';
        
        const seconds = Math.ceil(milliseconds / 1000);
        if (seconds < 60) return seconds + 's';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes + 'm ' + remainingSeconds + 's';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlueskyThreadPoster();
});
