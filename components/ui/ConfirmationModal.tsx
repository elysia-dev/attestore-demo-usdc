import { Button } from "./button";

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  name,
  amount,
  memo,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  amount: string;
  memo: number | string;
  address: string;
}) {
  if (!isOpen) return null;

  const ArrowIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="inline-block"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center mb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <aside className="relative min-w-[320px] z-10 max-w-[400px] mx-auto w-[90%] bg-white rounded-[5px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-border">
          <h3 className="body font-bold">Transfer Confirmation</h3>
          <button onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text mb-4">Did your KRW transfer completed?</p>
          <section className="relative w-full max-h-[600px] aspect-[1080/1394] bg-[#18171c]">
            <section className="pt-10">
              <p className="text-white text-center text-[22px] font-bold">
                <span className="text-[#3a83f1]">{name}</span>님에게
              </p>
              <p className="text-white text-center text-[22px] font-bold">
                {amount}원을
              </p>
              <p className="text-white text-center text-[22px] font-bold">
                보낼까요?
              </p>
            </section>
            <section className="flex flex-col absolute bottom-10 w-[90%] -translate-x-1/2 left-1/2 gap-2">
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">받는 분에게 표시</p>
                <div className="flex items-center">
                  <p className="text-blue-primary font-bold border border-red-primary px-2 py-1 label">
                    {memo}
                  </p>
                  <ArrowIcon />
                </div>
              </div>
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">출금 계좌</p>
                <div className="flex items-center">
                  <p className="text-white label pr-2">-</p>
                  <ArrowIcon />
                </div>
              </div>
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">입금 계좌</p>
                <div className="flex items-center">
                  <p className="text-blue-primary font-bold border border-red-primary px-2 py-1 label">
                    {address}
                  </p>
                  <ArrowIcon />
                </div>
              </div>
            </section>
          </section>

          {/* Buttons */}
          <div className="flex gap-2 justify-end mt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              No
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              Yes
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ConfirmationModal;
