const fs = require('fs');
const path = require('path');

// Read existing file
const targetPath = path.join(__dirname, 'backend', 'src', 'seed', 'pakistanHospitalsData.js');
console.log('Target path:', targetPath);
