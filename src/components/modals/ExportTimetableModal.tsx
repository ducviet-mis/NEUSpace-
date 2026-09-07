import React, { useState, useRef, useCallback } from 'react';
import { X, Download, Monitor, Smartphone, Table as TableIcon, Moon, Sun, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// ============================================================
// TYPES
// ============================================================

interface TimetableEvent {
  id: string;
  name: string;
  shift: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room: string;
  type: 'HOC' | 'HOAT_DONG' | 'THI';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: TimetableEvent[];
  profile: any;
}

// ============================================================
// CONSTANTS
// ============================================================

const SHIFTS = [
  { id: '1-2', label: 'Ca 1–2', time: '06:45–09:25' },
  { id: '3-4', label: 'Ca 3–4', time: '09:35–12:15' },
  { id: '5-6', label: 'Ca 5–6', time: '13:00–15:40' },
  { id: '7-8', label: 'Ca 7–8', time: '15:50–18:30' },
];

const DAYS = [
  { id: 2, label: 'Thứ 2', short: 'T2' },
  { id: 3, label: 'Thứ 3', short: 'T3' },
  { id: 4, label: 'Thứ 4', short: 'T4' },
  { id: 5, label: 'Thứ 5', short: 'T5' },
  { id: 6, label: 'Thứ 6', short: 'T6' },
  { id: 7, label: 'Thứ 7', short: 'T7' },
  { id: 8, label: 'CN', short: 'CN' },
];

const CARD_COLORS_DARK = [
  { bg: 'rgba(6,182,212,0.25)', border: 'rgba(6,182,212,0.5)', text: '#67e8f9' },
  { bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.5)', text: '#c4b5fd' },
  { bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.5)', text: '#6ee7b7' },
  { bg: 'rgba(244,63,94,0.25)', border: 'rgba(244,63,94,0.5)', text: '#fda4af' },
  { bg: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.5)', text: '#fcd34d' },
  { bg: 'rgba(99,102,241,0.25)', border: 'rgba(99,102,241,0.5)', text: '#a5b4fc' },
  { bg: 'rgba(132,204,22,0.25)', border: 'rgba(132,204,22,0.5)', text: '#bef264' },
];

const CARD_COLORS_LIGHT = [
  { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', text: '#0e7490' },
  { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#6d28d9' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#047857' },
  { bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.4)', text: '#be123c' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#b45309' },
  { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#4338ca' },
  { bg: 'rgba(132,204,22,0.15)', border: 'rgba(132,204,22,0.4)', text: '#3f6212' },
];

type FormatType = 'desktop' | 'phone' | 'csv';
type ThemeType = 'dark' | 'light';

// ============================================================
// HELPER: Get event color by name index
// ============================================================

function getCardColor(eventName: string, allNames: string[], theme: ThemeType) {
  const palette = theme === 'dark' ? CARD_COLORS_DARK : CARD_COLORS_LIGHT;
  const idx = allNames.indexOf(eventName);
  return palette[Math.abs(idx) % palette.length];
}

// ============================================================
// HELPER: Spreadsheet export
// ============================================================

function safeSpreadsheetText(value: string): string {
  const cleaned = value.replace(/\0/g, '').slice(0, 500);
  return /^[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned;
}

function safeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '').slice(0, 60) || 'SinhVien';
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function exportSpreadsheetCsv(events: TimetableEvent[], profile: { full_name?: string } | null, activeDays: typeof DAYS) {
  const scheduleRows: Array<Array<string | number>> = [
    ['CA HỌC', ...activeDays.map(day => day.label.toUpperCase())],
    ...SHIFTS.map(shift => [
      `${shift.label}\n(${shift.time})`,
      ...activeDays.map(day => safeSpreadsheetText(events
        .filter(event => event.dayOfWeek === day.id && event.shift === shift.id)
        .map(event => `${event.name}\n${event.room ? `(P. ${event.room})` : ''}`.trim())
        .join('\n---\n'))),
    ]),
    [],
    ['STT', 'TÊN HỌC PHẦN', 'THỨ', 'CA HỌC', 'GIỜ HỌC', 'PHÒNG HỌC'],
  ];
  [...events]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .forEach((event, index) => {
      const dayName = DAYS.find(day => day.id === event.dayOfWeek)?.label ?? '';
      const shiftLabel = SHIFTS.find(shift => shift.id === event.shift)?.label ?? event.shift;
      const time = event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime;
      scheduleRows.push([index + 1, safeSpreadsheetText(event.name), dayName, safeSpreadsheetText(shiftLabel), time, safeSpreadsheetText(event.room)]);
    });
  const csv = `\uFEFF${scheduleRows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `TKB_neuOS_${safeFileName(profile?.full_name ?? '')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// SUB-COMPONENT: Timetable Canvas (used for Preview & Export)
// ============================================================

interface CanvasProps {
  width: number;
  height: number;
  format: 'desktop' | 'phone';
  theme: ThemeType;
  events: TimetableEvent[];
  profile: any;
  showInfo: boolean;
  hideEmpty: boolean;
  leaveClockSpace: boolean;
}

const TimetableCanvas = React.forwardRef<HTMLDivElement, CanvasProps>(
  ({ width, height, format, theme, events, profile, showInfo, hideEmpty, leaveClockSpace }, ref) => {
    let activeDays = DAYS;
    if (hideEmpty) {
      const active = DAYS.filter(d => events.some(e => e.dayOfWeek === d.id));
      activeDays = active.length > 0 ? active : [DAYS[0]];
    }

    const uniqueNames = Array.from(new Set(events.map(e => e.name)));
    const isDark = theme === 'dark';
    const isPhone = format === 'phone';

    const bgGradient = isDark
      ? 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)'
      : 'linear-gradient(135deg, #f1f5f9 0%, #eff6ff 40%, #e0e7ff 100%)';

    const textColor = isDark ? '#ffffff' : '#1e293b';
    const panelBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)';
    const panelBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)';
    const gridBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
    const headerBg = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)';
    const shiftColBg = isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)';

    const padding = isPhone ? 40 : 60;
    const clockSpaceHeight = isPhone && leaveClockSpace ? height * 0.28 : 0;
    const shiftColWidth = isPhone ? 190 : 245;

    const titleFontSize = isPhone ? 36 : 52;
    const subtitleFontSize = isPhone ? 20 : 28;
    const dayHeaderFontSize = isPhone ? 20 : 22;
    const shiftLabelFontSize = isPhone ? 18 : 20;
    const shiftTimeFontSize = isPhone ? 14 : 16;
    const cardTitleFontSize = isPhone ? 16 : 18;
    const cardDetailFontSize = isPhone ? 13 : 14;
    const profileInfoValues = [profile?.major_name, profile?.student_code]
      .filter((value): value is string => Boolean(value));
    const profileMajor = profileInfoValues.find(value => !/^\d{5,}$/.test(value.trim())) ?? profile?.major_name;
    const profileCode = profileInfoValues.find(value => /^\d{5,}$/.test(value.trim())) ?? profile?.student_code;
    const academicInfo = [profileMajor, profileCode].filter(Boolean).join(' · ');

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: bgGradient,
          color: textColor,
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Background blurs */}
        <div style={{
          position: 'absolute', top: '-8%', left: '-8%',
          width: '35%', height: '35%',
          background: 'rgba(6,182,212,0.15)', borderRadius: '50%',
          filter: 'blur(120px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8%', right: '-8%',
          width: '40%', height: '40%',
          background: 'rgba(99,102,241,0.15)', borderRadius: '50%',
          filter: 'blur(150px)', pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding,
          paddingTop: padding + clockSpaceHeight,
          boxSizing: 'border-box',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isPhone ? 'flex-start' : 'flex-end',
            marginBottom: isPhone ? 24 : 36,
            flexShrink: 0,
            flexDirection: isPhone ? 'column' : 'row',
            gap: isPhone ? 12 : 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isPhone ? 16 : 24 }}>
              <div>
                <div style={{ fontSize: titleFontSize, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  neuOS
                </div>
                <div style={{ fontSize: subtitleFontSize, opacity: 0.6, fontWeight: 500, marginTop: 4 }}>
                  Thời khóa biểu cá nhân
                </div>
              </div>
            </div>

            {showInfo && profile && (
              <div style={{
                background: panelBg,
                border: `1px solid ${panelBorder}`,
                backdropFilter: 'blur(20px)',
                borderRadius: isPhone ? 16 : 24,
                padding: isPhone ? '12px 20px' : '16px 32px',
                textAlign: isPhone ? 'left' : 'right',
                width: isPhone ? 360 : undefined,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontSize: isPhone ? 22 : 28, fontWeight: 700, marginBottom: 4 }}>
                  {profile.full_name || 'Sinh viên'}
                </div>
                <div style={{
                  fontSize: isPhone ? 15 : 22,
                  opacity: 0.6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {academicInfo || 'Chưa chọn ngành'}
                </div>
              </div>
            )}
          </div>

          {/* Timetable Grid */}
          <div style={{
            flex: 1,
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            backdropFilter: 'blur(20px)',
            borderRadius: isPhone ? 20 : 28,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            {/* Day Headers */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${gridBorder}`,
              flexShrink: 0,
            }}>
              <div style={{
                width: shiftColWidth, minWidth: shiftColWidth, maxWidth: shiftColWidth,
                borderRight: `1px solid ${gridBorder}`,
                background: headerBg,
                boxSizing: 'border-box',
              }} />
              {activeDays.map(d => (
                <div key={d.id} style={{
                  flex: 1,
                  padding: isPhone ? '12px 4px' : '16px 8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: dayHeaderFontSize,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRight: `1px solid ${gridBorder}`,
                  background: headerBg,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}>
                  {d.label}
                </div>
              ))}
            </div>

            {/* Shift Rows */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {SHIFTS.map((shift, shiftIdx) => (
                <div key={shift.id} style={{
                  flex: 1,
                  display: 'flex',
                  borderBottom: shiftIdx < SHIFTS.length - 1 ? `1px solid ${gridBorder}` : 'none',
                  minHeight: 0,
                }}>
                  {/* Shift label */}
                  <div style={{
                    width: shiftColWidth, minWidth: shiftColWidth, maxWidth: shiftColWidth,
                    borderRight: `1px solid ${gridBorder}`,
                    background: shiftColBg,
                    display: 'flex', flexDirection: 'row', gap: isPhone ? 8 : 12,
                    alignItems: 'center', justifyContent: 'center',
                    padding: '8px 10px',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: shiftLabelFontSize }}>{shift.label}</div>
                    <div style={{ fontSize: shiftTimeFontSize, opacity: 0.58 }}>· {shift.time}</div>
                  </div>

                  {/* Day cells */}
                  {activeDays.map(day => {
                    const cellEvents = events.filter(e => e.dayOfWeek === day.id && e.shift === shift.id);
                    return (
                      <div key={day.id} style={{
                        flex: 1,
                        borderRight: `1px solid ${gridBorder}`,
                        padding: isPhone ? 4 : 6,
                        display: 'flex', flexDirection: 'column', gap: 4,
                        boxSizing: 'border-box',
                        minHeight: 0,
                        overflow: 'hidden',
                      }}>
                        {cellEvents.map((ev, i) => {
                          const color = getCardColor(ev.name, uniqueNames, theme);
                          return (
                            <div key={i} style={{
                              flex: cellEvents.length === 1 ? 1 : undefined,
                              background: color.bg,
                              border: `1.5px solid ${color.border}`,
                              borderRadius: isPhone ? 10 : 14,
                              padding: isPhone ? '6px 8px' : '10px 12px',
                              display: 'flex', flexDirection: 'column',
                              justifyContent: 'space-between',
                              overflow: 'hidden',
                              minHeight: 0,
                              backdropFilter: 'blur(8px)',
                            }}>
                              <div style={{
                                fontWeight: 700,
                                fontSize: cardTitleFontSize,
                                lineHeight: 1.25,
                                color: color.text,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: isPhone ? 2 : 3,
                                WebkitBoxOrient: 'vertical' as const,
                              }}>
                                {ev.name}
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: isPhone ? 4 : 8,
                                gap: 4,
                              }}>
                                {ev.room && (
                                  <div style={{
                                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)',
                                    padding: isPhone ? '2px 6px' : '3px 10px',
                                    borderRadius: 8,
                                    fontSize: cardDetailFontSize,
                                    fontWeight: 600,
                                    backdropFilter: 'blur(8px)',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {ev.room}
                                  </div>
                                )}
                                {ev.type === 'THI' && (
                                  <div style={{
                                    background: 'rgba(239,68,68,0.7)',
                                    padding: '2px 8px', borderRadius: 8,
                                    fontSize: cardDetailFontSize, fontWeight: 700,
                                    color: '#fff',
                                  }}>
                                    THI
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TimetableCanvas.displayName = 'TimetableCanvas';

// ============================================================
// SUB-COMPONENT: Preview Scaler (ResizeObserver)
// ============================================================

function PreviewScaler({ parentWidth, parentHeight }: { parentWidth: number; parentHeight: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const updateScale = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleX = cw / parentWidth;
      const scaleY = ch / parentHeight;
      const scale = Math.min(scaleX, scaleY);
      container.style.setProperty('--preview-scale', String(scale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [parentWidth, parentHeight]);

  return <div ref={containerRef} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ExportTimetableModal({ isOpen, onClose, events, profile }: ExportModalProps) {
  const [format, setFormat] = useState<FormatType>('desktop');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [showInfo, setShowInfo] = useState(true);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [leaveClockSpace, setLeaveClockSpace] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportCanvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activeDays = hideEmpty
    ? (() => {
        const active = DAYS.filter(d => events.some(e => e.dayOfWeek === d.id));
        return active.length > 0 ? active : [DAYS[0]];
      })()
    : DAYS;

  const canvasW = format === 'desktop' ? 1920 : 1080;
  const canvasH = format === 'desktop' ? 1080 : 1920;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const fileNameBase = `TKB_neuOS_${profile?.full_name ? profile.full_name.replace(/\s+/g, '') : 'SinhVien'}`;

      if (format === 'csv') {
        exportSpreadsheetCsv(events, profile, activeDays);
      } else {
        if (!exportCanvasRef.current) return;

        // 1920×1080 / 1080×1920 is already crisp on phone screens. JPEG at
        // high quality avoids the very large, lossless PNG files created at 2×.
        const dataUrl = await htmlToImage.toJpeg(exportCanvasRef.current, {
          pixelRatio: 1,
          quality: 0.92,
          cacheBust: true,
          style: { transform: 'none' },
        });

        // Do not fetch the data URL here: some Android WebViews block data: URLs
        // under their security policy. Decoding it locally works in browsers and PWAs.
        const base64Image = dataUrl.slice(dataUrl.indexOf(',') + 1);
        const binaryImage = window.atob(base64Image);
        const imageBytes = new Uint8Array(binaryImage.length);
        for (let index = 0; index < binaryImage.length; index += 1) {
          imageBytes[index] = binaryImage.charCodeAt(index);
        }
        const imageFile = new File(
          [imageBytes],
          `${fileNameBase}_${format}.jpg`,
          { type: 'image/jpeg' }
        );

        // On an installed iPhone/iPad PWA, this opens the native share sheet
        // so students can choose "Save Image" directly into Photos. Browsers
        // intentionally do not permit a website to write to Photos silently.
        const canShareFile = typeof navigator.share === 'function'
          && (typeof navigator.canShare !== 'function'
            || navigator.canShare({ files: [imageFile] }));

        if (canShareFile) {
          try {
            await navigator.share({
              files: [imageFile],
              title: 'Thời khóa biểu neuOS',
            });
            return;
          } catch (shareError) {
            // Closing the native sheet is an intentional cancellation, not an error.
            if (shareError instanceof DOMException && shareError.name === 'AbortError') {
              return;
            }
            console.warn('Native image sharing unavailable, using download instead.', shareError);
          }
        }

        // Desktop and older browsers retain the familiar direct-download fallback.
        const objectUrl = URL.createObjectURL(imageFile);
        const link = document.createElement('a');
        link.download = imageFile.name;
        link.href = objectUrl;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Có lỗi xảy ra khi xuất file. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const previewContainerStyle: React.CSSProperties = format === 'desktop'
    ? { width: '100%', aspectRatio: '16/9', position: 'relative', overflow: 'hidden', borderRadius: 12, border: '3px solid rgba(100,116,139,0.3)' }
    : { height: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 28, border: '6px solid rgba(30,41,59,0.8)', margin: '0 auto' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-glass-panel backdrop-blur-3xl border border-glass-border rounded-[2rem] p-4 sm:p-8 w-full max-w-6xl h-[calc(100dvh-1rem)] sm:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-cyan-500/20 items-center justify-center border border-cyan-500/30">
              <Download className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-wide">Xuất Thời Khóa Biểu</h2>
              <p className="text-foreground/60 text-xs sm:text-sm">Xem trước trực tiếp trước khi tải xuống.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng cửa sổ xuất thời khóa biểu" className="w-11 h-11 text-foreground/50 hover:text-foreground hover:bg-foreground/10 flex items-center justify-center rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 relative z-10">

          {/* Left: Controls */}
          <div className="order-2 lg:order-1 w-full lg:w-[35%] flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto pr-1 lg:pr-2 pb-4" style={{ scrollbarWidth: 'none' }}>

            {/* 1. Format */}
            <div>
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">1. Định dạng xuất</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setFormat('desktop')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${format === 'desktop' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'}`}>
                  <Monitor size={28} />
                  <span className="text-xs font-bold text-center">Desktop (16:9)</span>
                </button>
                <button onClick={() => setFormat('phone')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${format === 'phone' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'}`}>
                  <Smartphone size={28} />
                  <span className="text-xs font-bold text-center">Điện thoại (9:16)</span>
                </button>
                <button onClick={() => setFormat('csv')}
                  className={`col-span-2 p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${format === 'csv' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,238,0.3)]' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'}`}>
                  <TableIcon size={20} />
                  <span className="text-sm font-bold">Bảng tính CSV (mở bằng Excel)</span>
                </button>
              </div>
              {format !== 'csv' && (
                <p className="mt-2 text-xs text-foreground/55">Ảnh JPEG chất lượng cao, tối ưu dung lượng khi tải về điện thoại.</p>
              )}
            </div>

            {/* 2. Theme */}
            <div className={format === 'csv' ? 'opacity-40 pointer-events-none' : ''}>
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">2. Giao diện (Theme)</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTheme('dark')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-foreground/20 border-white text-foreground' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'}`}>
                  <Moon size={18} />
                  <span className="text-sm font-bold">Dark Glass</span>
                </button>
                <button onClick={() => setTheme('light')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:bg-foreground/10'}`}>
                  <Sun size={18} />
                  <span className="text-sm font-bold">Light Glass</span>
                </button>
              </div>
            </div>

            {/* 3. Options */}
            <div className={format === 'csv' ? 'opacity-40 pointer-events-none' : ''}>
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">3. Tùy chỉnh</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between bg-foreground/5 p-3 rounded-xl border border-foreground/10 cursor-pointer hover:bg-foreground/10 transition-colors">
                  <span className="text-sm text-foreground/80">Hiện thông tin sinh viên</span>
                  <input type="checkbox" checked={showInfo} onChange={e => setShowInfo(e.target.checked)} className="w-4 h-4 accent-cyan-500 rounded" />
                </label>
                <label className="flex items-center justify-between bg-foreground/5 p-3 rounded-xl border border-foreground/10 cursor-pointer hover:bg-foreground/10 transition-colors">
                  <span className="text-sm text-foreground/80">Ẩn ngày không có lịch</span>
                  <input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} className="w-4 h-4 accent-cyan-500 rounded" />
                </label>
                {format === 'phone' && (
                  <label className="flex items-center justify-between bg-foreground/5 p-3 rounded-xl border border-foreground/10 cursor-pointer hover:bg-foreground/10 transition-colors">
                    <span className="text-sm text-foreground/80">Chừa khoảng trống đồng hồ</span>
                    <input type="checkbox" checked={leaveClockSpace} onChange={e => setLeaveClockSpace(e.target.checked)} className="w-4 h-4 accent-cyan-500 rounded" />
                  </label>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-auto pt-4">
              <button onClick={handleExport} disabled={isExporting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-foreground font-bold py-4 px-6 rounded-2xl shadow-[0_8px_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60">
                {isExporting ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
                {isExporting ? 'Đang xử lý...' : format === 'csv' ? 'Tải bảng tính' : 'Lưu ảnh / Chia sẻ'}
              </button>
              {format !== 'csv' && (
                <p className="mt-2 text-center text-xs text-foreground/55">
                  Trên iPhone, chọn “Lưu ảnh” trong bảng Chia sẻ.
                </p>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="order-1 lg:order-2 w-full lg:w-[65%] h-[31vh] min-h-[220px] sm:h-[36vh] lg:h-full lg:min-h-0 flex-shrink-0 flex flex-col bg-black/5 dark:bg-black/40 rounded-2xl lg:rounded-[2rem] border border-glass-border p-3 sm:p-4 relative overflow-hidden items-center justify-center">

            {format === 'csv' ? (
              <div className="text-center flex flex-col items-center opacity-70">
                <TableIcon size={80} className="text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Định dạng CSV</h3>
                <p className="text-foreground/70 max-w-md">
                  CSV mở trực tiếp bằng Excel và được mã hóa UTF-8 để hiển thị tiếng Việt chính xác.
                  Bấm <strong>Tải Xuống</strong> để xuất file.
                </p>
              </div>
            ) : (
              <div style={previewContainerStyle}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: canvasW,
                  height: canvasH,
                  transformOrigin: 'top left',
                  transform: `scale(var(--preview-scale, 0.35))`,
                }}>
                  <TimetableCanvas
                    width={canvasW}
                    height={canvasH}
                    format={format}
                    theme={theme}
                    events={events}
                    profile={profile}
                    showInfo={showInfo}
                    hideEmpty={hideEmpty}
                    leaveClockSpace={leaveClockSpace}
                  />
                </div>
                <PreviewScaler parentWidth={canvasW} parentHeight={canvasH} />
              </div>
            )}

            {format !== 'csv' && (
              <div className="absolute bottom-3 sm:bottom-6 bg-black/60 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-foreground/80 text-xs sm:text-sm backdrop-blur-md">
                Xem trước trực tiếp
              </div>
            )}
          </div>
        </div>

        {/* Hidden full-resolution canvas for image export */}
        {format !== 'csv' && (
          <div
            style={{
              position: 'fixed',
              left: -99999,
              top: -99999,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1,
            }}
            aria-hidden="true"
          >
            <TimetableCanvas
              ref={exportCanvasRef}
              width={canvasW}
              height={canvasH}
              format={format}
              theme={theme}
              events={events}
              profile={profile}
              showInfo={showInfo}
              hideEmpty={hideEmpty}
              leaveClockSpace={leaveClockSpace}
            />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
