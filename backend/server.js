const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('ffmpeg-static');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { url, type } = req.body; // type can be 'complete', 'audio', 'video'
    if (!url || (!url.includes('youtube.com/') && !url.includes('youtu.be/'))) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const formatType = type || 'complete';
    let fileExtension = 'mp4';
    let dlOptions = {
        ffmpegLocation: ffmpeg
    };

    if (formatType === 'audio') {
        fileExtension = 'mp3';
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = 'mp3';
    } else if (formatType === 'video') {
        dlOptions.format = 'bestvideo[ext=mp4]/bestvideo';
    } else {
        // complete
        dlOptions.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    }

    // Create a temporary file path
    const tempFileName = `download_${uuidv4()}.${fileExtension}`;
    const tempFilePath = path.join(__dirname, tempFileName);
    dlOptions.output = tempFilePath;

    try {
        console.log(`Starting ${formatType} download for: ${url}`);
        
        // Execute yt-dlp
        await youtubedl(url, dlOptions);

        console.log(`Download complete, sending file...`);

        // Send the file to the client
        res.download(tempFilePath, `youtube_download.${fileExtension}`, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Clean up the temporary file after sending
            fs.unlink(tempFilePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
                else console.log('Cleaned up temp file.');
            });
        });

    } catch (err) {
        console.error(err);
        // Ensure we clean up if something failed
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download video' });
        }
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
