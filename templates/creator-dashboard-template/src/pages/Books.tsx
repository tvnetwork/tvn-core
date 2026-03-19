import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Filter, BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useBooks } from "../hooks/useBooks";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function Books() {
  const { books, loading } = useBooks();
  const { settings } = useSiteSettings();
  const authorName = settings?.author_name || 'the author';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  const loadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const genres = useMemo(() => {
    const g = ["All"];
    books.forEach(b => {
      if (b.genre && !g.includes(b.genre)) g.push(b.genre);
    });
    return g;
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === "All" || book.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [books, searchTerm, selectedGenre]);

  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = filteredBooks.length > visibleCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-brown mb-4">The Library</h1>
        <p className="text-xl text-taupe max-w-2xl mx-auto">
          Explore the complete collection of works by {authorName}. From published novels to limited editions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
          <input
            type="text"
            placeholder="Search by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-4 overflow-x-auto pb-2 w-full md:w-auto">
          <Filter size={18} className="text-taupe hidden md:block" />
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedGenre === genre
                ? "bg-primary text-soft-cream shadow-md"
                : "bg-white text-taupe hover:bg-primary/5 border border-primary/5"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {visibleBooks.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <Link to={`/books/${book.slug}`} className="block">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg mb-4 relative">
                  <img
                    src={book.cover_image_url || `https://picsum.photos/seed/${book.id}/600/900`}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-6 py-2 bg-white text-primary rounded-full font-bold flex items-center space-x-2">
                      <BookOpen size={18} />
                      <span>View Details</span>
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-deep-brown group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                <p className="text-taupe text-sm font-medium">
                  {book.genre} &bull; {new Date(book.release_date).getFullYear()}
                </p>
              </Link>
            </motion.div>
          ))}
          {filteredBooks.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-taupe italic">No books found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
