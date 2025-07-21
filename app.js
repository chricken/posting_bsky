import settings from './settings.js';
import { formatText } from './unicode-formatter.js';
import InputField from './components/InputField.js';

class BlueskyThreadPoster {
    constructor() {
        this.session = null;
        this.maxPostLength = settings.maxPostLength;
        this.draftSaveTimeout = null;
        this.inputFields = [];
        this.init();
    }

    init() {
        this.bindEvents();
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
            const drafts = [];
            
            this.inputFields.forEach((field, index) => {
                const content = field.getValue().trim();
                if (content) {
                    drafts.push({
                        index: index,
                        content: content,
                        formatStyle: field.getFormatStyle() // Speichern der Formatierung
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
            
            // Ensure we have enough input fields for all drafts
            const maxDraftIndex = Math.max(...drafts.map(d => d.index));
            
            // Clear existing input fields first
            const threadPosts = document.getElementById('threadPosts');
            while (threadPosts.firstChild) {
                threadPosts.removeChild(threadPosts.firstChild);
            }
            this.inputFields = [];
            
            // Create required number of input fields
            for (let i = 0; i <= maxDraftIndex; i++) {
                this.addPost();
            }
            
            // Load content into input fields
            drafts.forEach(draft => {
                if (this.inputFields[draft.index]) {
                    // Setze den Inhalt
                    this.inputFields[draft.index].setValue(draft.content);
                    
                    // Setze den Formatierungsstil, falls vorhanden
                    if (draft.formatStyle) {
                        this.inputFields[draft.index].setFormatStyle(draft.formatStyle);
                    }
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
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('postThreadBtn').addEventListener('click', () => this.postThread());
        document.getElementById('showGuideBtn').addEventListener('click', () => GuideModal.show());

        // JSON Verwaltung
        document.getElementById('showJsonBtn').addEventListener('click', () => this.showInputsAsJson());
        
        // JSON-Datei laden via verstecktem File-Input
        document.getElementById('loadJsonBtn').addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });
        
        document.getElementById('jsonFileInput').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.loadFromJson(file);
                // Zurücksetzen des File-Inputs, damit die gleiche Datei erneut ausgewählt werden kann
                event.target.value = '';
            }
        });
        
        // JSON-Code einfügen Button
        document.getElementById('pasteJsonBtn').addEventListener('click', () => {
            this.showJsonInputModal();
        });

        // Add button events (using event delegation)
        document.addEventListener('click', (e) => {
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

        // Enter key handling - keep this global handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey && e.target.tagName === 'TEXTAREA') {
                this.postThread();
            }
        });
        
        // Note: Input and paste events are now handled by each InputField component
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

        const inputField = new InputField({
            index: postCount,
            maxLength: this.maxPostLength,
            onValueChange: () => {
                clearTimeout(this.draftSaveTimeout);
                this.draftSaveTimeout = setTimeout(() => {
                    this.saveDrafts();
                }, 1000);
            },
            onAutoExpand: (field) => {
                const currentIndex = this.inputFields.findIndex(f => f === field);
                if (currentIndex >= 0 && currentIndex === this.inputFields.length - 1) {
                    // If this is the last field and it has content, add a new field
                    this.addPost();
                }
            }
        });
        
        this.inputFields.push(inputField);
        threadPosts.appendChild(inputField.getElement());
        
        // Kein Update des Remove-Buttons mehr nötig, da dieser entfernt wurde
        
        // Focus new textarea
        // inputField.focus();
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
        
        // Find position in inputFields array
        const insertPosition = this.inputFields.findIndex(field => 
            field.getElement() === currentPostInput || 
            field.getElement().isEqualNode(currentPostInput));
        
        if (insertPosition === -1) {
            console.error('Could not find input field for insertion position');
            return;
        }
        
        // Create new input field
        const inputField = new InputField({
            index: currentIndex + 1,
            maxLength: this.maxPostLength,
            onValueChange: () => {
                clearTimeout(this.draftSaveTimeout);
                this.draftSaveTimeout = setTimeout(() => {
                    this.saveDrafts();
                }, 1000);
            },
            onAutoExpand: (field) => {
                const idx = this.inputFields.findIndex(f => f === field);
                if (idx >= 0 && idx === this.inputFields.length - 1) {
                    // If this is the last field and it has content, add a new field
                    this.addPost();
                }
            }
        });
        
        // Insert the new input field after the current one
        currentPostInput.insertAdjacentElement('afterend', inputField.getElement());
        
        // Update our inputFields array
        this.inputFields.splice(insertPosition + 1, 0, inputField);
        
        // Update indices of all posts after the inserted one
        this.reindexPosts();
        
        // Kein Update des Remove-Buttons mehr nötig, da dieser entfernt wurde
        
        // Focus new textarea
        // inputField.focus();
    }

    reindexPosts() {
        // Update all InputField components with new indices
        this.inputFields.forEach((inputField, index) => {
            inputField.setIndex(index);
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
        
        // Find and remove the InputField component
        const removeIndex = this.inputFields.findIndex(field => 
            field.getElement() === postInput || 
            field.getElement().isEqualNode(postInput));
            
        if (removeIndex !== -1) {
            // Remove element from DOM
            postInput.remove();
            
            // Remove from our array
            this.inputFields.splice(removeIndex, 1);
            
            // Update indices of all remaining posts
            this.reindexPosts();
            
            // Update remove button visibility
            const remainingCount = threadPosts.children.length;
            document.getElementById('removePostBtn').style.display = remainingCount > 1 ? 'inline-block' : 'none';
            
            this.showStatus('Post entfernt', 'success');
        }
    }

    removePost() {
        const threadPosts = document.getElementById('threadPosts');
        const postCount = threadPosts.children.length;
        
        if (postCount > 1) {
            // Remove the last InputField from DOM
            threadPosts.removeChild(threadPosts.lastElementChild);
            
            // Remove from our array
            if (this.inputFields.length > 0) {
                this.inputFields.pop();
            }
        }
        
        // Update remove button visibility
        document.getElementById('removePostBtn').style.display = threadPosts.children.length > 1 ? 'inline-block' : 'none';
    }

    updateCharCounters() {
        // This is now handled by each InputField component
        // Keep this method for backward compatibility but it's no longer needed
    }

    async postThread() {
        if (!this.session) {
            this.showStatus('Nicht angemeldet', 'error');
            return;
        }

        const posts = this.inputFields
            .map(inputField => inputField.getFormattedValue())
            .filter(text => text !== null);

        if (posts.length === 0) {
            this.showStatus('Mindestens ein Post muss Text enthalten', 'error');
            return;
        }

        // Check for posts that are too long
        const tooLongPosts = [];
        posts.forEach((post, index) => {
            if (post.length > this.maxPostLength) {
                tooLongPosts.push({
                    index: index + 1,
                    content: post,
                    length: post.length
                });
            }
        });
        
        if (tooLongPosts.length > 0) {
            let errorMessage = `${tooLongPosts.length} Post${tooLongPosts.length > 1 ? 's' : ''} ${tooLongPosts.length > 1 ? 'sind' : 'ist'} zu lang (max. ${this.maxPostLength} Zeichen):\n\n`;
            
            tooLongPosts.forEach(post => {
                const truncatedContent = post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content;
                errorMessage += `Post ${post.index}: ${post.length} Zeichen\n"${truncatedContent}"\n\n`;
            });
            
            this.showStatus(errorMessage, 'error');
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
            
            // Clear all input fields only if all posts were successful
            if (successfulPosts === posts.length) {
                // Clear saved drafts since posting was successful
                this.clearDrafts();
                
                // Reset to single post input
                const threadPosts = document.getElementById('threadPosts');
                
                // Clear all input fields
                while (threadPosts.firstChild) {
                    threadPosts.removeChild(threadPosts.firstChild);
                }
                this.inputFields = [];
                
                // Add a single empty input field
                this.addPost();
                
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
    
    showInputsAsJson() {
        try {
            // Sammle alle Eingaben und ihre Formatierungen
            const inputs = this.inputFields.map((field, index) => {
                const content = field.getValue().trim();
                const formatStyle = field.getFormatStyle();
                const formattedText = field.getFormattedValue();
                
                return {
                    index,
                    content,
                    formatStyle,
                    formattedText: formattedText || '',
                    charCount: content.length,
                    formattedCharCount: formattedText ? formattedText.length : 0
                };
            }).filter(input => input.content !== '');
            
            // Verwende die neue showJSON-Methode mit Kopieren- und Download-Buttons
            Modal.showJSON('Eingaben als JSON', inputs);
        } catch (error) {
            console.error('Fehler beim Erstellen des JSON:', error);
            this.showStatus('Fehler beim Erstellen des JSON: ' + error.message, 'error');
        }
    }
    
    clearAll() {
        try {
            // Verwende die neue clearInputFields-Methode
            this.clearInputFields();
            
            // Füge einen leeren Post hinzu
            this.addPost();
            
            // Status anzeigen
            this.showStatus('Alle Eingaben gelöscht', 'success');
            
            // Entferne Posts aus localStorage
            localStorage.removeItem(settings.localStorage.draftsKey);
        } catch (error) {
            console.error('Fehler beim Löschen aller Eingaben:', error);
            this.showStatus('Fehler beim Löschen aller Eingaben: ' + error.message, 'error');
        }
    }
    
    loadFromJson(jsonFile) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    this.processJsonData(jsonData);
                } catch (error) {
                    console.error('Fehler beim Parsen der JSON-Datei:', error);
                    this.showStatus('Fehler beim Laden der JSON-Datei: ' + error.message, 'error');
                }
            };
            
            reader.onerror = () => {
                this.showStatus('Fehler beim Lesen der Datei', 'error');
            };
            
            // Datei als Text lesen
            reader.readAsText(jsonFile);
            
        } catch (error) {
            console.error('Fehler beim Laden der JSON-Datei:', error);
            this.showStatus('Fehler beim Laden der JSON-Datei: ' + error.message, 'error');
        }
    }
    
    processJsonData(jsonData) {
        try {
            // Validiere JSON-Struktur
            if (!Array.isArray(jsonData)) {
                throw new Error('Die JSON-Daten müssen ein Array enthalten');
            }
            
            if (jsonData.length === 0) {
                this.showStatus('Das JSON-Array enthält keine Elemente', 'warning');
                return; // Nichts zu tun, wenn Array leer ist
            }
            
            // Prüfe, ob es sich um ein Array aus Strings oder ein Array aus Objekten handelt
            const isStringArray = typeof jsonData[0] === 'string';
            
            // Sammle zuerst alle Daten, bevor wir die DOM-Manipulation durchführen
            const postsData = jsonData.map(item => {
                if (isStringArray) {
                    return { content: item };
                } else {
                    return {
                        content: item.content || '',
                        formatStyle: item.formatStyle || 'normal'
                    };
                }
            });
            
            // Füge Eingabefelder hinzu (an bestehende anhängen)
            const startIndex = this.inputFields.length;
            
            // Für jeden neuen Eintrag ein Eingabefeld hinzufügen
            for (let i = 0; i < postsData.length; i++) {
                const currentIndex = startIndex + i;
                
                // Wenn es der erste Eintrag ist und noch keine Eingabefelder existieren
                if (currentIndex === 0) {
                    this.addPost(); // Erstes Feld hinzufügen
                } else if (currentIndex >= this.inputFields.length) {
                    // Nur ein neues Feld hinzufügen, wenn nötig
                    this.addPost();
                }
                
                // Inhalt setzen
                if (this.inputFields[currentIndex]) {
                    if (postsData[i].content) {
                        this.inputFields[currentIndex].setValue(postsData[i].content);
                    }
                    
                    if (postsData[i].formatStyle && !isStringArray) {
                        this.inputFields[currentIndex].setFormatStyle(postsData[i].formatStyle);
                    }
                }
            }
            
            this.showStatus(`${postsData.length} Einträge aus JSON angehängt`, 'success');
        } catch (error) {
            console.error('Fehler bei der Verarbeitung der JSON-Daten:', error);
            this.showStatus('Fehler bei der Verarbeitung der JSON-Daten: ' + error.message, 'error');
        }
    }
    
    clearInputFields() {
        try {
            // Lösche alle Eingabefelder aus dem DOM
            const threadPosts = document.getElementById('threadPosts');
            while (threadPosts && threadPosts.firstChild) {
                threadPosts.removeChild(threadPosts.firstChild);
            }
            
            // Leere das inputFields-Array
            this.inputFields = [];
        } catch (error) {
            console.error('Fehler beim Löschen der Eingabefelder:', error);
            throw error;
        }
    }
    
    showJsonInputModal() {
        // Modal mit Textarea erstellen
        const modal = new Modal();
        modal.setTitle('JSON-Code einfügen');
        
        // Textarea zum Einfügen von JSON erstellen
        const textareaHtml = `
            <div class="json-paste-container">
                <textarea id="jsonInput" class="json-paste-textarea" placeholder='[
  "Hier den ersten Text eingeben",
  "Hier den zweiten Text eingeben"
]'></textarea>
            </div>
        `;
        
        modal.setContent(textareaHtml);
        
        // Löschen-Button hinzufügen
        modal.clearActionButtons();
        modal.addActionButton('Löschen', () => {
            document.getElementById('jsonInput').value = '';
        }, 'btn btn-secondary');
        
        // Übernehmen-Button hinzufügen
        modal.addActionButton('JSON übernehmen', () => {
            const jsonInput = document.getElementById('jsonInput');
            const jsonText = jsonInput.value.trim();
            
            if (!jsonText) {
                this.showStatus('Kein JSON-Code eingegeben', 'error');
                return;
            }
            
            try {
                const jsonData = JSON.parse(jsonText);
                this.processJsonData(jsonData);
                modal.hide();
            } catch (error) {
                console.error('Fehler beim Parsen des JSON-Codes:', error);
                this.showStatus('Fehler beim Parsen des JSON-Codes: ' + error.message, 'error');
            }
        }, 'btn btn-primary');
        
        // Modal anzeigen
        modal.show();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlueskyThreadPoster();
});
