interface VideoPopupProps {
  isOpen: boolean
  onClose: () => void
  videoSrc: string
  posterSrc?: string
  title?: string
}

export function VideoPopup({
  isOpen,
  onClose,
  videoSrc,
  posterSrc,
  title = 'Video Player',
}: VideoPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center mb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup Content */}
      <aside className="relative z-10 max-w-[640px] mx-auto w-[90%]">
        {/* Close button outside the video container */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:scale-110 transition-transform">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black/95 rounded-2xl overflow-hidden shadow-2xl">
          <video
            controls
            className="w-full h-auto max-h-[80vh] aspect-[720/1558]"
            poster={posterSrc}
            autoPlay={isOpen}>
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </aside>
    </div>
  )
}
