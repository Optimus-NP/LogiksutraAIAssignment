# 📚 Book Review Platform - Data Seeding Guide

This guide explains how to populate your MongoDB database with Amazon books data and reviews.

## 🎯 What's Been Set Up

### 📊 Database Schema
- **Books**: Title, author, description, genre, published year, images, and metadata
- **Reviews**: Customer reviews with ratings (1-5 stars) linked to books and users  
- **Users**: Reviewer accounts created from Amazon customer data

### 📁 Data Sources
- `backend/amazon-books-data/Top-100 Trending Books.csv` - 100 trending books with metadata
- `backend/amazon-books-data/customer reviews.csv` - 920+ authentic customer reviews

## 🚀 Available Commands

### Core Seeding Commands
```bash
# Seed database with Amazon books + reviews (recommended)
npm run seed:amazon

# Seed with sample books (for testing)
npm run seed:sample
```

### Image Processing Commands
```bash
# Generate placeholder images for books
npm run generate:placeholders

# Scrape real Amazon book cover images (experimental)
npm run scrape:amazon-images
```

## 📋 Current Database Contents

After running `npm run seed:amazon`:

| Content Type | Count | Description |
|-------------|-------|-------------|
| 📚 **Books** | 100 | Trending books with metadata & images |
| ⭐ **Reviews** | 854+ | Authentic Amazon customer reviews |
| 👥 **Users** | 819+ | Unique reviewer accounts + admin |
| 🖼️ **Images** | 100 | Genre-specific placeholder images |

## 🎨 Image Features

### Automatic Placeholder Generation
Books are automatically assigned color-coded placeholder images based on genre:

- 🟣 **Fantasy/Romance**: Purple schemes
- ❤️ **Romance**: Pink/Red schemes  
- 🔵 **Science Fiction**: Blue schemes
- 📚 **Fiction**: Dark blue/gray schemes
- 📈 **Business/Self Help**: Teal schemes
- 👶 **Children's Books**: Orange/Yellow schemes
- 📖 **Biography/Memoir**: Green schemes

### Image URL Format
```
https://via.placeholder.com/300x450/{COLOR}/{TEXT_COLOR}?text={BOOK_TITLE}+by+{AUTHOR}
```

Example:
```
https://via.placeholder.com/300x450/9B59B6/FFFFFF?text=Iron+Flame+by+Rebecca+Yarros
```

## 🔧 How It Works

### Book Data Processing
1. **CSV Parsing**: Reads Amazon books CSV with title, author, genre, year, rating
2. **Data Cleaning**: Handles missing fields, formats genres, validates years  
3. **Description Generation**: Creates descriptions from available metadata
4. **Image Assignment**: Generates genre-specific placeholder images
5. **Database Insert**: Bulk inserts books with error handling

### Review Data Processing  
1. **Review Parsing**: Extracts reviewer name, rating, review text from CSV
2. **User Creation**: Creates unique accounts for each reviewer
3. **Text Limiting**: Truncates long reviews to 500 character limit
4. **Relationship Mapping**: Links reviews to books via title matching
5. **Duplicate Handling**: Gracefully handles constraint violations

### Email Generation for Reviewers
```typescript
// Example reviewer: "John Smith 123"  
// Becomes: johnsmith12312345678901234@example.com
```

## 🛠️ Customization Options

### Modifying Book Limits
Edit the seeding script to process more/fewer books:
```typescript
// In seedAmazonData function
const books = await Book.find({}).limit(50); // Change limit here
```

### Adding New Genres/Colors
Update the `genreColors` object in both scripts:
```typescript
const genreColors = {
  'Your Genre': 'HEX_COLOR/FFFFFF',
  // Add more mappings
};
```

### Custom Placeholder Service
Replace placeholder URL generation:
```typescript
const imageUrl = `https://your-service.com/generate?title=${title}&author=${author}`;
```

## 🚨 Important Notes

### Rate Limiting
- Amazon scraping includes 1.5s delays between requests
- Respect Amazon's robots.txt and terms of service
- Use placeholders as primary image source

### Data Validation
- Book titles limited to 200 characters
- Authors limited to 100 characters  
- Reviews limited to 500 characters
- Genres cleaned and limited to 50 characters

### User Accounts
- Admin user: `admin@bookreviews.com` / `AdminPass123!`
- Reviewer accounts: Auto-generated emails with `Password123!`

## 🔄 Re-running Seeds

### Fresh Database
```bash
npm run seed:amazon  # Clears all data and reseeds
```

### Add Images Only
```bash
npm run generate:placeholders  # Adds images to existing books without images
```

### Database Reset
The seeding process automatically clears existing books and reviews before inserting new data.

## 📈 Performance

### Seeding Time
- **Books**: ~2-3 seconds for 100 books
- **Reviews**: ~30-45 seconds for 850+ reviews  
- **Users**: ~60-90 seconds for 800+ users
- **Images**: Instant placeholder generation

### Memory Usage
- Processes data in batches to avoid memory issues
- Handles large CSV files efficiently
- Graceful error recovery for failed inserts

## 🎭 Sample Data Preview

### Book Example
```json
{
  "title": "Fourth Wing (The Empyrean, 1)",
  "author": "Rebecca Yarros", 
  "description": "Fourth Wing (The Empyrean, 1) by Rebecca Yarros. Rated 4.8 stars on Amazon. A fantasy book that has gained popularity among readers.",
  "genre": "Fantasy",
  "publishedYear": 2023,
  "imageUrl": "https://via.placeholder.com/300x450/8E44AD/FFFFFF?text=Fourth+Wing+by+Rebecca+Yarros"
}
```

### Review Example  
```json
{
  "rating": 5,
  "reviewText": "Amazing book! I couldn't put it down. The dragons, the romance, the action - everything was perfect. Highly recommend to fantasy lovers...",
  "userId": "ObjectId(...)",
  "bookId": "ObjectId(...)"
}
```

---

*Created with ❤️ for your Book Review Platform*
