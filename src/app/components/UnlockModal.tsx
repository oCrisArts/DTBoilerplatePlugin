import { useState } from "react";
const F = { sm: "clamp(1rem, 1.5vw, 1.25rem)", xs: "clamp(0.875rem, 1.3vw, 1.125rem)" };
export function UnlockModal({
  onUnlock,
  onCancel
}: {
  onUnlock: (email: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onUnlock(email.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };


  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm px-[24px]">
      <div className="bg-white rounded-[16px] shadow-lg border border-gray-200 w-full max-w-md p-6" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="m-0 text-[#0c0c0d] font-semibold text-center flex-1" style={{ fontSize: F.sm }}>Unlock StartTokens</h2>
          <div className="w-6"></div>
        </div>

        {/* Copy */}
        <p className="text-[#6e6e80] text-center mb-6" style={{ fontSize: F.xs, lineHeight: 1.45 }}>
          You have already used the free token generation. Unlock unlimited token generation and future updates.
        </p>

        {/* Benefits List */}
        <div className="space-y-2 mb-6">
          {[
            "Unlimited Generations",
            "Future Updates",
            "New Updates",
            "Priority Support"
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-[#0c0c0d]" style={{ fontSize: F.xs }}>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="space-y-3">
          <div className="space-y-3">
            <label htmlFor="unlock-email" className="block text-[#0c0c0d] font-medium mb-2" style={{ fontSize: F.xs }}>Email</label>
            <input
              id="unlock-email"
              type="email"
              placeholder="Insert your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#f7f7f8] border border-gray-200 rounded-lg px-4 py-3 outline-none text-[#0c0c0d] placeholder:text-gray-400 focus:border-[#5e6ad2] transition-colors"
              style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: F.xs }}
            />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={!email.trim()}
            className="w-full bg-[#0c0c0d] rounded-lg py-3 text-[#fafafa] font-semibold hover:bg-[#1a1a1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: F.sm }}
          >
            View plans on StartTokens
          </button>
        </div>
      </div>
    </div>
  );
}


