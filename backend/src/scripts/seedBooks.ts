import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import Book from '../models/Book';
import User from '../models/User';
import Review from '../models/Review';

dotenv.config();

// Interface for the Top-100 Trending Books CSV
interface TrendingBookRecord {
  Rank?: string;
  'book title'?: string;
  'book price'?: string;
  rating?: string;
  author?: string;
  'year of publication'?: string;
  genre?: string;
  url?: string;
}

// Interface for customer reviews CSV  
interface CustomerReviewRecord {
  Sno?: string;
  'book name'?: string;
  'review title'?: string;
  reviewer?: string;
  'reviewer rating'?: string;
  'review description'?: string;
  is_verified?: string;
  date?: string;
  timestamp?: string;
  ASIN?: string;
}

interface BookSeedData {
  title: string;
  author: string;
  description: string;
  genre: string;
  publishedYear: number;
  addedBy: mongoose.Types.ObjectId;
  imageUrl?: string;
  asin?: string;
}

interface ReviewSeedData {
  bookTitle: string;
  rating: number;
  reviewText: string;
  reviewer: string;
  asin: string;
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createDefaultUser = async (): Promise<mongoose.Types.ObjectId> => {
  try {
    let defaultUser = await User.findOne({ email: 'admin@bookreviews.com' });
    
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'System Administrator',
        email: 'admin@bookreviews.com',
        password: 'AdminPass123!', // This will be hashed automatically
      });
      console.log('Default user created for seeding');
    }
    
    return defaultUser._id as mongoose.Types.ObjectId;
  } catch (error) {
    console.error('Error creating default user:', error);
    throw error;
  }
};

const createReviewUsers = async (reviewerNames: string[]): Promise<Map<string, mongoose.Types.ObjectId>> => {
  const userMap = new Map<string, mongoose.Types.ObjectId>();
  
  try {
    for (const reviewerName of reviewerNames) {
      // Clean reviewer name and create valid email
      const cleanName = reviewerName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .toLowerCase();
      
      // Ensure email has at least one character before @
      const emailPrefix = cleanName || 'user';
      
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now();
      const email = `${emailPrefix}${timestamp}@example.com`;
      
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          name: reviewerName.substring(0, 50), // Limit name length if User model has constraints
          email: email,
          password: 'Password123!',
        });
      }
      
      userMap.set(reviewerName, user._id as mongoose.Types.ObjectId);
    }
    
    console.log(`Created/found ${userMap.size} review users`);
    return userMap;
  } catch (error) {
    console.error('Error creating review users:', error);
    throw error;
  }
};

