// Storage key for localStorage
const STORAGE_KEY = 'musicChartsData';

/**
 * Parse CSV data into array of objects
 * @param {string} csvText - CSV text content
 * @returns {Array} Array of song objects
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV with commas inside quoted fields
        const values = parseCSVLine(line);
        
        // Skip if we don't have enough values or too many
        if (values.length < headers.length) continue;
        
        // If we have more values than headers, it might be due to unquoted commas in data
        // For our datetime format "11 Dec 2025, 20:52", we need to handle this specially
        if (values.length > headers.length) {
            // Find datetime column index
            const datetimeIndex = headers.indexOf('datetime');
            if (datetimeIndex >= 0 && values.length === headers.length + 1) {
                // Merge the extra value into datetime
                values[datetimeIndex] = values[datetimeIndex] + ',' + values[datetimeIndex + 1];
                values.splice(datetimeIndex + 1, 1);
            } else {
                continue; // Skip invalid lines
            }
        }

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });

        // Filter out Excel errors
        if (!isExcelError(obj)) {
            data.push(obj);
        }
    }

    return data;
}

/**
 * Parse a single CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

/**
 * Check if any field contains Excel error
 * @param {Object} obj - Data object
 * @returns {boolean} True if contains Excel error
 */
function isExcelError(obj) {
    for (const key in obj) {
        const value = String(obj[key]);
        if (value.includes('#NAME?') || 
            value.includes('#VALUE!') || 
            value.includes('#REF!') || 
            value.includes('#DIV/0!') ||
            value.includes('#N/A') ||
            value.includes('#NULL!') ||
            value.includes('#NUM!')) {
            return true;
        }
    }
    return false;
}

/**
 * Convert datetime string to ISO format
 * Input format: "11 Dec 2025, 20:52"
 * Output format: ISO 8601
 * @param {string} dateStr - Date string
 * @returns {string} ISO formatted date string
 */
function convertToISO(dateStr) {
    if (!dateStr) return new Date().toISOString();

    try {
        // Parse format: "11 Dec 2025, 20:52"
        const months = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };

        const parts = dateStr.trim().split(',');
        if (parts.length !== 2) {
            // Try to parse as regular date
            return new Date(dateStr).toISOString();
        }

        const datePart = parts[0].trim().split(' ');
        const timePart = parts[1].trim().split(':');

        if (datePart.length !== 3 || timePart.length !== 2) {
            return new Date(dateStr).toISOString();
        }

        const day = parseInt(datePart[0]);
        const month = months[datePart[1].toLowerCase()];
        const year = parseInt(datePart[2]);
        const hour = parseInt(timePart[0]);
        const minute = parseInt(timePart[1]);

        const date = new Date(year, month, day, hour, minute);
        return date.toISOString();
    } catch (e) {
        console.error('Error converting date:', dateStr, e);
        return new Date().toISOString();
    }
}

/**
 * Load data from localStorage
 * @returns {Array} Array of song objects
 */
function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading data:', e);
        return [];
    }
}

/**
 * Save data to localStorage
 * @param {Array} data - Array of song objects
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        return false;
    }
}

/**
 * Add new songs to storage
 * @param {Array} songs - Array of song objects
 * @returns {boolean} Success status
 */
function addSongs(songs) {
    const currentData = loadData();
    
    // Normalize and convert datetime for new songs, filter out invalid entries
    const normalizedSongs = songs
        .map(song => ({
            song: song.song || '',
            plays: parseInt(song.plays) || 0,
            datetime: convertToISO(song.datetime),
            artist: song.artist || '',
            album: song.album || ''
        }))
        .filter(song => song.song && song.artist); // Only keep songs with title and artist

    const updatedData = [...currentData, ...normalizedSongs];
    return saveData(updatedData);
}

/**
 * Aggregate plays by song and artist
 * @returns {Array} Aggregated data sorted by total plays
 */
function aggregateData() {
    const data = loadData();
    const aggregated = {};

    data.forEach(item => {
        const key = `${item.song}|||${item.artist}`.toLowerCase();
        
        if (!aggregated[key]) {
            aggregated[key] = {
                song: item.song,
                artist: item.artist,
                album: item.album,
                totalPlays: 0,
                playHistory: []
            };
        }

        aggregated[key].totalPlays += item.plays;
        aggregated[key].playHistory.push({
            plays: item.plays,
            datetime: item.datetime
        });
    });

    // Convert to array and sort by total plays
    return Object.values(aggregated).sort((a, b) => b.totalPlays - a.totalPlays);
}

/**
 * Get recent plays sorted by datetime
 * @param {number} limit - Number of results to return
 * @returns {Array} Recent plays
 */
function getRecentPlays(limit = 10) {
    const data = loadData();
    return data
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
        .slice(0, limit);
}

/**
 * Get statistics from the data
 * @returns {Object} Statistics object
 */
function getStats() {
    const data = loadData();
    const aggregated = aggregateData();

    const totalPlays = data.reduce((sum, item) => sum + item.plays, 0);
    const uniqueSongs = aggregated.length;
    const uniqueArtists = new Set(data.map(item => item.artist.toLowerCase())).size;
    const uniqueAlbums = new Set(data.map(item => item.album.toLowerCase())).size;

    return {
        totalPlays,
        uniqueSongs,
        uniqueArtists,
        uniqueAlbums,
        totalEntries: data.length
    };
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Clear all data from localStorage
 */
function clearData() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export data as JSON
 * @returns {string} JSON string
 */
function exportJSON() {
    const data = loadData();
    return JSON.stringify(data, null, 2);
}

/**
 * Export aggregated data as JSON
 * @returns {string} JSON string
 */
function exportAggregatedJSON() {
    const data = aggregateData();
    return JSON.stringify(data, null, 2);
}

/**
 * Show alert message
 * @param {string} message - Message text
 * @param {string} type - Alert type (success, error, info)
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return num.toLocaleString('en-US');
}
