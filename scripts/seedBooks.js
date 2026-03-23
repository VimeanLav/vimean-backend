require("dotenv").config({ override: true });
const mongoose = require("mongoose");
const Book = require("../models/Book");

const sampleBooks = [
  {
    title: "Atomic Habits",
    author: "James Clear",
    price: 16.99,
    genre: "Nonfiction",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    description: "Tiny changes, remarkable results.",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    price: 14.5,
    genre: "Nonfiction",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800",
    description: "Rules for focused success in a distracted world.",
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    price: 18.25,
    genre: "Nonfiction",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800",
    description: "Timeless lessons on wealth and behavior.",
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    price: 21.0,
    genre: "History",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
    description: "A brief history of humankind.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    price: 13.99,
    genre: "Sci-Fi",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    description: "Epic science fiction about power and destiny.",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    price: 11.49,
    genre: "Adventure",
    image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800",
    description: "A fable about following your personal legend.",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    price: 17.75,
    genre: "Sci-Fi",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
    description: "A lone astronaut must save Earth through science and grit.",
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    price: 12.99,
    genre: "Thriller",
    image: "https://images.unsplash.com/photo-1496104679561-38b87bbf4d68?w=800",
    description: "A psychological mystery about silence, obsession, and truth.",
  },
];

const seed = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    await Book.deleteMany({});
    const inserted = await Book.insertMany(sampleBooks);

    console.log(`Seeded ${inserted.length} books.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Book seed failed:", error.message);
    process.exit(1);
  }
};

seed();
