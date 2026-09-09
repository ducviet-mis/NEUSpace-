'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, Lightbulb, MessageSquare, MonitorSmartphone, Send, ShieldCheck, Sparkles, Star, Wrench } from 'lucide-react';

type FeedbackTopic = 'experience' | 'feature' | 'idea' | 'issue' | null;

const RATING_COPY = ['', 'Cần cải thiện nhiều', 'Chưa thật sự thuận tiện', 'Ổn, nhưng vẫn có thể tốt hơn', 'Rất tốt', 'Tuyệt vời — cảm ơn bạn!'];
const FEATURE_AREAS = ['Trang chủ', 'Tiến độ học tập', 'Tính GPA', 'Lịch học', 'Lịch thi', 'Song ngành', 'Chợ sinh viên', 'Khác'];
const TOPICS = [
  { id: 'experience' as const, title: 'Trải nghiệm sử dụng', description: 'Điều bạn thích hoặc thấy chưa thuận tiện.', icon: Heart, tone: 'border-rose-500/25 bg-rose-500/[0.07] text-rose-600 dark:text-rose-300' },
  { id: 'feature' as const, title: 'Góp ý một chức năng', description: 'Chia sẻ ý kiến về một phần cụ thể của neuOS.', icon: MonitorSmartphone, tone: 'border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-700 dark:text-cyan-300' },
  { id: 'idea' as const, title: 'Đề xuất tính năng mới', description: 'Một điều bạn muốn neuOS có trong tương lai.', icon: Lightbulb, tone: 'border-violet-500/25 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300' },
  { id: 'issue' as const, title: 'Báo lỗi', description: 'Một chi tiết hiển thị hoặc thao tác chưa đúng.', icon: Wrench, tone: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300' },
];
const PROMPTS: Record<Exclude<FeedbackTopic, null>, { label: string; placeholder: string }> = {
  experience: { label: 'Bạn muốn chia sẻ điều gì về trải nghiệm với neuOS?', placeholder: 'Ví dụ: Tôi thấy việc xem lịch học hôm nay rất nhanh, nhưng mong phần ...' },
  feature: { label: 'Điều gì ở chức năng này nên được cải thiện?', placeholder: 'Mô tả điều bạn đang gặp hoặc điều bạn mong muốn được điều chỉnh...' },
  idea: { label: 'Bạn mong neuOS có thêm điều gì?', placeholder: 'Hãy mô tả ý tưởng, cách bạn sẽ dùng nó và điều nó giúp ích cho việc học...' },
  issue: { label: 'Lỗi xảy ra như thế nào?', placeholder: 'Bạn đang ở trang nào? Bạn đã thao tác gì trước khi lỗi xuất hiện?' },
};

export default function FeedbackPage() {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState<FeedbackTopic>(null);
  const [featureArea, setFeatureArea] = useState('');
  const [message, setMessage] = useState('');
  const [allowContact, setAllowContact] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const selectedTopic = TOPICS.find(item => item.id === topic);
  const prompt = topic ? PROMPTS[topic] : null;

  const goNext = () => {
    if (step === 1 && rating > 0) setStep(2);
    if (step === 2 && topic) setStep(3);
  };
  const submitPreview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic || message.trim().length < 12) return;
    setSubmitted(true);
  };
  const restart = () => {
    setStep(1); setRating(0); setTopic(null); setFeatureArea(''); setMessage(''); setAllowContact(false); setSubmitted(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in duration-500">
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-br from-cyan-500/[0.11] via-blue-500/[0.05] to-violet-500/[0.08] px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-[0_8px_22px_rgba(14,116,144,0.20)] dark:bg-cyan-500/20 dark:text-cyan-200 dark:shadow-none"><MessageSquare size={24} aria-hidden="true" /></div>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">Góp ý cho neuOS</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Mỗi góp ý đều giúp neuOS tốt hơn.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">Bắt đầu bằng cảm nhận của bạn, rồi chia sẻ chi tiết về một chức năng hoặc ý tưởng mới.</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[12rem_minmax(0,1fr)]">
          <aside className="border-b border-border/60 bg-foreground/[0.025] px-5 py-5 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
            <ol className="flex justify-between gap-3 lg:flex-col lg:gap-5" aria-label="Tiến trình góp ý">
              {[['1', 'Đánh giá'], ['2', 'Chủ đề'], ['3', 'Chia sẻ']].map(([number, label]) => {
                const isCurrent = Number(number) === step;
                const isComplete = Number(number) < step || submitted;
                return <li key={number} className="flex items-center gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isCurrent || isComplete ? 'bg-cyan-700 text-white dark:bg-cyan-500/25 dark:text-cyan-100' : 'bg-foreground/8 text-foreground/55'}`}>{isComplete ? <CheckCircle2 size={16} aria-hidden="true" /> : number}</span><span className={`hidden text-sm font-medium sm:inline lg:block ${isCurrent ? 'text-foreground' : 'text-foreground/55'}`}>{label}</span></li>;
              })}
            </ol>
          </aside>

          <div className="min-h-[27rem] px-5 py-7 sm:px-8 sm:py-9">
            {submitted ? <div className="flex min-h-[22rem] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"><CheckCircle2 size={34} aria-hidden="true" /></div><h3 className="mt-5 text-2xl font-bold text-foreground">Cảm ơn Neuer!</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/70">Bạn đã hoàn thành bản xem thử biểu mẫu góp ý. Khi bạn duyệt giao diện này, mình sẽ kết nối phần lưu góp ý riêng tư để đội ngũ neuOS có thể xử lý chúng.</p><button type="button" onClick={restart} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/8">Gửi một góp ý khác</button></div> : step === 1 ? <div className="mx-auto max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:text-cyan-300">Bước 1 / 3</p><h3 className="mt-2 text-2xl font-bold text-foreground">Bạn thấy trải nghiệm neuOS thế nào?</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">Chỉ cần chọn số sao gần nhất với cảm nhận hiện tại của bạn.</p>
              <div className="mt-8 rounded-2xl border border-border/70 bg-background/30 p-4 sm:p-6"><div className="flex items-center justify-center gap-1.5 sm:gap-3" role="radiogroup" aria-label="Đánh giá trải nghiệm">{[1, 2, 3, 4, 5].map(value => { const selected = value <= rating; return <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} sao — ${RATING_COPY[value]}`} onClick={() => setRating(value)} className={`flex h-12 w-12 items-center justify-center rounded-xl transition-[background-color,color,transform] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:h-14 sm:w-14 ${selected ? 'bg-amber-400/15 text-amber-500' : 'text-foreground/20 hover:bg-foreground/5 hover:text-amber-400/60'}`}><Star size={29} fill={selected ? 'currentColor' : 'none'} aria-hidden="true" /></button>; })}</div><p className="mt-5 min-h-6 text-center text-sm font-semibold text-foreground" aria-live="polite">{rating ? RATING_COPY[rating] : 'Chọn từ 1 đến 5 sao'}</p></div>
              <div className="mt-7 flex justify-end"><button type="button" onClick={goNext} disabled={!rating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(14,116,144,0.20)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-cyan-500/25 dark:text-cyan-100 dark:shadow-none">Tiếp tục <ArrowRight size={17} aria-hidden="true" /></button></div>
            </div> : step === 2 ? <div>
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:text-cyan-300">Bước 2 / 3</p><h3 className="mt-2 text-2xl font-bold text-foreground">Bạn muốn góp ý về điều gì?</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">Chọn một nhóm gần nhất để lời góp ý đến đúng nơi cần cải thiện.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{TOPICS.map(item => { const Icon = item.icon; const isSelected = topic === item.id; return <button key={item.id} type="button" onClick={() => setTopic(item.id)} aria-pressed={isSelected} className={`min-h-28 rounded-2xl border p-4 text-left transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${isSelected ? `${item.tone} shadow-sm` : 'border-border/70 bg-background/25 text-foreground hover:bg-foreground/[0.05]'}`}><Icon size={22} className={isSelected ? '' : 'text-foreground/65'} aria-hidden="true" /><p className="mt-3 text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-relaxed opacity-70">{item.description}</p></button>; })}</div>
              {(topic === 'feature' || topic === 'issue') && <fieldset className="mt-6"><legend className="text-sm font-semibold text-foreground">Chức năng liên quan</legend><div className="mt-3 flex flex-wrap gap-2">{FEATURE_AREAS.map(area => <button key={area} type="button" onClick={() => setFeatureArea(area)} aria-pressed={featureArea === area} className={`min-h-10 rounded-full border px-3 text-xs font-semibold transition-colors ${featureArea === area ? 'border-cyan-600 bg-cyan-700 text-white dark:border-cyan-400 dark:bg-cyan-500/25 dark:text-cyan-100' : 'border-border bg-background/30 text-foreground/70 hover:bg-foreground/8'}`}>{area}</button>)}</div></fieldset>}
              <div className="mt-7 flex items-center justify-between gap-3"><button type="button" onClick={() => setStep(1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/8 hover:text-foreground"><ArrowLeft size={17} aria-hidden="true" /> Quay lại</button><button type="button" onClick={goNext} disabled={!topic} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(14,116,144,0.20)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-cyan-500/25 dark:text-cyan-100 dark:shadow-none">Tiếp tục <ArrowRight size={17} aria-hidden="true" /></button></div>
            </div> : <form onSubmit={submitPreview}>
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:text-cyan-300">Bước 3 / 3</p><h3 className="mt-2 text-2xl font-bold text-foreground">{selectedTopic?.title}</h3><p className="mt-2 text-sm leading-relaxed text-foreground/70">Bạn có thể viết ngắn gọn; điều quan trọng nhất là tình huống thực tế bạn đã gặp.</p>{featureArea && <p className="mt-4 inline-flex rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">Liên quan: {featureArea}</p>}
              <div className="mt-6"><label htmlFor="feedback-message" className="text-sm font-semibold text-foreground">{prompt?.label}</label><textarea id="feedback-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={1200} required minLength={12} rows={7} placeholder={prompt?.placeholder} className="mt-3 w-full resize-y rounded-2xl border border-border bg-background/40 px-4 py-3 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" aria-describedby="feedback-character-count" /><div id="feedback-character-count" className="mt-2 flex justify-end text-xs text-foreground/55">{message.length}/1200</div></div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/25 p-4 text-sm text-foreground/75"><input type="checkbox" checked={allowContact} onChange={event => setAllowContact(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-border accent-cyan-700" /><span><span className="font-semibold text-foreground">Có thể liên hệ lại với tôi</span><span className="mt-0.5 block text-xs leading-relaxed text-foreground/60">Dùng khi đội ngũ cần hỏi thêm để hiểu góp ý của bạn.</span></span></label>
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-foreground/[0.045] px-3 py-2.5 text-xs leading-relaxed text-foreground/60"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" /><span>Bản xem thử này chưa lưu hay gửi dữ liệu. Khi bạn duyệt form, neuOS sẽ chỉ lưu những thông tin cần thiết để xử lý góp ý.</span></div>
              <div className="mt-7 flex items-center justify-between gap-3"><button type="button" onClick={() => setStep(2)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/8 hover:text-foreground"><ArrowLeft size={17} aria-hidden="true" /> Quay lại</button><button type="submit" disabled={message.trim().length < 12} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(14,116,144,0.20)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-cyan-500/25 dark:text-cyan-100 dark:shadow-none"><Send size={17} aria-hidden="true" /> Hoàn tất xem thử</button></div>
            </form>}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border/60 bg-foreground/[0.025] px-5 py-3 text-xs text-foreground/55 sm:px-8"><Sparkles size={14} className="text-cyan-700 dark:text-cyan-300" aria-hidden="true" />Bản thiết kế góp ý — chưa gửi dữ liệu ra ngoài.</div>
      </section>
    </div>
  );
}
