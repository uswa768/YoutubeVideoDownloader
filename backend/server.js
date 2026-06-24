const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url || (!url.includes('youtube.com/') && !url.includes('youtu.be/'))) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        console.log(`Starting download for: ${url}`);
        
        // We set generic filename because getting the title requires a separate call which takes time
        res.header('Content-Disposition', `attachment; filename="video.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Stream video directly using youtube-dl-exec
        const subprocess = youtubedl.exec(url, {
            format: 'best',
            output: '-' // tells yt-dlp to write output to stdout
        });

        subprocess.stdout.pipe(res);

        subprocess.on('close', (code) => {
            console.log(`Process exited with code ${code}`);
        });

        subprocess.stderr.on('data', (data) => {
            console.error(`yt-dlp error: ${data}`);
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download video' });
        }
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
