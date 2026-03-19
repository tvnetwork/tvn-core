import { useState } from "react";
import { motion } from "motion/react";
import { Send, BookOpen, PenTool, Smartphone } from "lucide-react";

export default function WhatsAppForm() {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("writing");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    let interestText = "";
    if (interest === "writing") interestText = "writing books";
    if (interest === "designing") interestText = "designing books";
    if (interest === "social") interestText = "creating social media content";

    const message = `Hello, my name is ${name}. I am interested in learning about ${interestText}. Could you please share more information?`;
    const url = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-primary/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Smartphone size={120} />
      </div>
      <div className="p-8 relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Send className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold text-deep-brown">Learn & Grow</h3>
            <p className="text-taupe">Direct WhatsApp Coaching</p>
          </div>
        </div>

        <p className="text-deep-brown/80 mb-6 leading-relaxed">
          Want to learn how to write books, design stunning covers, or create engaging social media content? Send me a message directly on WhatsApp to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">I want to learn about</label>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-soft-cream/30 border-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="writing">Writing Books</option>
              <option value="designing">Designing Books</option>
              <option value="social">Social Media Content Creation</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-green-500/30"
          >
            <Send size={20} />
            <span>Message on WhatsApp</span>
          </button>
        </form>
      </div>
    </div>
  );
}
