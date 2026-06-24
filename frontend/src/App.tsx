import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [formatType, setFormatType] = useState('complete');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // In a real production app, the backend URL would be an environment variable.
      // Assuming backend runs on 3001 locally.
      const response = await fetch('http://localhost:3001/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type: formatType }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download');
      }

      // Handle the file download blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Get filename from header if possible, else default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = formatType === 'audio' ? 'download.mp3' : 'download.mp4';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length >= 2) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>YT Downloader</h1>
        <p>Save your favorite media quickly and easily</p>
      </header>

      <main className="downloader-box">
        <div className="input-group">
          <label htmlFor="url">YouTube URL</label>
          <input
            id="url"
            type="text"
            className="url-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="format">Download Format</label>
          <select 
            id="format" 
            className="url-input select-input"
            value={formatType}
            onChange={(e) => setFormatType(e.target.value)}
            disabled={loading}
          >
            <option value="complete">Complete Video (Video + Audio)</option>
            <option value="video">Video Only (No Audio)</option>
            <option value="audio">Audio Only (MP3)</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="download-btn" 
          onClick={handleDownload} 
          disabled={loading}
        >
          {loading ? (
            <><span className="loader"></span> Downloading...</>
          ) : (
            'Download'
          )}
        </button>
      </main>
    </div>
  );
}

export default App;
