import express from 'express';
import csv from 'csv-parser';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const app = express();
const port = 5001;

const upload = multer({ dest: 'uploads/' });

let classificationResults = {};

const loadClassificationResults = () => {
    return new Promise((resolve, reject) => {
        const results = {};
        fs.createReadStream('classification_face_images_1000.csv')
        .pipe(csv(['Image', 'Results']))  
        .on('data', (data) => {
            results[data.Image] = data.Results;  
        })
        .on('end', () => {
            console.log('Classification results loaded');
            resolve(results);
        })
        .on('error', (err) => {
            reject(err);
        });
    });
};

app.post('/', upload.single('inputFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    let filename = req.file.originalname;
    const fileWithoutExtension = path.basename(filename, path.extname(filename));

    const prediction = classificationResults[fileWithoutExtension] || 'Unknown';
    
    fs.unlinkSync(req.file.path);
    
    res.set('Content-Type', 'text/plain');
    res.send(`${fileWithoutExtension}:${prediction}`);
});

app.listen(port, async () => {
    try {
        classificationResults = await loadClassificationResults();
        console.log(classificationResults);
        console.log(`Web tier server running on port ${port}`);
    } catch (err) {
        console.error('Error loading classification results:', err);
    }
});