const cleanTrendingBookData = (record: TrendingBookRecord): BookSeedData | null => {
  try {
    // Validate required fields
    if (!record['book title'] || !record.author) {
      return null;
    }

    // Clean and format the data
    const title = record['book title'].trim();
    let author = record.author.trim();
    
    // Handle cases where author might be "Unknown" or empty
    if (author.toLowerCase() === 'unknown' || !author) {
      author = 'Unknown Author';
    }
    
    // Clean genre field
    let genre = record.genre?.trim() || 'General';
    
    // Handle complex genres - take the first one if comma-separated
    if (genre.includes(',')) {
      genre = genre.split(',')[0].trim();
    }
    
    // Clean up genre names
    genre = genre.replace(/['"]/g, '').trim();
    if (genre.length > 50) {
      genre = genre.substring(0, 50).trim();
    }
    
    // Generate description from available data
    let description = `${title} by ${author}`;
    if (record.rating && parseFloat(record.rating) > 0) {
      description += `. Rated ${record.rating} stars on Amazon.`;
    }
    if (genre !== 'General') {
      description += ` A ${genre.toLowerCase()} book that has gained popularity among readers.`;
    }
    
    // Parse published year
    let publishedYear = parseInt(record['year of publication'] || '0');
    if (isNaN(publishedYear) || publishedYear < 1000 || publishedYear > new Date().getFullYear()) {
      // Generate a reasonable year based on genre
      const currentYear = new Date().getFullYear();
      publishedYear = Math.floor(Math.random() * (currentYear - 1950)) + 1950;
    }

    // Generate placeholder image URL
    const titleText = title.substring(0, 25);
    const authorText = author.substring(0, 20);
    const placeholderText = `${titleText}+by+${authorText}`;
    
    // Use different colors based on genre
    const genreColors: { [key: string]: string } = {
      'Fantasy Romance': '9B59B6/FFFFFF',
      'Fantasy': '8E44AD/FFFFFF',
      'Romance': 'E91E63/FFFFFF', 
      'Mystery': '2C3E50/FFFFFF',
      'Science Fiction': '3498DB/FFFFFF',
      'Horror': '8B0000/FFFFFF',
      'Biography': '27AE60/FFFFFF',
      'Memoir': '27AE60/FFFFFF',
      'Autobiography': '2ECC71/FFFFFF',
      'History': '795548/FFFFFF',
      'Historical Fiction': '6C5CE7/FFFFFF',
      'Fiction': '34495E/FFFFFF',
      'Nonfiction': '16A085/FFFFFF',
      'Thriller': 'C0392B/FFFFFF',
      'Childrens': 'F39C12/FFFFFF',
      'Picture Books': 'E67E22/FFFFFF',
      'Young Adult': 'A569BD/FFFFFF',
      'Self Help': '1ABC9C/FFFFFF',
      'Business': '2980B9/FFFFFF',
    };
    
    const colorScheme = genreColors[genre] || '4A90E2/FFFFFF';
    const imageUrl = `https://via.placeholder.com/300x450/${colorScheme}?text=${encodeURIComponent(placeholderText)}`;

    return {
      title: title.substring(0, 200), // Limit title length
      author: author.substring(0, 100), // Limit author length
      description: description.substring(0, 1000), // Limit description length
      genre: genre.substring(0, 50), // Limit genre length
      publishedYear,
      addedBy: new mongoose.Types.ObjectId(), // Will be set later
      imageUrl,
      asin: record.url?.includes('dp/') ? record.url.split('dp/')[1]?.split('/')[0] : undefined,
    };
  } catch (error) {
    console.error('Error cleaning trending book data:', record, error);
    return null;
  }
};

const cleanReviewData = (record: CustomerReviewRecord): ReviewSeedData | null => {
  try {
    // Validate required fields
    if (!record['book name'] || !record.reviewer || !record['reviewer rating'] || !record['review description']) {
      return null;
    }

    const rating = parseInt(record['reviewer rating']);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return null;
    }

    // Clean review text - limit to 500 characters as per model
    let reviewText = record['review description'].trim();
    if (reviewText.length > 500) {
      reviewText = reviewText.substring(0, 497) + '...';
    }

    return {
      bookTitle: record['book name'].trim(),
      rating,
      reviewText,
      reviewer: record.reviewer.trim(),
      asin: record.ASIN || '',
    };
  } catch (error) {
    console.error('Error cleaning review data:', record, error);
    return null;
  }
};

const seedAmazonData = async (): Promise<void> => {
  try {
    console.log('Starting to seed Amazon books data...');
    
    const booksFile = path.join(__dirname, '../../amazon-books-data/Top-100 Trending Books.csv');
    const reviewsFile = path.join(__dirname, '../../amazon-books-data/customer reviews.csv');
    
    if (!fs.existsSync(booksFile) || !fs.existsSync(reviewsFile)) {
      console.error('Amazon data files not found!');
      console.log('Expected files:');
      console.log(`- ${booksFile}`);
      console.log(`- ${reviewsFile}`);
      throw new Error('Amazon data files not found');
    }
    
    const defaultUserId = await createDefaultUser();
    
    // Step 1: Load and process books
    console.log('Loading books from Top-100 Trending Books.csv...');
    const books: BookSeedData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(booksFile)
        .pipe(csv())
        .on('data', (record: TrendingBookRecord) => {
          const cleanedBook = cleanTrendingBookData(record);
          if (cleanedBook) {
            cleanedBook.addedBy = defaultUserId;
            books.push(cleanedBook);
          }
        })
        .on('end', () => {
          console.log(`Processed ${books.length} books from CSV`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Step 2: Load and process reviews
    console.log('Loading reviews from customer reviews.csv...');
    const reviews: ReviewSeedData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(reviewsFile)
        .pipe(csv())
        .on('data', (record: CustomerReviewRecord) => {
          const cleanedReview = cleanReviewData(record);
          if (cleanedReview) {
            reviews.push(cleanedReview);
          }
        })
        .on('end', () => {
          console.log(`Processed ${reviews.length} reviews from CSV`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Step 3: Clear existing data
    console.log('Clearing existing data...');
    await Review.deleteMany({});
    await Book.deleteMany({});
    
    // Step 4: Insert books
    console.log('Inserting books...');
    const insertedBooks = await Book.insertMany(books, { ordered: false });
    console.log(`Successfully inserted ${insertedBooks.length} books`);
    
    // Step 5: Create a mapping of book titles to book IDs
    const bookTitleToId = new Map<string, mongoose.Types.ObjectId>();
    insertedBooks.forEach(book => {
      bookTitleToId.set(book.title, book._id as mongoose.Types.ObjectId);
    });
    
    // Step 6: Get unique reviewer names and create users
    const uniqueReviewers = [...new Set(reviews.map(r => r.reviewer))];
    const reviewerToUserId = await createReviewUsers(uniqueReviewers);
    
    // Step 7: Insert reviews
    console.log('Inserting reviews...');
    const validReviews: any[] = [];
    
    for (const review of reviews) {
      const bookId = bookTitleToId.get(review.bookTitle);
      const userId = reviewerToUserId.get(review.reviewer);
      
      if (bookId && userId) {
        validReviews.push({
          bookId,
          userId,
          rating: review.rating,
          reviewText: review.reviewText,
        });
      }
    }
    
    // Insert reviews in batches to avoid duplicates and memory issues
    const batchSize = 100;
    let insertedReviewsCount = 0;
    
    for (let i = 0; i < validReviews.length; i += batchSize) {
      const batch = validReviews.slice(i, i + batchSize);
      
      try {
        // Insert reviews one by one to handle unique constraint violations gracefully
        for (const reviewData of batch) {
          try {
            await Review.create(reviewData);
            insertedReviewsCount++;
          } catch (error: any) {
            // Skip duplicate reviews (unique constraint violation)
            if (!error.message?.includes('duplicate key')) {
              console.error('Error inserting review:', error.message);
            }
          }
        }
        
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} reviews`);
      } catch (batchError) {
        console.error(`Error in review batch ${Math.floor(i/batchSize) + 1}:`, batchError);
      }
    }
    
    console.log(`Successfully inserted ${insertedReviewsCount} reviews`);
    
    // Summary
    const totalBooks = await Book.countDocuments();
    const totalReviews = await Review.countDocuments();
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`📚 Total books in database: ${totalBooks}`);
    console.log(`⭐ Total reviews in database: ${totalReviews}`);
    console.log(`👥 Total review users created: ${reviewerToUserId.size}`);
    console.log('=====================\n');
    
  } catch (error) {
    console.error('Error seeding Amazon data:', error);
    throw error;
  }
};

const seedSampleBooks = async (): Promise<void> => {
  try {
    console.log('Seeding sample books...');
    
    const defaultUserId = await createDefaultUser();
    
    const sampleBooks: BookSeedData[] = [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description: "A classic American novel set in the Jazz Age, exploring themes of decadence, idealism, resistance to change, social upheaval, and excess.",
        genre: "Classic Literature",
        publishedYear: 1925,
        addedBy: defaultUserId,
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        description: "A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice.",
        genre: "Classic Literature",
        publishedYear: 1960,
        addedBy: defaultUserId,
      },
      {
        title: "1984",
        author: "George Orwell",
        description: "A dystopian social science fiction novel that follows the life of Winston Smith, a low-ranking member of 'the Party'.",
        genre: "Dystopian Fiction",
        publishedYear: 1949,
        addedBy: defaultUserId,
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        description: "The story of Holden Caulfield, a teenager who has been expelled from prep school and is wandering around New York City.",
        genre: "Coming-of-Age",
        publishedYear: 1951,
        addedBy: defaultUserId,
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "A romantic novel of manners that follows the character development of Elizabeth Bennet.",
        genre: "Romance",
        publishedYear: 1813,
        addedBy: defaultUserId,
      },
    ];
    
    // Clear existing books
    await Book.deleteMany({});
    
    // Insert sample books
    await Book.insertMany(sampleBooks);
    
    console.log(`Successfully seeded ${sampleBooks.length} sample books to database`);
  } catch (error) {
    console.error('Error seeding sample books:', error);
    throw error;
  }
};

const main = async (): Promise<void> => {
  try {
    await connectDB();
    
    const mode = process.argv[2];
    
    if (mode === 'amazon') {
      await seedAmazonData();
    } else if (mode === 'sample') {
      await seedSampleBooks();
    } else {
      console.log('Please specify seeding mode:');
      console.log('  npm run seed:books amazon  - Seed from Amazon CSV files');
      console.log('  npm run seed:books sample  - Seed with sample books');
      process.exit(1);
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Handle script execution
if (require.main === module) {
  main();
}

export { seedAmazonData, seedSampleBooks };
