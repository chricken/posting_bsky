'use strict';

import settings from '../settings.js';
import { formatText } from '../unicode-formatter.js';

export class InputField {
    constructor({
        index = 0,
        maxLength = settings.maxPostLength,
        onValueChange = null,
        onAutoExpand = null,
        container = null
    } = {}) {
        this.index = index;
        this.maxLength = maxLength;
        this.onValueChange = onValueChange;
        this.onAutoExpand = onAutoExpand;
        this.container = container;
        this.element = null;
        this.textarea = null;
        this.charCounter = null;
        this.formatSelect = null;
        this.draftSaveTimeout = null;
        this.hasCreatedNext = false;
        
        this.init();
    }
    
    init() {
        this.createElement();
        this.bindEvents();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'post-input fade-in';
        this.element.setAttribute('data-post-index', this.index);
        
        const label = this.index === 0 ? 
            settings.text.mainPostLabel : 
            settings.text.postLabelTemplate.replace('{index}', this.index + 1);
            
        const placeholder = this.index === 0 ?
            settings.text.mainPostPlaceholder :
            settings.text.postPlaceholderTemplate.replace('{index}', this.index + 1);
        
        this.element.innerHTML = `
            <label>${label}</label>
            <div class="textarea-container">
                <textarea placeholder="${placeholder}" maxlength="${this.maxLength}" data-has-created-next="false" tabindex="${this.index + 1}"></textarea>
                <div class="textarea-buttons">
                    <select class="format-select" title="Textformatierung wählen">
                        <option value="normal">Normal</option>
                        <option value="bold">𝐅𝐞𝐭𝐭</option>
                        <option value="italic">𝐼𝑡𝑎𝑙𝑖𝑐</option>
                        <option value="script">𝒮𝒸𝓇𝒾𝓅𝓉</option>
                    </select>
                    <button class="add-btn" title="Neuen Post darunter hinzufügen">➕</button>
                    <button class="remove-btn" title="Diesen Post entfernen">🗑️</button>
                </div>
            </div>
            <div class="char-counter">0/${this.maxLength}</div>
        `;
        
        // Store references to important elements
        this.textarea = this.element.querySelector('textarea');
        this.charCounter = this.element.querySelector('.char-counter');
        this.formatSelect = this.element.querySelector('.format-select');
        
        if (this.container) {
            this.container.appendChild(this.element);
        }
    }
    
