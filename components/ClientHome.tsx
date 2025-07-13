"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("./Home"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
});

export default function ClientHome() {
  return <Home />;
}