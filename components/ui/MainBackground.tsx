export default function MainBackground({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen relative overflow-hidden pt-20 pb-20">
      {/* Animated background - exactly like Zenie USDC */}
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0">
        {/* Pink blob - top left */}
        <div className="absolute top-10 -left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-56 md:w-72 sm:h-56 md:h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob" />
        {/* Purple blob - top right */}
        <div
          className="absolute top-1/4 -right-10 sm:top-40 sm:right-20 w-32 h-32 sm:w-48 md:w-72 sm:h-48 md:h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: '2s' }}
        />
        {/* Blue blob - bottom */}
        <div
          className="absolute bottom-20 left-1/4 sm:-bottom-20 sm:left-40 w-36 h-36 sm:w-56 md:w-72 sm:h-56 md:h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: '4s' }}
        />
      </div>
      {children}
    </main>
  )
}
