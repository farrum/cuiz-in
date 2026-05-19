const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    if (filePath.endsWith('.png') || filePath.endsWith('.svg') || filePath.endsWith('.css')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    if (content.includes('points') || content.includes('Points') || content.includes('POINTS') || content.includes('Pts')) {
        content = content.replace(/points/g, 'gems');
        content = content.replace(/Points/g, 'Gems');
        content = content.replace(/POINTS/g, 'GEMS');
        content = content.replace(/Pts/g, 'Gems'); // Replaces "Pts" with "Gems"
        content = content.replace(/10 Gems/g, '1 Gem'); // Standardize reward down to 1 Gem where it was 10 Points hardcoded
        hasChanges = true;
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    });
}

traverseDirectory(directoryPath);
console.log('Migration of text complete.');
