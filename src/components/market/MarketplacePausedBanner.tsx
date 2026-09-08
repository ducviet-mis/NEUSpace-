import { Lock } from 'lucide-react';
import { MARKETPLACE_PAUSED_MESSAGE } from '@/lib/marketplace';

export default function MarketplacePausedBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
    >
      <Lock className="mt-0.5 shrink-0 text-amber-300" size={18} aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="font-bold text-amber-200">Tạm khóa chức năng đăng bán.</span>{' '}
        {MARKETPLACE_PAUSED_MESSAGE}
      </p>
    </div>
  );
}
