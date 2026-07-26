const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/features/public/api/publicApi.js',

  'frontend/src/features/public/components/PublicNavbar.jsx',
  'frontend/src/features/public/components/PublicFooter.jsx',

  'frontend/src/layouts/PublicLayout.jsx',

  'frontend/src/features/public/pages/HomePage.jsx',
  'frontend/src/features/public/pages/FindPresentersPage.jsx',
  'frontend/src/features/public/pages/FindOpportunitiesPage.jsx',
  'frontend/src/features/public/pages/CollegesPage.jsx',
  'frontend/src/features/public/pages/HowItWorksPage.jsx',
  'frontend/src/features/public/pages/PricingPage.jsx',
  'frontend/src/features/public/pages/AboutPage.jsx',
  'frontend/src/features/public/pages/ContactPage.jsx',
];

files.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);

  // Create parent directory if it doesn't exist
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  // Create the file if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '');
    console.log(`✅ Created: ${file}`);
  } else {
    console.log(`✔ Already exists: ${file}`);
  }
});

console.log('\n🎉 File creation complete.');
