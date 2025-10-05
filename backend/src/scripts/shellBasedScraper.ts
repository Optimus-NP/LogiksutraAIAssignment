import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import Book from '../models/Book';

dotenv.config();

const execAsync = promisify(exec);

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connected for shell-based scraping');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const generateShellScript = async (books: any[], bookUrlMap: Map<string, string>): Promise<string> => {
  const shellScriptPath = path.join(__dirname, '../../scrape-amazon.sh');
  const tempDir = '/tmp/amazon-scraper';
  
  let shellScript = `#!/bin/bash
echo "🚀 Starting Amazon book cover scraping with wget..."
echo "📁 Creating temp directory: ${tempDir}"
mkdir -p ${tempDir}

`;

  // Add wget commands for each book
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const amazonUrl = bookUrlMap.get(book.title);
    
    if (amazonUrl) {
      const fullUrl = amazonUrl.startsWith('http') ? amazonUrl : `https://${amazonUrl}`;
      const fileName = `book_${i + 1}.html`;
      
      shellScript += `echo "📚 Downloading: ${book.title}"
wget -q --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${fullUrl}" -O "${tempDir}/${fileName}"
if [ $? -eq 0 ]; then
    echo "  ✅ Downloaded successfully: ${fileName}"
else
    echo "  ❌ Failed to download: ${fileName}"
fi
sleep 3

`;
    }
  }

  shellScript += `echo "✅ All downloads completed!"
echo "📁 Files saved in: ${tempDir}"
ls -la ${tempDir}
`;

  // Write shell script to file
  fs.writeFileSync(shellScriptPath, shellScript);
  
  // Make script executable
  await execAsync(`chmod +x ${shellScriptPath}`);
  
  console.log(`📜 Shell script created: ${shellScriptPath}`);
  return shellScriptPath;
};

