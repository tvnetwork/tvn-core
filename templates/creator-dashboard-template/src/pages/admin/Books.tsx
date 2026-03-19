import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useBooks } from "../../hooks/useBooks";
import { supabase, type Book } from "../../lib/supabase";
import BookForm from "../../components/admin/BookForm";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminBooks() {
  const { books, loading, refetch } = useBooks();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { refetch(); showToast('Book deleted successfully.', 'success'); }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <main className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div>
              <h1 className="text-3xl font-serif font-bold text-deep-brown">Manage Books</h1>
              <p className="text-taupe font-medium">Add, edit, or remove books from your catalog.</p>
            </div>
            <button
              onClick={() => { setEditingBook(null); setShowForm(true); }}
              className="px-6 py-3 bg-primary text-soft-cream rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:bg-primary/90 transition-all"
            >
              <Plus size={20} />
              <span>Add New Book</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/5 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" size={20} />
              <input
                type="text"
                placeholder="Search books by title or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Books Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cream/50 border-b border-primary/5">
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Book</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Genre</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest">Featured</th>
                    <th className="px-6 py-4 text-xs font-bold text-taupe uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-soft-cream/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-14 rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={book.cover_image_url || `https://picsum.photos/seed/${book.id}/200/300`}
                              alt={book.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-deep-brown group-hover:text-primary transition-colors">{book.title}</p>
                            <p className="text-xs text-taupe font-medium">Slug: {book.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-deep-brown">{book.genre}</span>
                      </td>

                      <td className="px-6 py-4">
                        {book.is_draft ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Draft</span>
                        ) : book.is_coming_soon ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Coming Soon</span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {book.featured ? (
                          <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest">Yes</span>
                        ) : (
                          <span className="text-taupe text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(book)}
                            className="p-2 text-taupe hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(book.id)}
                            className="p-2 text-taupe hover:text-accent transition-colors hover:bg-accent/5 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-taupe italic">No books found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <BookForm
          book={editingBook}
          onClose={() => setShowForm(false)}
          onSuccess={refetch}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Book"
        message="Are you sure you want to permanently delete this book? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminLayout>
  );
}
