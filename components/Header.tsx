"use client";

import Link from "next/link";

export default function Header() {
  const handleTelegramClick = () => {
    window.open("https://t.me/+dD3Y7BztoG04MzBl", "_blank");
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Genie{" "}
          </Link>
          
          <button
            onClick={handleTelegramClick}
            className="flex items-center justify-center gap-2 text-blue-900 hover:text-blue-800 transition-colors duration-200 bg-white hover:bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:border-blue-300"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-blue-500"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42.8-.68.8-.58 0-.96-.43-1.5-.84l-2.26-1.69c-.99-.74-.35-1.15.22-1.82.15-.17 2.8-2.56 2.85-2.78.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.91 1.21-5.41 3.56-.51.36-.98.54-1.4.53-.46-.01-1.35-.26-2.01-.47-.81-.26-.99-.4-.85-.84.07-.23.37-.47 1.07-.72L12 8.58c.85-.37 1.43-.61 1.74-.73.88-.34 1.78-.63 1.78-.63s.35-.13.57.08c.17.16.22.38.2.67z"/>
            </svg>
            Contact
          </button>
        </div>
      </div>
    </header>
  );
}