const extractImagesFromFiles = async (books: any[], bookUrlMap: Map<string, string>): Promise<any[]> => {
  const tempDir = '/tmp/amazon-scraper';
  const results: any[] = [];

  console.log(`\n🔍 Extracting images from downloaded HTML files...`);

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const fileName = `book_${i + 1}.html`;
    const filePath = path.join(tempDir, fileName);
    
    console.log(`\n📖 Processing ${i + 1}/${books.length}: "${book.title}"`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ HTML file not found: ${filePath}`);
      
      results.push({
        bookNumber: i + 1,
        title: book.title,
        author: book.author,
        status: 'HTML_FILE_NOT_FOUND',
        amazonUrl: bookUrlMap.get(book.title),
        extractedImageUrl: null,
        imageType: 'ERROR'
      });
      continue;
    }

    try {
      const html = fs.readFileSync(filePath, 'utf8');
      console.log(`  📄 HTML file size: ${Math.round(html.length / 1024)}KB`);
      
      let imageUrl: string | null = null;
      let extractionMethod = '';

      // 1. Try data-old-hires (highest quality)
      console.log(`  🔍 Looking for data-old-hires pattern...`);
      const dataOldHiresMatch = html.match(/data-old-hires="([^"]+)"/i);
      if (dataOldHiresMatch && dataOldHiresMatch[1]) {
        imageUrl = dataOldHiresMatch[1];
        extractionMethod = 'data-old-hires';
        console.log(`  🎯 ✅ FOUND HIGH-RES IMAGE!`);
        console.log(`  📸 ${imageUrl}`);
      }

      // 2. Try landingImage src
      if (!imageUrl) {
        console.log(`  🔍 Looking for landingImage src...`);
        const landingImageMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/i);
        if (landingImageMatch && landingImageMatch[1] && landingImageMatch[1].includes('amazon')) {
          imageUrl = landingImageMatch[1];
          extractionMethod = 'landingImage-src';
          console.log(`  ✅ Found via landingImage src!`);
          console.log(`  📸 ${imageUrl}`);
        }
      }

      // 3. Try dynamic image JSON data
      if (!imageUrl) {
        console.log(`  🔍 Looking for dynamic image JSON...`);
        const dynamicImageMatch = html.match(/data-a-dynamic-image="([^"]+)"/i);
        if (dynamicImageMatch && dynamicImageMatch[1]) {
          try {
            const jsonStr = dynamicImageMatch[1].replace(/&quot;/g, '"');
            const imageData = JSON.parse(jsonStr);
            
            console.log(`  📊 Found ${Object.keys(imageData).length} image variants`);
            
            let bestUrl = null;
            let maxPixels = 0;
            
            for (const [url, dimensions] of Object.entries(imageData)) {
              const [width, height] = dimensions as [number, number];
              const pixels = width * height;
              if (pixels > maxPixels) {
                maxPixels = pixels;
                bestUrl = url;
              }
            }
            
            if (bestUrl) {
              imageUrl = bestUrl;
              extractionMethod = 'dynamic-image-json';
              console.log(`  ✅ Selected highest res from JSON: ${maxPixels}px`);
              console.log(`  📸 ${imageUrl}`);
            }
          } catch (parseError) {
            console.log(`  ❌ JSON parse failed: ${parseError}`);
          }
        }
      }

      // Store result
      const result = {
        bookNumber: i + 1,
        title: book.title,
        author: book.author,
        status: imageUrl ? 'SUCCESS_REAL_IMAGE' : 'NO_IMAGE_FOUND',
        amazonUrl: bookUrlMap.get(book.title),
        extractedImageUrl: imageUrl,
        extractionMethod: extractionMethod,
        imageType: imageUrl ? 'REAL_AMAZON_IMAGE' : 'NOT_FOUND',
        htmlSize: Math.round(html.length / 1024) + 'KB'
      };
      
      results.push(result);
      
      // Print result immediately
      console.log(`\n  🖼️  === EXTRACTION RESULT ===`);
      if (imageUrl) {
        console.log(`  🎉 SUCCESS: Real Amazon image found!`);
        console.log(`  📸 Method: ${extractionMethod}`);
        console.log(`  🔗 Image URL: ${imageUrl}`);
      } else {
        console.log(`  ❌ No Amazon image found in HTML`);
      }
      console.log(`  ============================`);

    } catch (error: any) {
      console.log(`  ❌ Error processing file: ${error.message}`);
      
      results.push({
        bookNumber: i + 1,
        title: book.title,
        author: book.author,
        status: 'PROCESSING_ERROR',
        amazonUrl: bookUrlMap.get(book.title),
        extractedImageUrl: null,
        error: error.message,
        imageType: 'ERROR'
      });
    }
  }

  return results;
};

const shellBasedAmazonScraper = async (): Promise<void> => {
  try {
    console.log('🐚 ===== SHELL-BASED AMAZON SCRAPER =====\n');
    console.log('💡 Strategy: Node.js → Shell Script → wget → grep');
    console.log('📊 Processing ALL books in database\n');

    // Read Amazon URLs from CSV
    const booksFile = path.join(__dirname, '../../amazon-books-data/Top-100 Trending Books.csv');
    const bookUrlMap = new Map<string, string>();
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(booksFile)
        .pipe(csv())
        .on('data', (record: any) => {
          if (record['book title'] && record.url) {
            bookUrlMap.set(record['book title'].trim(), record.url.trim());
          }
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    console.log(`📖 Loaded ${bookUrlMap.size} Amazon URLs from CSV`);

    // Get all 100 books
    const books = await Book.find({});
    console.log(`🔍 Found ${books.length} books to process\n`);

    // Step 1: Generate shell script
    console.log(`⚙️  Step 1: Generating shell script...`);
    const shellScriptPath = await generateShellScript(books, bookUrlMap);

    // Step 2: Execute shell script
    console.log(`🚀 Step 2: Executing shell script...`);
    console.log(`📜 Running: ${shellScriptPath}\n`);
    
    try {
      const { stdout } = await execAsync(`bash ${shellScriptPath}`);
      console.log(`Shell script output:\n${stdout}`);
    } catch (shellError: any) {
      console.log(`⚠️  Shell script completed with some errors: ${shellError.message}`);
      // Continue anyway - some files might have been downloaded
    }

    // Step 3: Extract images from downloaded HTML files
    console.log(`\n🔍 Step 3: Extracting images from HTML files...`);
    const results = await extractImagesFromFiles(books, bookUrlMap);

    // Step 4: Update database and save results
    console.log(`\n💾 Step 4: Updating database...`);
    let realImageCount = 0;
    
    for (const result of results) {
      if (result.extractedImageUrl && result.extractedImageUrl !== 'ERROR') {
        try {
          const book = books.find(b => b.title === result.title);
          if (book) {
            await Book.findByIdAndUpdate(book._id, { imageUrl: result.extractedImageUrl });
            console.log(`✅ Updated "${result.title}" with real Amazon image`);
            realImageCount++;
          }
        } catch (updateError) {
          console.log(`❌ Database update failed for "${result.title}": ${updateError}`);
        }
      }
    }

    // Step 5: Save results to file
    const resultsFile = path.join(__dirname, '../../amazon-image-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\n🎯 ===== FINAL RESULTS =====`);
    console.log(`📊 Books processed: ${results.length}`);
    console.log(`🖼️  Real Amazon images extracted: ${realImageCount}`);
    console.log(`📁 Detailed results: ${resultsFile}\n`);
    
    console.log(`📋 RESULTS FOR EACH BOOK:`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. "${result.title}"`);
      console.log(`   Author: ${result.author}`);
      console.log(`   Status: ${result.status}`);
      if (result.extractedImageUrl && result.extractedImageUrl !== 'ERROR') {
        console.log(`   🎯 REAL IMAGE: ${result.extractedImageUrl}`);
        console.log(`   Method: ${result.extractionMethod}`);
      }
      console.log(`   HTML Size: ${result.htmlSize || 'N/A'}`);
    });
    
    console.log(`\n==============================`);
    
    if (realImageCount > 0) {
      console.log(`🎉 SUCCESS! ${realImageCount} real Amazon book covers extracted!`);
    } else {
      console.log(`📷 No real images found - check wget access`);
    }

  } catch (error) {
    console.error('Shell-based scraping error:', error);
    throw error;
  }
};

const main = async (): Promise<void> => {
  try {
    await connectDB();
    await shellBasedAmazonScraper();
    console.log('✅ Shell-based Amazon scraping completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shell-based scraping failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export { shellBasedAmazonScraper };
