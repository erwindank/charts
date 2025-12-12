// Add Entry Page JavaScript
console.log('Add.js loading...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Add.js DOM ready');
    updateActiveNav('add.html');
    
    // Form elements
    const manualForm = document.getElementById('manual-entry-form');
    const fileInput = document.getElementById('file-input');
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileNameDisplay = document.getElementById('file-name');
    const toggleFormatBtn = document.getElementById('toggle-format-btn');
    const formatExample = document.getElementById('format-example');
    const checkDataBtn = document.getElementById('check-data-btn');
    
    // Message containers
    const manualMessageContainer = document.getElementById('manual-message-container');
    const fileMessageContainer = document.getElementById('file-message-container');
    
    // Manual Entry Form Handler
    if (manualForm) {
        manualForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Manual form submitted');
            
            // Get form values
            const song = document.getElementById('song').value.trim();
            const artist = document.getElementById('artist').value.trim();
            const album = document.getElementById('album').value.trim();
            const plays = parseInt(document.getElementById('plays').value);
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            
            // Create datetime ISO string
            const datetime = `${date}T${time}:00.000Z`;
            
            // Create entry object
            const entry = {
                song: song,
                artist: artist,
                album: album,
                plays: plays,
                datetime: datetime
            };
            
            // Validate entry
            const validation = validateEntry(entry);
            
            if (!validation.valid) {
                showMessage(validation.errors.join(', '), 'error', manualMessageContainer);
                return;
            }
            
            // Add entry to localStorage
            const success = addEntry(entry);
            
            if (success) {
                showMessage('Entry added successfully!', 'success', manualMessageContainer);
                manualForm.reset();
                displayRecentEntries();
            } else {
                showMessage('Failed to add entry. Please try again.', 'error', manualMessageContainer);
            }
        });
    }
    
    // File Upload Handler
    if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                fileNameDisplay.textContent = `Selected: ${file.name}`;
                handleFileUpload(file);
            }
        });
        
        // Drag and drop support
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = 'var(--accent-hover)';
        });
        
        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = 'var(--accent)';
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = 'var(--accent)';
            
            const file = e.dataTransfer.files[0];
            if (file) {
                fileNameDisplay.textContent = `Selected: ${file.name}`;
                handleFileUpload(file);
            }
        });
    }
    
    // Toggle Format Example
    if (toggleFormatBtn && formatExample) {
        toggleFormatBtn.addEventListener('click', function() {
            formatExample.classList.toggle('show');
            if (formatExample.classList.contains('show')) {
                toggleFormatBtn.textContent = 'Hide Format Examples';
            } else {
                toggleFormatBtn.textContent = 'Show Format Examples';
            }
        });
    }
    
    // Check Data Button
    if (checkDataBtn) {
        checkDataBtn.addEventListener('click', function() {
            const data = getLocalStorageData();
            console.log('localStorage data:', data);
            
            if (data.length > 0) {
                showMessage(`Found ${data.length} entries in localStorage`, 'success', fileMessageContainer);
            } else {
                showMessage('No data found in localStorage', 'warning', fileMessageContainer);
            }
        });
    }
    
    // Display recent entries on load
    displayRecentEntries();
});

/**
 * Handle file upload (CSV or JSON)
 * @param {File} file - Uploaded file
 */
function handleFileUpload(file) {
    console.log('Handling file upload:', file.name);
    
    const fileMessageContainer = document.getElementById('file-message-container');
    const importSummarySection = document.getElementById('import-summary-section');
    
    // Check file type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isJSON = fileName.endsWith('.json');
    
    if (!isCSV && !isJSON) {
        showMessage('Please upload a CSV or JSON file', 'error', fileMessageContainer);
        return;
    }
    
    // Read file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        
        try {
            let entries = [];
            
            if (isCSV) {
                entries = parseCSVText(content);
            } else if (isJSON) {
                entries = JSON.parse(content);
                if (!Array.isArray(entries)) {
                    throw new Error('JSON file must contain an array');
                }
            }
            
            console.log(`Parsed ${entries.length} entries from file`);
            
            // Validate and import entries
            const result = importEntries(entries);
            
            // Display import summary
            displayImportSummary(result);
            importSummarySection.style.display = 'block';
            
            if (result.success > 0) {
                showMessage(`Successfully imported ${result.success} entries`, 'success', fileMessageContainer);
                displayRecentEntries();
            } else {
                showMessage('No entries were imported', 'error', fileMessageContainer);
            }
            
        } catch (error) {
            console.error('Error processing file:', error);
            showMessage(`Error processing file: ${error.message}`, 'error', fileMessageContainer);
        }
    };
    
    reader.onerror = function() {
        showMessage('Error reading file', 'error', fileMessageContainer);
    };
    
    reader.readAsText(file);
}

/**
 * Import multiple entries
 * @param {Array} entries - Entries to import
 * @returns {Object} Import results
 */
function importEntries(entries) {
    const existingData = getLocalStorageData();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    entries.forEach((entry, index) => {
        // Validate entry
        const validation = validateEntry(entry);
        
        if (validation.valid) {
            existingData.push(entry);
            successCount++;
        } else {
            errorCount++;
            errors.push(`Entry ${index + 1}: ${validation.errors.join(', ')}`);
        }
    });
    
    // Save all data
    if (successCount > 0) {
        saveData(existingData);
    }
    
    return {
        success: successCount,
        errors: errorCount,
        errorDetails: errors
    };
}

/**
 * Display import summary
 * @param {Object} result - Import result
 */
function displayImportSummary(result) {
    const successCountEl = document.getElementById('success-count');
    const errorCountEl = document.getElementById('error-count');
    const totalCountEl = document.getElementById('total-count');
    
    if (successCountEl) successCountEl.textContent = formatNumber(result.success);
    if (errorCountEl) errorCountEl.textContent = formatNumber(result.errors);
    if (totalCountEl) totalCountEl.textContent = formatNumber(result.success + result.errors);
    
    // Log errors for debugging
    if (result.errorDetails.length > 0) {
        console.warn('Import errors:', result.errorDetails);
    }
}

/**
 * Display recent entries from localStorage
 */
function displayRecentEntries() {
    const recentList = document.getElementById('recent-entries-list');
    if (!recentList) return;
    
    const data = getLocalStorageData();
    
    if (data.length === 0) {
        recentList.innerHTML = '<div class="empty-state"><p>No entries added yet</p></div>';
        return;
    }
    
    // Get last 3 entries
    const recentEntries = data.slice(-3).reverse();
    
    let html = '<div class="recent-plays">';
    
    recentEntries.forEach(entry => {
        html += `
            <div class="play-item">
                <div class="play-header">
                    <span class="play-song">${escapeHtml(entry.song)}</span>
                    <span class="play-count">${formatNumber(entry.plays)} plays</span>
                </div>
                <div class="play-artist">${escapeHtml(entry.artist)}</div>
                <div class="play-meta">
                    ${entry.album ? `<span>📀 ${escapeHtml(entry.album)}</span>` : ''}
                    <span>🕒 ${formatDateTime(entry.datetime)}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    recentList.innerHTML = html;
}

console.log('Add.js loaded successfully');
