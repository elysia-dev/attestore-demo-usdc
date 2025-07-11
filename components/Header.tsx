"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleContactClick = () => {
    window.location.href = "mailto:cs@elysia.land";
  };

  const handleUserGuideClick = () => {
    window.open(
      "https://modoripage.notion.site/Zenie-Guide-223f2ffdc30a803eb50eef01f2a43a33?pvs=74",
      "_blank"
    );
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b bg-white border-gray-border mx-[50px] h-[84px]",
        "max-sm:mx-0 max-sm:h-[60px]"
      )}
    >
      <div className="mx-auto px-[30px] py-5 max-sm:px-4 max-sm:py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <Image
              src={"/logo.svg"}
              alt="Zenie."
              width={150}
              height={35.5}
              className="max-sm:w-[100px] max-sm:h-[25px]"
            />
          </Link>

          {/* 데스크톱 메뉴 */}
          <section className="hidden sm:flex items-center gap-2">
            <HeaderButton onClick={handleUserGuideClick}>
              User Guide
            </HeaderButton>
            <HeaderButton onClick={handleContactClick}>Contact Us</HeaderButton>
          </section>

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={toggleMenu}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="메뉴 열기"
          >
            {isMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path
                  d="M3 12H21M3 6H21M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-border shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <HeaderButton
                onClick={() => {
                  handleUserGuideClick();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                User Guide
              </HeaderButton>
              <HeaderButton
                onClick={() => {
                  handleContactClick();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Contact Us
              </HeaderButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const HeaderButton = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => {
  return (
    <Button
      onClick={onClick}
      variant="outlineBlue"
      size="lg"
      className={className}
    >
      {children}
    </Button>
  );
};
