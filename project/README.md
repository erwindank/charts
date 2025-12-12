# Music Charts Website

A responsive, dark-themed music charts website built with vanilla HTML, CSS, and JavaScript.

## Features

- **Dashboard**: View statistics and recent plays
- **Charts**: Toggle between Top 10, 20, or 100 songs
- **Add Music**: Manual entry form and CSV/JSON file upload
- **References**: Complete documentation and examples
- **Dark Theme**: Background #0D0D0D, Accent #7AE3FF
- **Responsive Design**: Works on mobile and desktop
- **Data Aggregation**: Automatically combines plays by song + artist
- **Excel Error Filtering**: Removes entries with #NAME?, #VALUE!, etc.
- **Date Conversion**: Converts "11 Dec 2025, 20:52" to ISO format
- **Local Storage**: All data stored in browser localStorage

## Getting Started

1. Open `index.html` in a web browser
2. Add music data via the "Add Music" page
3. View statistics on the Dashboard
4. Explore charts with different size options

## File Structure

```
project/
├── index.html          # Dashboard with stats and recent plays
├── charts.html         # Top charts with 10/20/100 toggle
├── add.html           # Form and file upload page
├── references.html    # Documentation and references
├── css/
│   └── styles.css     # Shared styles
├── js/
│   └── utils.js       # Shared utilities
├── sample-data.csv    # Sample data for testing
└── README.md          # This file
```

## Data Format

### CSV Format
```csv
song,plays,datetime,artist,album
Shape of You,145,11 Dec 2025, 20:52,Ed Sheeran,Divide
```

### JSON Format
```json
[
  {
    "song": "Shape of You",
    "plays": 145,
    "datetime": "11 Dec 2025, 20:52",
    "artist": "Ed Sheeran",
    "album": "Divide"
  }
]
```

## Technologies

- HTML5 (Semantic markup)
- CSS3 (Grid, Flexbox, Variables)
- Vanilla JavaScript (ES6+)
- localStorage API
- Google Fonts (Inter, Roboto)

## Browser Support

Works on modern browsers supporting HTML5, CSS3, and ES6+ JavaScript:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Privacy

All data is stored locally in your browser. Nothing is sent to any server.
