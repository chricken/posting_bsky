'use strict';

class Modal {
    constructor() {
        // Erstelle alle DOM-Elemente für das Modal
        this.createDomElements();
        
        // Event-Listener hinzufügen
        this.bindEvents();
    }
    
    createDomElements() {
        // Overlay erstellen (Hintergrund)
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        
        // Modal-Container erstellen
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        
        // Innere Container erstellen
        this.container = document.createElement('div');
        this.container.className = 'modal-container';
        this.modal.appendChild(this.container);
        
        // Header erstellen
        this.header = document.createElement('div');
        this.header.className = 'modal-header';
        this.container.appendChild(this.header);
        
        // Titel erstellen
        this.title = document.createElement('h3');
        this.header.appendChild(this.title);
        
        // Schließen-Button erstellen
        this.closeButton = document.createElement('button');
        this.closeButton.className = 'modal-close-btn';
        this.closeButton.innerHTML = '&times;';
        this.header.appendChild(this.closeButton);
        
        // Content-Bereich erstellen
        this.content = document.createElement('div');
        this.content.className = 'modal-content';
        this.container.appendChild(this.content);
        
        // Aktionsbuttons-Bereich erstellen
        this.actionButtons = document.createElement('div');
        this.actionButtons.className = 'modal-actions';
        this.container.appendChild(this.actionButtons);
        
        // Füge Elemente zum DOM hinzu
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.modal);
        
        // Standardmäßig ausblenden
        this.overlay.style.display = 'none';
        this.modal.style.display = 'none';
    }
    
    bindEvents() {
        // Schließen bei Klick auf Close-Button
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Schließen bei Klick auf Overlay
        this.overlay.addEventListener('click', () => this.hide());
        
        // Schließen bei Escape-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }
    
    isVisible() {
        return this.modal && this.modal.style.display === 'block';
    }
    
    setContent(htmlContent) {
        if (this.content) {
            this.content.innerHTML = htmlContent;
        }
        return this;
    }
    
    setContentText(text) {
        if (this.content) {
            this.content.textContent = text;
        }
        return this;
    }
    
    setTitle(title) {
        if (this.title) {
            this.title.textContent = title;
        }
        return this;
    }
    
    show() {
        // Stelle sicher, dass alle Aktionen vor dem Anzeigen erfolgen
        if (this.modal && this.overlay) {
            // Erst anzeigen
            this.modal.style.display = 'block';
            this.overlay.style.display = 'block';
            
            // Dann Animation starten (kleiner Delay für CSS-Transition)
            setTimeout(() => {
                this.modal.classList.add('modal-show');
                this.overlay.classList.add('modal-overlay-show');
            }, 10);
        }
        return this;
    }
    
    hide() {
        if (this.modal && this.overlay) {
            // Erst Animation entfernen
            this.modal.classList.remove('modal-show');
            this.overlay.classList.remove('modal-overlay-show');
            
            // Nach Abschluss der Animation ausblenden
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.overlay.style.display = 'none';
            }, 300);
        }
        return this;
    }
    
    clearActionButtons() {
        if (this.actionButtons) {
            this.actionButtons.innerHTML = '';
        }
        return this;
    }
    
    addActionButton(text, callback, className = 'btn') {
        if (!this.actionButtons) return this;
        
        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        button.addEventListener('click', callback);
        this.actionButtons.appendChild(button);
        
        return this;
    }
    
    static showMessage(title, message) {
        const modal = new Modal();
        modal.setTitle(title);
        modal.setContentText(message);
        return modal.show();
    }

    static showHTML(title, htmlContent) {
        const modal = new Modal();
        modal.setTitle(title);
        modal.setContent(htmlContent);
        return modal.show();
    }
    
    static showJSON(title, jsonData) {
        const modal = new Modal();
        const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
        
        // Erst Modal vorbereiten
        modal.setTitle(title);
        modal.setContent(`<pre>${jsonString}</pre>`);
        
        // Aktionsbuttons löschen, falls vorhanden (sicherheitshalber)
        modal.clearActionButtons();
        
        // Kopieren-Button hinzufügen
        modal.addActionButton('📋 In die Zwischenablage kopieren', () => {
            navigator.clipboard.writeText(jsonString)
                .then(() => {
                    const notificationSpan = document.createElement('span');
                    notificationSpan.className = 'copy-notification';
                    notificationSpan.textContent = 'Kopiert!';
                    modal.actionButtons.appendChild(notificationSpan);
                    
                    setTimeout(() => {
                        notificationSpan.remove();
                    }, 2000);
                })
                .catch(err => console.error('Fehler beim Kopieren:', err));
        }, 'btn btn-secondary');
        
        // Download-Button hinzufügen
        modal.addActionButton('💾 Als JSON-Datei herunterladen', () => {
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bsky_thread_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'btn btn-primary');
        
        // Modal anzeigen
        return modal.show();
    }
}

// Die Komponente global verfügbar machen
window.Modal = Modal;
