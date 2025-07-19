'use strict';

/**
 * Unicode Text Formatting Utilities
 * Converts regular text to Unicode equivalents for bold, italic, etc.
 */

// Unicode character mappings for bold text
const BOLD_MAP = {
    // Uppercase letters
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉',
    'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓',
    'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    
    // Lowercase letters
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣',
    'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭',
    'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    
    // Numbers
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
};

/**
 * Converts regular text to Unicode bold equivalents
 * @param {string} text - The text to convert
 * @returns {string} - The text with Unicode bold characters
 */
function convertToBold(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    return text.split('').map(char => {
        return BOLD_MAP[char] || char;
    }).join('');
}

/**
 * Converts Unicode bold text back to regular text
 * @param {string} text - The bold text to convert back
 * @returns {string} - The text with regular characters
 */
function convertFromBold(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Create reverse mapping
    const reverseBoldMap = {};
    Object.keys(BOLD_MAP).forEach(key => {
        reverseBoldMap[BOLD_MAP[key]] = key;
    });
    
    return text.split('').map(char => {
        return reverseBoldMap[char] || char;
    }).join('');
}

/**
 * Checks if text contains Unicode bold characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains bold characters
 */
function containsBoldText(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    const boldChars = Object.values(BOLD_MAP);
    return text.split('').some(char => boldChars.includes(char));
}

/**
 * Toggles between regular and bold text
 * @param {string} text - The text to toggle
 * @returns {string} - The toggled text
 */
function toggleBold(text) {
    if (containsBoldText(text)) {
        return convertFromBold(text);
    } else {
        return convertToBold(text);
    }
}

// Export functions
export {
    convertToBold,
    convertFromBold,
    containsBoldText,
    toggleBold
};
