// Main JavaScript for Music Listening Charts
// Local Storage Key
const STORAGE_KEY = 'musicListeningData2025';

// Data Management Functions
/**
 * Load data from CSV file and merge with localStorage
 * @returns {Promise<Array>} Combined and deduplicated data
 */
async function loadData() {
    console.log('Loading data from CSV and localStorage...');
    
    let allData = [];
    
    // Load data from CSV
    try {
        const response = await fetch('data/scrobbles-erwindank-1765486344.csv');
        if (response.ok) {
            const csvText = await response.text();
            const csvData = parseCSVText(csvText);
            console.log(`Loaded ${csvData.length} entries from CSV`);
            allData = allData.concat(csvData);
        } else {
            console.warn('CSV file not found or inaccessible');
        }
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
    
    // Load data from localStorage
    const localData = getLocalStorageData();
    console.log(`Loaded ${localData.length} entries from localStorage`);
    allData = allData.concat(localData);
    
    // Filter out Excel error entries
    allData = allData.filter(entry => {
        const excelErrors = ['#NAME?', '#REF!', '#VALUE!', '#DIV/0!', '#N/A', '#NUM!', '#NULL!'];
        return !excelErrors.some(error => 
            entry.song.includes(error) || 
            entry.artist.includes(error) || 
            (entry.album && entry.album.includes(error))
        );
    });
    
    console.log(`Total ${allData.length} valid entries after filtering`);
    return allData;
}

/**
 * Get data from localStorage
 * @returns {Array} Data array
 */
function getLocalStorageData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

/**
 * Save data to localStorage
 * @param {Array} data - Data to save
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log(`Saved ${data.length} entries to localStorage`);
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Add a new entry to localStorage
 * @param {Object} entry - Entry to add
 * @returns {boolean} Success status
 */
function addEntry(entry) {
    const data = getLocalStorageData();
    data.push(entry);
    return saveData(data);
}

// CSV Parsing Functions
/**
 * Parse CSV text into array of objects
 * @param {string} csvText - CSV content
 * @returns {Array} Parsed data
 */
function parseCSVText(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        console.warn('CSV file is empty or has no data rows');
        return [];
    }
    
    const headers = parseCSVLine(lines[0]);
    console.log('CSV Headers:', headers);
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header.toLowerCase().trim()] = values[index].trim();
            });
            
            // Convert datetime to ISO format
            if (entry.datetime) {
                entry.datetime = convertDateTimeToISO(entry.datetime);
            }
            
            // Ensure plays is a number
            if (entry.plays) {
                entry.plays = parseInt(entry.plays) || 1;
            } else {
                entry.plays = 1;
            }
            
            // Ensure required fields exist
            if (entry.song && entry.artist) {
                data.push(entry);
            }
        }
    }
    
    return data;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    values.push(current);
    
    return values;
}

/**
 * Convert datetime string to ISO format
 * Format: "11 Dec 2025, 20:52" -> ISO format
 * @param {string} dateTimeStr - DateTime string
 * @returns {string} ISO format datetime
 */
function convertDateTimeToISO(dateTimeStr) {
    try {
        // Parse format: "11 Dec 2025, 20:52"
        const parts = dateTimeStr.split(',');
        if (parts.length !== 2) {
            console.warn('Invalid datetime format (missing comma):', dateTimeStr);
            return new Date().toISOString();
        }
        
        const datePart = parts[0].trim();
        const timePart = parts[1].trim();
        
        // Parse date: "11 Dec 2025"
        const dateComponents = datePart.split(' ');
        if (dateComponents.length !== 3) {
            console.warn('Invalid date format:', datePart);
            return new Date().toISOString();
        }
        
        const day = dateComponents[0];
        const month = dateComponents[1];
        const year = dateComponents[2];
        
        // Month mapping
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const monthNum = months[month] || '01';
        const dayPadded = day.padStart(2, '0');
        
        // Parse time: "20:52"
        const timeComponents = timePart.split(':');
        const hour = timeComponents[0].padStart(2, '0');
        const minute = timeComponents[1].padStart(2, '0');
        
        // Create ISO string
        const isoString = `${year}-${monthNum}-${dayPadded}T${hour}:${minute}:00.000Z`;
        
        // Validate by creating a Date object
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            console.warn('Parsed datetime is invalid:', isoString);
            return new Date().toISOString();
        }
        
        return isoString;
    } catch (error) {
        console.error('Error converting datetime:', dateTimeStr, error);
        return new Date().toISOString();
    }
}

