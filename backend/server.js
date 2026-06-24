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
    const { url } = req.body;
    if (!url || (!url.includes('youtube.com/') && !url.includes('youtu.be/'))) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Create a temporary file path
    const tempFileName = `video_${uuidv4()}.mp4`;
    const tempFilePath = path.join(__dirname, tempFileName);

    try {
        console.log(`Starting high-quality download for: ${url}`);
        
        // This will download the best video and audio, and merge them using ffmpeg
        await youtubedl(url, {
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            output: tempFilePath,
            ffmpegLocation: ffmpeg
        });

        console.log(`Download complete, sending file...`);

        // Send the file to the client
        res.download(tempFilePath, 'video.mp4', (err) => {
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
