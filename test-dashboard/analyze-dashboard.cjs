const fs = require('fs');

const html = fs.readFileSync('./dashboard.html', 'utf-8');

console.log('\n📊 DASHBOARD ANALYSIS\n');
console.log('='.repeat(60));

// Count sections
const sections = html.match(/id="section-\w+"/g) || [];
console.log(`\n✅ Main Sections: ${sections.length}`);
sections.forEach(s => {
  const name = s.match(/section-(\w+)/)[1];
  console.log(`   - ${name}`);
});

// Count buttons
const buttons = html.match(/<button/g) || [];
console.log(`\n🔘 Buttons: ${buttons.length}`);

// Count forms
const forms = html.match(/<form/g) || [];
console.log(`📝 Forms: ${forms.length}`);

// Count API calls
const apiCalls = html.match(/fetch\('\/api\/[^']+/g) || [];
const uniqueAPIs = [...new Set(apiCalls.map(c => c.split("'")[1]))];
console.log(`\n🔌 API Endpoints Used: ${uniqueAPIs.length}`);
uniqueAPIs.forEach(api => console.log(`   - ${api}`));

// Count JavaScript functions
const functions = html.match(/function \w+\(/g) || [];
console.log(`\n⚡ JavaScript Functions: ${functions.length}`);

// External resources
const cdn = html.match(/https:\/\/cdn\.\w+/g) || [];
const uniqueCDN = [...new Set(cdn)];
console.log(`\n🌐 External CDN Resources: ${uniqueCDN.length}`);
uniqueCDN.forEach(c => console.log(`   - ${c}`));

// Icons
const icons = html.match(/class="[^"]*fa-[\w-]+/g) || [];
const uniqueIcons = [...new Set(icons.map(i => i.match(/fa-([\w-]+)/)[1]))];
console.log(`\n🎨 Font Awesome Icons: ${uniqueIcons.length}`);
console.log(`   Top 10: ${uniqueIcons.slice(0, 10).join(', ')}`);

// Tailwind classes
const bgColors = html.match(/bg-(gray|blue|green|red|yellow|purple|orange)-\d+/g) || [];
const uniqueBgColors = [...new Set(bgColors)];
console.log(`\n🎨 Tailwind Background Colors: ${uniqueBgColors.length}`);
console.log(`   Used: ${uniqueBgColors.slice(0, 15).join(', ')}`);

// File size
const size = fs.statSync('./dashboard.html').size;
console.log(`\n📦 File Size: ${(size / 1024).toFixed(2)} KB`);
console.log(`📝 Lines: ${html.split('\n').length}`);

console.log('\n' + '='.repeat(60) + '\n');
