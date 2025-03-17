/**
 * Mutual Transfer Project - Automated Backup Script
 * 
 * यह स्क्रिप्ट आपके प्रोजेक्ट का बैकअप बनाती है और इसे Google Drive या OneDrive पर 
 * अपलोड करने के निर्देश देती है।
 * 
 * उपयोग: 
 * 1. node backup.js - वर्तमान प्रोजेक्ट का बैकअप बनाता है
 * 
 * आवश्यकताएँ:
 * - Node.js
 * - fs-extra, archiver, और moment पैकेज
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

// Config
const config = {
  backupDir: path.join(__dirname, 'backups'),
  excludeDirs: ['node_modules', '.git', 'backups'],
  keepBackups: 5 // कितने बैकअप फाइल्स रखना है
};

/**
 * प्रोजेक्ट का बैकअप बनाता है
 */
async function createBackup() {
  try {
    // बैकअप डायरेक्टरी बनाएँ, अगर मौजूद नहीं है तो
    await fs.ensureDir(config.backupDir);
    
    // बैकअप फाइल का नाम - तारीख और समय के साथ
    const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
    const backupFileName = `mutual-transfer-backup-${timestamp}.zip`;
    const backupFilePath = path.join(config.backupDir, backupFileName);
    
    // zip फाइल और स्ट्रीम सेटअप
    const output = fs.createWriteStream(backupFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // अधिकतम कम्प्रेशन
    });
    
    // पाइप आर्काइव डेटा को आउटपुट फाइल में
    archive.pipe(output);
    
    // Google Cloud Service Account क्रेडेंशियल फाइल को इग्नोर करें
    archive.glob('**/*', {
      cwd: __dirname,
      ignore: [
        'node_modules/**',
        backupFileName,
        'backup.js',
        '.git/**',
        '*.log',
        'serviceAccountKey.json',
        'build/**',
        'dist/**'
      ]
    });
    
    // आर्काइव को फाइनलाइज करें
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });
    
    // प्रतीक्षा करें कि आउटपुट स्ट्रीम समाप्त हो जाए
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`✅ बैकअप सफलतापूर्वक बनाया गया: ${backupFileName}`);
        console.log(`📦 बैकअप साइज़: ${(fs.statSync(backupFilePath).size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📂 बैकअप लोकेशन: ${backupFilePath}`);
        
        // पुराने बैकअप्स को हटाएँ
        cleanupOldBackups().then(resolve).catch(reject);
      });
      
      output.on('error', reject);
    });
  } catch (error) {
    console.error('❌ बैकअप बनाने में त्रुटि:', error);
  }
}

/**
 * पुराने बैकअप्स को हटाता है और सिर्फ निर्दिष्ट संख्या में हाल ही के बैकअप्स को रखता है
 */
async function cleanupOldBackups() {
  try {
    // बैकअप फोल्डर की सभी फाइल्स पढ़ें
    const files = await fs.readdir(config.backupDir);
    
    // सिर्फ zip फाइल्स फ़िल्टर करें और उन्हें डेट के अनुसार सॉर्ट करें (नए से पुराने)
    const zipFiles = files
      .filter(file => file.endsWith('.zip') && file.includes('mutual-transfer-backup'))
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        time: fs.statSync(path.join(config.backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // केवल नए बैकअप्स को रखें, बाकी हटा दें
    if (zipFiles.length > config.keepBackups) {
      const filesToDelete = zipFiles.slice(config.keepBackups);
      
      for (const file of filesToDelete) {
        await fs.remove(file.path);
        console.log(`🗑️ पुराना बैकअप हटाया गया: ${file.name}`);
      }
      
      console.log(`ℹ️ कुल ${filesToDelete.length} पुराने बैकअप हटाए गए।`);
    }
  } catch (error) {
    console.error('❌ पुराने बैकअप्स को हटाने में त्रुटि:', error);
  }
}

/**
 * क्लाउड बैकअप के लिए निर्देश
 */
function showCloudInstructions() {
  console.log('\n========== क्लाउड बैकअप निर्देश ==========');
  console.log('अपने प्रोजेक्ट के बैकअप को क्लाउड पर अपलोड करने के चरण:');
  console.log('\n1️⃣ Google Drive पर अपलोड:');
  console.log('   - drive.google.com पर जाएँ और लॉगिन करें');
  console.log('   - "नया" या "+" बटन पर क्लिक करें और "फाइल अपलोड" चुनें');
  console.log('   - "backups" फोल्डर से अपना बैकअप चुनें');
  
  console.log('\n2️⃣ OneDrive पर अपलोड:');
  console.log('   - onedrive.live.com पर जाएँ और लॉगिन करें');
  console.log('   - "अपलोड" बटन पर क्लिक करें और "फाइल्स" चुनें');
  console.log('   - "backups" फोल्डर से अपना बैकअप चुनें');
  
  console.log('\n3️⃣ ऑटोमेटिक क्लाउड बैकअप सेटअप:');
  console.log('   - Google Drive या OneDrive डेस्कटॉप एप्लिकेशन इंस्टॉल करें');
  console.log('   - बैकअप फोल्डर को सिंक फोल्डर में मूव करें या कॉपी करें');
  console.log('   - अब आपके बैकअप स्वचालित रूप से क्लाउड पर सिंक होंगे');
  
  console.log('\n✨ सुझाव: महत्वपूर्ण अपडेट करने से पहले हमेशा बैकअप लें');
  console.log('====================================\n');
}

// मुख्य प्रोग्राम
async function main() {
  console.log('🔄 मुचुअल ट्रांसफर प्रोजेक्ट बैकअप प्रक्रिया शुरू हुई...');
  
  await createBackup();
  showCloudInstructions();
  
  console.log('✨ बैकअप प्रक्रिया पूरी हुई।');
}

// स्क्रिप्ट शुरू करें
main().catch(err => {
  console.error('❌ बैकअप प्रक्रिया में त्रुटि:', err);
  process.exit(1);
}); 