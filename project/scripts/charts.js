// Charts Page JavaScript
console.log('Charts.js loading...');

// Current chart limit
let currentLimit = 10;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Charts.js DOM ready');
    updateActiveNav('charts.html');
    
    // Toggle button handlers
    const top10Btn = document.getElementById('top-10-btn');
    const top20Btn = document.getElementById('top-20-btn');
    const top100Btn = document.getElementById('top-100-btn');
    
    if (top10Btn) {
        top10Btn.addEventListener('click', function() {
            setActiveToggle(top10Btn);
            currentLimit = 10;
            renderCharts();
        });
    }
    
    if (top20Btn) {
        top20Btn.addEventListener('click', function() {
            setActiveToggle(top20Btn);
            currentLimit = 20;
            renderCharts();
        });
    }
    
    if (top100Btn) {
        top100Btn.addEventListener('click', function() {
            setActiveToggle(top100Btn);
            currentLimit = 100;
            renderCharts();
        });
    }
    
    // Initial load
    await renderCharts();
});

/**
 * Set active toggle button
 * @param {HTMLElement} activeBtn - Button to make active
 */
function setActiveToggle(activeBtn) {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

/**
 * Render charts table
 */
async function renderCharts() {
    const chartContainer = document.getElementById('chart-container');
    
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    
    // Show loading state
    chartContainer.innerHTML = '<div class="loading">Loading chart data...</div>';
    
    try {
        // Load data
        const data = await loadData();
        
        if (data.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <p>No data available yet</p>
                    <p>Add some entries or upload a CSV file to get started!</p>
                    <div class="btn-group mt-2">
                        <a href="add.html" class="btn">Add Entries</a>
                    </div>
                </div>
            `;
            return;
        }
        
        // Aggregate and sort songs
        const aggregated = aggregateSongs(data);
        const sorted = sortSongsByPlays(aggregated);
        
        // Limit to top N
        const topSongs = sorted.slice(0, currentLimit);
        
        console.log(`Displaying top ${currentLimit} songs out of ${sorted.length} total`);
        
        // Generate table HTML
        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Song / Artist</th>
                            <th>Play Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        topSongs.forEach((song, index) => {
            html += `
                <tr>
                    <td class="rank-cell">#${index + 1}</td>
                    <td>
                        <div class="song-info">
                            <div class="song-name">${escapeHtml(song.song)}</div>
                            <div class="artist-name">${escapeHtml(song.artist)}</div>
                        </div>
                    </td>
                    <td><strong>${formatNumber(song.plays)}</strong></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        chartContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error rendering charts:', error);
        chartContainer.innerHTML = `
            <div class="empty-state">
                <p>Error loading chart data</p>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

console.log('Charts.js loaded successfully');
