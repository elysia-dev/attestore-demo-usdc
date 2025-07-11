"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";

export default function Header() {
  const handleContactClick = () => {
    window.location.href = "mailto:cs@elysia.land";
  };

  const handleUserGuideClick = () => {
    window.open(
      "https://modoripage.notion.site/Genie-Guide-223f2ffdc30a803eb50eef01f2a43a33?source=copy_link",
      "_blank"
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white border-gray-border mx-[50px] h-[84px]">
      <div className="mx-auto px-[30px] py-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <Image src={"/logo.svg"} alt="Zenie." width={150} height={35.5} />
          </Link>
          <section className="flex items-center gap-2">
            <HeaderButton onClick={handleUserGuideClick}>
              User Guide
            </HeaderButton>
            <HeaderButton onClick={handleContactClick}>Contact Us</HeaderButton>
          </section>
        </div>
      </div>
    </header>
  );
}

const HeaderButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <Button onClick={onClick} variant="outlineBlue" size="lg">
      {children}
    </Button>
  );
};