    bindEvents() {
        // Input events for character counting, auto-expansion, and draft saving
        this.textarea.addEventListener('input', (e) => {
            // Clean up line breaks before periods
            const cleanedText = this.cleanupLineBreaks(e.target.value);
            if (cleanedText !== e.target.value) {
                const cursorPos = e.target.selectionStart;
                e.target.value = cleanedText;
                // Restore cursor position (adjust if text was shortened)
                const newCursorPos = Math.min(cursorPos, cleanedText.length);
                e.target.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            this.updateCharCounter();
            this.handleAutoExpansion();
            
            // Notify parent about value change
            if (this.onValueChange) {
                this.onValueChange(this);
            }
        });
        
        // Paste events for immediate cleanup
        this.textarea.addEventListener('paste', (e) => {
            // Use setTimeout to allow paste to complete first
            setTimeout(() => {
                const cleanedText = this.cleanupLineBreaks(this.textarea.value);
                if (cleanedText !== this.textarea.value) {
                    this.textarea.value = cleanedText;
                    this.updateCharCounter();
                    
                    // Notify parent about value change
                    if (this.onValueChange) {
                        this.onValueChange(this);
                    }
                }
            }, 10);
        });
        
        // Format select change
        if (this.formatSelect) {
            this.formatSelect.addEventListener('change', () => {
                this.applyFormatting();
            });
        }
    }
    
    applyFormatting() {
        const text = this.textarea.value;
        if (text.trim().length === 0) return;
        
        const formatStyle = this.formatSelect.value;
        
        // Remove all format classes first
        this.textarea.classList.remove('format-normal', 'format-bold', 'format-italic', 'format-script');
        
        // Add the appropriate class for styling
        this.textarea.classList.add(`format-${formatStyle}`);
        
        // Update char counter to show formatted text length
        this.updateCharCounter();
    }
    
    cleanupLineBreaks(text) {
        // Entferne Zeilenumbrüche vor Punkten und Kommas
        let result = text.replace(/\n+\./g, '.').replace(/\n+,/g, ',');
        
        // Entferne Zeilenumbrüche vor " -" (Leerzeichen + Bindestrich)
        result = result.replace(/\n+ -/g, ' -');
        
        // Entferne Leerzeichen vor Punkten und Kommas
        result = result.replace(/\s+\./g, '.').replace(/\s+,/g, ',');
        
        return result;
    }
    
    updateCharCounter() {
        if (!this.charCounter) return;
        
        // Get current text and format style
        const text = this.textarea.value;
        const formatStyle = this.formatSelect ? this.formatSelect.value : 'normal';
        
        // Calculate the length of the formatted text (for display and validation)
        let formattedLength = text.length;
        if (formatStyle !== 'normal') {
            const formattedText = formatText(text, formatStyle);
            formattedLength = formattedText.length;
        }
        
        this.charCounter.textContent = `${formattedLength}/${this.maxLength}`;
        
        // Update counter styling based on character count
        this.charCounter.classList.remove('warning', 'danger');
        if (formattedLength > this.maxLength * settings.showCharacterDangerAt) {
            this.charCounter.classList.add('danger');
        } else if (formattedLength > this.maxLength * settings.showCharacterWarningAt) {
            this.charCounter.classList.add('warning');
        }
    }
    
    handleAutoExpansion() {
        // Check if this textarea has already created a next one
        const hasContent = this.textarea.value.trim().length > 0;
        
        // Only proceed if there's content and we haven't created a next textarea yet
        if (hasContent && !this.hasCreatedNext) {
            this.hasCreatedNext = true;
            this.textarea.setAttribute('data-has-created-next', 'true');
            
            // Notify parent to possibly create a new input field
            if (this.onAutoExpand) {
                this.onAutoExpand(this);
            }
        }
    }
    
    getValue() {
        return this.textarea ? this.textarea.value : '';
    }
    
    setValue(value) {
        if (this.textarea) {
            this.textarea.value = value;
            this.updateCharCounter();
        }
    }
    
    getFormattedValue() {
        const text = this.getValue().trim();
        if (!text) return null;
        
        // Apply formatting based on selectbox value if available
        const formatStyle = this.getFormatStyle();
        return formatText(text, formatStyle);
    }
    
    getFormatStyle() {
        return this.formatSelect ? this.formatSelect.value : 'normal';
    }
    
    setFormatStyle(style) {
        if (this.formatSelect && ['normal', 'bold', 'italic', 'script'].includes(style)) {
            this.formatSelect.value = style;
            this.applyFormatting(); // Apply the new style
        }
    }
    
    focus() {
        if (this.textarea) {
            this.textarea.focus();
        }
    }
    
    setIndex(newIndex) {
        this.index = newIndex;
        this.element.setAttribute('data-post-index', newIndex);
        
        // Update label
        const label = this.element.querySelector('label');
        if (label) {
            if (newIndex === 0) {
                label.textContent = settings.text.mainPostLabel;
            } else {
                label.textContent = settings.text.postLabelTemplate.replace('{index}', newIndex + 1);
            }
        }
        
        // Update placeholder and tabindex
        if (this.textarea) {
            if (newIndex === 0) {
                this.textarea.placeholder = settings.text.mainPostPlaceholder;
            } else {
                this.textarea.placeholder = settings.text.postPlaceholderTemplate.replace('{index}', newIndex + 1);
            }
            
            // Update tabindex to match post index (for tab navigation between textareas)
            this.textarea.setAttribute('tabindex', newIndex + 1);
        }
    }
    
    resetHasCreatedNext() {
        this.hasCreatedNext = false;
        if (this.textarea) {
            this.textarea.setAttribute('data-has-created-next', 'false');
        }
    }
    
    getElement() {
        return this.element;
    }
}

export default InputField;