// Data Processing Functions
/**
 * Aggregate songs by song+artist combination
 * @param {Array} data - Raw data
 * @returns {Array} Aggregated data
 */
function aggregateSongs(data) {
    const songMap = new Map();
    
    data.forEach(entry => {
        const key = `${entry.song}|||${entry.artist}`.toLowerCase();
        
        if (songMap.has(key)) {
            const existing = songMap.get(key);
            existing.plays += entry.plays;
            // Keep the most recent datetime
            if (entry.datetime && (!existing.datetime || entry.datetime > existing.datetime)) {
                existing.datetime = entry.datetime;
            }
        } else {
            songMap.set(key, {
                song: entry.song,
                artist: entry.artist,
                album: entry.album || '',
                plays: entry.plays,
                datetime: entry.datetime || new Date().toISOString()
            });
        }
    });
    
    return Array.from(songMap.values());
}

/**
 * Sort songs by play count (descending)
 * @param {Array} songs - Song data
 * @returns {Array} Sorted songs
 */
function sortSongsByPlays(songs) {
    return songs.sort((a, b) => b.plays - a.plays);
}

/**
 * Get statistics from data
 * @param {Array} data - Data array
 * @returns {Object} Statistics
 */
function getStats(data) {
    const aggregated = aggregateSongs(data);
    const uniqueArtists = new Set(data.map(entry => entry.artist.toLowerCase()));
    
    const totalPlays = data.reduce((sum, entry) => sum + entry.plays, 0);
    
    return {
        totalPlays: totalPlays,
        uniqueSongs: aggregated.length,
        uniqueArtists: uniqueArtists.size,
        totalEntries: data.length
    };
}

// Validation Functions
/**
 * Validate entry data
 * @param {Object} entry - Entry to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateEntry(entry) {
    const errors = [];
    
    if (!entry.song || entry.song.trim() === '') {
        errors.push('Song name is required');
    }
    
    if (!entry.artist || entry.artist.trim() === '') {
        errors.push('Artist name is required');
    }
    
    if (!entry.plays || isNaN(parseInt(entry.plays)) || parseInt(entry.plays) < 1) {
        errors.push('Valid play count is required (minimum 1)');
    }
    
    if (!entry.datetime) {
        errors.push('Date and time are required');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Formatting Functions
/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
}

/**
 * Format datetime for display
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime
 */
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid datetime for formatting:', isoString);
            return 'Invalid Date';
        }
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleString('en-US', options);
    } catch (error) {
        console.error('Error formatting datetime:', isoString, error);
        return 'N/A';
    }
}

// Security Functions
/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// UI Helper Functions
/**
 * Show message to user
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, warning)
 * @param {HTMLElement} container - Container element
 */
function showMessage(message, type, container) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type} show`;
    messageEl.textContent = message;
    
    container.prepend(messageEl);
    
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

/**
 * Update active navigation link
 * @param {string} pageName - Current page name
 */
function updateActiveNav(pageName) {
    const links = document.querySelectorAll('nav a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === pageName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadData,
        getLocalStorageData,
        saveData,
        addEntry,
        parseCSVText,
        parseCSVLine,
        convertDateTimeToISO,
        aggregateSongs,
        sortSongsByPlays,
        getStats,
        validateEntry,
        formatNumber,
        formatDateTime,
        escapeHtml,
        showMessage,
        updateActiveNav
    };
}

console.log('Main.js loaded successfully');
