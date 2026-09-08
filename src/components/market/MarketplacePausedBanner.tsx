import { Lock } from 'lucide-react';
import { MARKETPLACE_PAUSED_MESSAGE } from '@/lib/marketplace';

export default function MarketplacePausedBanner() {
  return (
    <div
      role="status"
      className="marketplace-paused-banner flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
    >
      <Lock className="marketplace-paused-icon mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="marketplace-paused-title font-bold">Tạm khóa chức năng đăng bán.</span>{' '}
        {MARKETPLACE_PAUSED_MESSAGE}
      </p>
    </div>
  );
}
