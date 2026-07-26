const fs = require("fs");
const path = require("path");

const requiredItems = [
  "backend/src/config/db.js",
  "backend/src/config/cloudinary.js",
  "backend/src/config/env.js",

  "backend/src/controllers",
  "backend/src/models",
  "backend/src/routes/index.js",
  "backend/src/services",

  "backend/src/middleware/errorHandler.js",
  "backend/src/middleware/notFound.js",

  "backend/src/validators",

  "backend/src/utils/ApiResponse.js",
  "backend/src/utils/ApiError.js",

  "backend/src/sockets/index.js",

  "backend/src/app.js",
  "backend/src/server.js",

  "backend/.env.example",
  "backend/.gitignore",
  "backend/package.json",

  "frontend/public",

  "frontend/src/app/App.jsx",
  "frontend/src/app/router.jsx",

  "frontend/src/features/auth",
  "frontend/src/features/presenter",
  "frontend/src/features/college",
  "frontend/src/features/admin",

  "frontend/src/components/ui",
  "frontend/src/components/common",

  "frontend/src/layouts",
  "frontend/src/hooks",
  "frontend/src/context",

  "frontend/src/services/axiosInstance.js",
  "frontend/src/services/socket.js",

  "frontend/src/i18n/index.js",
  "frontend/src/i18n/locales/en/common.json",
  "frontend/src/i18n/locales/ta/common.json",
  "frontend/src/i18n/locales/hi/common.json",

  "frontend/src/styles/index.css",

  "frontend/src/config/constants.js",

  "frontend/src/main.jsx",
  "frontend/src/App.css",

  "frontend/index.html",
  "frontend/.env.example",
  "frontend/tailwind.config.js",
  "frontend/postcss.config.js",
  "frontend/components.json",
  "frontend/vite.config.js",
  "frontend/package.json",

  ".gitignore",
  "README.md"
];

let found = 0;
let missing = 0;

console.log("\n===============================");
console.log(" Presentation Platform Checker ");
console.log("===============================\n");

requiredItems.forEach((item) => {
  const fullPath = path.join(process.cwd(), item);

  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${item}`);
    found++;
  } else {
    console.log(`❌ ${item}`);
    missing++;
  }
});

console.log("\n===============================");
console.log(`✅ Found   : ${found}`);
console.log(`❌ Missing : ${missing}`);
console.log(`📦 Total   : ${requiredItems.length}`);
console.log("===============================\n");

if (missing === 0) {
  console.log("🎉 Project structure is PERFECT!");
} else {
  console.log("⚠ Some files/folders are missing.");
}