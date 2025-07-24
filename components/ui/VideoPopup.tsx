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
      <aside className="relative z-10 max-w-[640px] mx-auto w-[90%] bg-white rounded-[5px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h3 className="body font-bold">{title}</h3>
          <button onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Video Container */}
        <div className="relative pb-4">
          <video
            controls
            className="w-full h-auto max-h-[70vh] aspect-[720/1558]"
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
