import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  console.log('Starting screenshot capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // standard portrait mobile size matching our cards
    deviceScaleFactor: 3, // 3x pixel ratio for extremely sharp/retina-quality screenshots
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Define screens to capture
  const targets = [
    {
      url: 'http://localhost:8081/telegram-mock?demo=true',
      name: 'telegram-bot.png',
    },
    {
      url: 'http://localhost:8081/dashboard?demo=true',
      name: 'dashboard.png',
    },
    {
      url: 'http://localhost:8081/dashboard?demo=true',
      name: 'main-app.png',
    },
    {
      url: 'http://localhost:8081/riwayat?demo=true&openAdd=true',
      name: 'order-form.png',
    },
    {
      url: 'http://localhost:8081/riwayat?demo=true',
      name: 'orders.png',
    },
    {
      url: 'http://localhost:8081/dashboard?demo=true&view=growth',
      name: 'stats.png',
    }
  ];

  const destDir = path.join(__dirname, '../public/screenshots');

  for (const target of targets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Let any entry/layout transition animations run (0.42s - 1.05s)
      await page.waitForTimeout(2500);
      
      // Take the screenshot directly at the initial customer info step to represent what appears immediately after clicking the + button.
      
      const destPath = path.join(destDir, target.name);
      console.log(`Saving screenshot to ${destPath}...`);
      await page.screenshot({ path: destPath });
    } catch (err) {
      console.error(`Failed to capture ${target.name}:`, err);
    }
  }

  await browser.close();
  console.log('Capture completed successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
