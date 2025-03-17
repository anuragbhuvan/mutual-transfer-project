/**
 * Mutual Transfer Project - Google Cloud Backup Script
 * 
 * यह स्क्रिप्ट प्रोजेक्ट का बैकअप बनाती है और इसे Google Cloud Storage पर अपलोड करती है।
 */

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';

// ES मॉड्यूल में __dirname प्राप्त करें
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// बैकअप फंक्शन
async function backupProject() {
  try {
    // बैकअप का टाइमस्टैम्प
    const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
    const backupFileName = `mutual-transfer-backup-${timestamp}.zip`;
    const outputPath = path.join(__dirname, backupFileName);
    
    // क्रिएट ZIP आर्काइव
    console.log(`प्रोजेक्ट को ज़िप कर रहा है: ${backupFileName}`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // मैक्सिमम कंप्रेशन
    });
    
    archive.pipe(output);
    
    // Google Cloud Service Account क्रेडेंशियल फाइल को इग्नोर करें
    archive.glob('**/*', {
      cwd: __dirname,
      ignore: [
        'node_modules/**',
        backupFileName,
        'cloud-backup.js',
        '.git/**',
        '*.log',
        'serviceAccountKey.json',
        'build/**',
        'dist/**'
      ]
    });
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });
    
    console.log(`ज़िप फाइल बनाई गई: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Google Cloud Storage में अपलोड करें
    console.log('Google Cloud Storage में अपलोड कर रहा है...');
    
    // सर्विस अकाउंट की फाइल का पाथ
    const keyFilePath = path.join(__dirname, 'serviceAccountKey.json');
    
    // Google Cloud Storage इंस्टेंस क्रिएट करें
    const storage = new Storage({
      keyFilename: keyFilePath
    });
    
    // बकेट का नाम - अपने बकेट के नाम से बदलें
    const bucketName = 'mutual-transfer-backup-bucket';
    
    // फाइल अपलोड करें
    await storage.bucket(bucketName).upload(outputPath, {
      destination: `backups/${backupFileName}`,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    console.log(`सफलतापूर्वक अपलोड किया गया: gs://${bucketName}/backups/${backupFileName}`);
    
    // लोकल बैकअप फाइल डिलीट करें (ऑप्शनल)
    fs.unlinkSync(outputPath);
    console.log('लोकल ज़िप फाइल डिलीट कर दी गई');
    
    console.log('बैकअप प्रक्रिया पूरी हुई!');
    
  } catch (error) {
    console.error('बैकअप प्रक्रिया में त्रुटि:', error);
  }
}

// बैकअप प्रोसेस शुरू करें
backupProject(); 