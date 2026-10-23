import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, IndianRupee, AlertCircle, Plus, Minus, CheckCircle2, Calculator, ArrowRight, Share2, Download, FileText, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Trip } from '../types/travel';

interface ExpenseSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onOpenSetBudget?: () => void;
}

/**
 * Draws a sharp vector Rupee glyph (₹) directly into the jsPDF canvas
 * to guarantee flawless visual rendering in all PDF viewers.
 */
function drawRupeeGlyph(doc: jsPDF, x: number, y: number, sizePt: number = 10): number {
  const mm = sizePt * 0.352778;
  const w = mm * 0.55;
  const h = mm * 0.78;
  const topY = y - h * 0.88;
  const midY = topY + h * 0.35;
  const loopBottom = topY + h * 0.58;
  const lineW = Math.max(0.18, mm * 0.08);

  doc.setLineWidth(lineW);
  // Top horizontal bar
  doc.line(x, topY, x + w, topY);
  // Mid horizontal bar
  doc.line(x, midY, x + w * 0.82, midY);
  // Left vertical stem
  doc.line(x + w * 0.15, topY, x + w * 0.15, loopBottom);
  // Rounded upper loop
  doc.line(x + w * 0.15, topY, x + w * 0.58, topY);
  doc.line(x + w * 0.58, topY, x + w * 0.58, loopBottom);
  doc.line(x + w * 0.58, loopBottom, x + w * 0.15, loopBottom);
  // Diagonal leg down-right
  doc.line(x + w * 0.25, loopBottom, x + w * 0.85, y);

  return w;
}

/**
 * Generates a clean, standalone one-page PDF summarizing the itinerary expense split.
 */
function generateExpenseSplitPdf(options: {
  trip: Trip;
  totalBudget: number;
  memberCount: number;
  perPersonShare: number;
  formattedPerPerson: string;
  remainderMessage: string;
}): jsPDF {
  const { trip, totalBudget, memberCount, formattedPerPerson, remainderMessage } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  // 1. Top Decorative Brand Banner
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header Section
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, 10, contentWidth, 24, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, 10, contentWidth, 24, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('GLOBE TROTTER', margin + 6, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Travel Itinerary Expense Splitter Report', margin + 6, 25);

  const now = new Date();
  const dateStr =
    now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('GENERATED ON', pageWidth - margin - 6, 19, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(dateStr, pageWidth - margin - 6, 25, { align: 'right' });

  // 3. Itinerary Card
  let curY = 38;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, curY, contentWidth, 22, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 22, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ITINERARY DETAILS', margin + 6, curY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const truncatedName = doc.splitTextToSize(`${trip.name} (Itinerary #${trip.id})`, contentWidth - 12)[0];
  doc.text(truncatedName, margin + 6, curY + 14);

  // 4. Primary Hero Card: Per-Person Share
  curY = 64;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(margin, curY, contentWidth, 42, 4, 4, 'F');
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, curY, contentWidth, 42, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('PER-PERSON SHARE', pageWidth / 2, curY + 8.5, { align: 'center' });

  // Draw Rupee glyph + amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(6, 78, 59); // emerald-950

  const amountStr = formattedPerPerson;
  const numWidth = doc.getTextWidth(amountStr);
  const glyphSizePt = 24;
  const glyphWidthMm = glyphSizePt * 0.352778 * 0.55;
  const gapMm = 2;
  const totalShareWidth = glyphWidthMm + gapMm + numWidth;
  const startShareX = (pageWidth - totalShareWidth) / 2;

  doc.setDrawColor(6, 78, 59);
  drawRupeeGlyph(doc, startShareX, curY + 22, glyphSizePt);
  doc.text(amountStr, startShareX + glyphWidthMm + gapMm, curY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total budget divided among ${memberCount} ${memberCount === 1 ? 'member' : 'members'}`,
    pageWidth / 2,
    curY + 28,
    { align: 'center' }
  );

  if (remainderMessage) {
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(margin + 10, curY + 32, contentWidth - 20, 6.5, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(4, 120, 87);
    doc.text(remainderMessage, pageWidth / 2, curY + 36.5, { align: 'center' });
  }

  // 5. Total Budget & Members Summary Banner
  curY = 111;
  const colW = (contentWidth - 6) / 2;

  // Left: Total Budget
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, colW, 21, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, colW, 21, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ITINERARY BUDGET', margin + 5, curY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(15, 23, 42);
  const budgetStr = totalBudget.toLocaleString('en-IN');
  const bGlyphW = drawRupeeGlyph(doc, margin + 5, curY + 14.5, 12);
  doc.text(budgetStr, margin + 5 + bGlyphW + 1.5, curY + 14.5);

  // Right: Members Splitting
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colW + 6, curY, colW, 21, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + colW + 6, curY, colW, 21, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MEMBERS SPLITTING', margin + colW + 11, curY + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${memberCount} ${memberCount === 1 ? 'Traveler' : 'Travelers'}`, margin + colW + 11, curY + 14.5);

  // 6. Individual Member Breakdown
  curY = 138;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('INDIVIDUAL MEMBER BREAKDOWN', margin, curY);

  curY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('MEMBER', margin + 4, curY + 4.8);
  doc.text('SHARE AMOUNT', margin + 65, curY + 4.8);
  doc.text('ALLOCATION NOTE', margin + 120, curY + 4.8);

  curY += 7;
  const totalInPaise = Math.round(totalBudget * 100);
  const basePaise = Math.floor(totalInPaise / memberCount);
  const remPaise = totalInPaise % memberCount;
  const isIntegerBudget = Number.isInteger(totalBudget);
  const wholeRemainder = Math.floor(totalBudget) % memberCount;

  const maxRows = Math.min(memberCount, 16);
  for (let i = 0; i < maxRows; i++) {
    const isOdd = i % 2 === 1;
    if (isOdd) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, contentWidth, 6.5, 'F');
    }
    const sharePaise = basePaise + (i < remPaise ? 1 : 0);
    const amtFormatted = (sharePaise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    let note = 'Standard equal share';
    if (remPaise > 0) {
      if (isIntegerBudget && wholeRemainder > 0 && i < wholeRemainder) {
        note = '+₹1 remainder adjustment';
      } else if (i < remPaise) {
        note = '+₹0.01 remainder adjustment';
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Member ${i + 1}`, margin + 4, curY + 4.5);

    // Share amount with rupee glyph
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(15, 23, 42);
    const mGlyphW = drawRupeeGlyph(doc, margin + 65, curY + 4.5, 8);
    doc.text(amtFormatted, margin + 65 + mGlyphW + 1, curY + 4.5);

    // Note
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(i < remPaise ? 180 : 100, i < remPaise ? 83 : 116, i < remPaise ? 9 : 139);
    doc.text(note, margin + 120, curY + 4.5);

    curY += 6.5;
  }

  if (memberCount > 16) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`+ ${memberCount - 16} additional members pay identical equal shares`, margin + 4, curY + 4);
  }

  // 7. Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 275, pageWidth - margin, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Globe Trotter Travel Planner • Expense Splitter Report • Page 1 of 1', pageWidth / 2, 281, { align: 'center' });
  doc.text('This PDF reflects the active itinerary budget and member split at the time of export.', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

export const ExpenseSplitterModal: React.FC<ExpenseSplitterModalProps> = ({
  isOpen,
  onClose,
  trip,
  onOpenSetBudget,
}) => {
  // Retrieve saved member count for this specific itinerary from localStorage, default to 2
  const storageKey = `gt_expense_splitter_members_${trip.id}`;

  const [memberCountInput, setMemberCountInput] = useState<string>('2');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync member count when modal opens or when itinerary changes
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && !isNaN(parseInt(saved, 10))) {
          const parsed = parseInt(saved, 10);
          if (parsed >= 1 && parsed <= 50) {
            setMemberCountInput(String(parsed));
            setInlineError(null);
            return;
          }
        }
      } catch (e) {
        // Fallback to default
      }
      setMemberCountInput('2');
      setInlineError(null);
    }
  }, [isOpen, trip.id, storageKey]);

  // Validation
  const validationResult = useMemo(() => {
    const raw = memberCountInput.trim();
    if (!raw) {
      return { isValid: false, count: 0, error: 'Member count cannot be blank.' };
    }
    if (raw.includes('.')) {
      return { isValid: false, count: 0, error: 'Member count must be a whole number (no decimals).' };
    }
    const num = Number(raw);
    if (isNaN(num)) {
      return { isValid: false, count: 0, error: 'Please enter a valid whole number of members.' };
    }
    if (!Number.isInteger(num)) {
      return { isValid: false, count: 0, error: 'Member count must be a whole number.' };
    }
    if (num < 1) {
      return { isValid: false, count: 0, error: 'Member count must be at least 1.' };
    }
    if (num > 50) {
      return { isValid: false, count: 0, error: 'Member count cannot exceed 50.' };
    }

    return { isValid: true, count: num, error: null };
  }, [memberCountInput]);

  // Save to localStorage when valid
  const handleMemberCountChange = (newValue: string) => {
    setMemberCountInput(newValue);
    const trimmed = newValue.trim();
    if (trimmed && !trimmed.includes('.')) {
      const parsed = Number(trimmed);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 50) {
        try {
          localStorage.setItem(storageKey, String(parsed));
        } catch (e) {
          // LocalStorage fallback
        }
      }
    }
  };

  const updateCountWithNumber = (nextNum: number) => {
    const clamped = Math.max(1, Math.min(50, nextNum));
    handleMemberCountChange(String(clamped));
  };

  if (!isOpen) return null;

  const totalBudget = Number(trip.budget_total) || 0;
  const hasBudget = totalBudget > 0;
  const isValid = validationResult.isValid;
  const memberCount = validationResult.count;

  // Split calculations (2 decimals)
  const perPersonShare = isValid && hasBudget ? totalBudget / memberCount : 0;
  const formattedPerPerson = perPersonShare.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Remainder and rounding handling
  // Total in paise/cents
  const totalInPaise = Math.round(totalBudget * 100);
  const basePaisePerPerson = isValid && memberCount > 0 ? Math.floor(totalInPaise / memberCount) : 0;
  const remainderPaise = isValid && memberCount > 0 ? totalInPaise % memberCount : 0;

  // Integer division remainder (for whole rupee amounts)
  const isIntegerBudget = Number.isInteger(totalBudget);
  const wholeRemainder = isValid && memberCount > 0 ? Math.floor(totalBudget) % memberCount : 0;

  let remainderMessage = '';
  if (isValid && hasBudget) {
    if (remainderPaise === 0) {
      remainderMessage = `Divides evenly! Every member pays exactly ₹${(basePaisePerPerson / 100).toFixed(2)}`;
    } else if (isIntegerBudget && wholeRemainder > 0 && Math.floor(totalBudget / memberCount) > 0) {
      remainderMessage = wholeRemainder === 1
        ? '₹1 extra added to Member 1'
        : `₹1 extra added to Members 1 to ${wholeRemainder}`;
    } else {
      remainderMessage = remainderPaise === 1
        ? '₹0.01 extra added to Member 1'
        : `₹0.01 extra added to Members 1 to ${remainderPaise}`;
    }
  }

  // Share as PDF handler: Web Share API on mobile, fallback download on desktop/unsupported
  const handleSharePdf = async () => {
    if (!hasBudget || !isValid) return;

    setIsGeneratingPdf(true);
    setShareToast(null);

    try {
      const doc = generateExpenseSplitPdf({
        trip,
        totalBudget,
        memberCount,
        perPersonShare,
        formattedPerPerson,
        remainderMessage,
      });

      const safeTripName = (trip.name || 'itinerary')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${safeTripName}-expense-split.pdf`;

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      let shared = false;

      // Check if Web Share API with files is supported (mobile browsers, etc.)
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `${trip.name} - Expense Split`,
            text: `Expense split for ${trip.name} (Budget: ₹${totalBudget.toLocaleString('en-IN')}, Per person: ₹${formattedPerPerson})`,
          });
          shared = true;
          setShareToast({ type: 'success', message: 'Shared PDF successfully!' });
        } catch (shareErr: any) {
          // If the user cancelled the native share sheet, do not trigger fallback download
          if (shareErr?.name === 'AbortError') {
            setIsGeneratingPdf(false);
            return;
          }
          // Otherwise fall back to direct file download
        }
      }

      if (!shared) {
        // Fallback: direct download
        doc.save(filename);
        setShareToast({ type: 'success', message: 'PDF downloaded!' });
      }
    } catch (error) {
      console.error('Failed to generate expense split PDF:', error);
      setShareToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => {
        setShareToast(null);
      }, 3500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider">
                  Expense Splitter
                </span>
                <span className="text-xs text-emerald-100 font-medium truncate max-w-[170px] sm:max-w-[220px]">
                  ID #{trip.id}
                </span>
              </div>
              <h2 className="text-lg font-bold font-serif-heading text-white truncate max-w-[230px] sm:max-w-[300px] mt-0.5">
                {trip.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Expense Splitter"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Edge Case 1: Budget Empty or 0 */}
          {!hasBudget ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">No Budget Allocated</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Add a budget to this itinerary to split expenses.
                  </p>
                </div>
              </div>
              {onOpenSetBudget && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetBudget();
                  }}
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>Set Itinerary Budget</span>
                </button>
              )}

              {/* Disabled Share as PDF button when budget is empty/0 */}
              <button
                type="button"
                disabled
                className="min-h-[44px] w-full px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 border border-slate-200 cursor-not-allowed opacity-60"
                aria-label="Share as PDF (Disabled - No Budget)"
                title="Add a budget to this itinerary to split expenses and share PDF"
              >
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share as PDF</span>
              </button>
            </div>
          ) : (
            <>
              {/* PRIMARY PROMINENT ELEMENT: Per-Person Share */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 rounded-3xl border-2 border-emerald-500/30 shadow-xs text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 px-3 py-1 rounded-full bg-emerald-100/90 inline-block">
                  Per-Person Share
                </span>

                <div className="mt-2 flex items-baseline justify-center space-x-1 text-slate-900">
                  <span className="text-2xl font-bold text-emerald-700">₹</span>
                  <span className="text-4xl sm:text-5xl font-extrabold font-serif-heading tracking-tight text-emerald-950">
                    {isValid ? formattedPerPerson : '—'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1.5">
                  {isValid
                    ? `Total budget divided among ${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
                    : 'Enter a valid member count to calculate share'}
                </p>

                {/* Remainder notification badge */}
                {isValid && remainderMessage && (
                  <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-center space-x-1.5 text-xs font-medium text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{remainderMessage}</span>
                  </div>
                )}
              </div>

              {/* Share as PDF Button - Placed inside Expense Splitter modal, below the per-person share */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={!hasBudget || !isValid || isGeneratingPdf}
                  className="min-h-[44px] w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-emerald-600/30"
                  aria-label="Share as PDF"
                  title={
                    !hasBudget
                      ? 'Add a budget to share PDF'
                      : !isValid
                      ? 'Enter a valid member count to share PDF'
                      : 'Share or download expense split PDF'
                  }
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-emerald-100" />
                      <span>Share as PDF</span>
                    </>
                  )}
                </button>

                {/* Toast status feedback */}
                {shareToast && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-150 ${
                      shareToast.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {shareToast.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{shareToast.message}</span>
                  </div>
                )}
              </div>

              {/* Total Budget & Members summary banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Itinerary Budget
                  </span>
                  <div className="flex items-center space-x-1 text-slate-900 font-bold text-base mt-0.5">
                    <span className="text-sm text-slate-500">₹</span>
                    <span>{totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Members Splitting
                  </span>
                  <div className="flex items-center space-x-1 text-slate-900 font-bold text-base mt-0.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{isValid ? `${memberCount} People` : 'Invalid'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Member Count Stepper & Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="member-stepper-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Split Among Members (1 to 50)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Saved automatically</span>
            </div>

            {/* Stepper with typing */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => updateCountWithNumber((isValid ? memberCount : 2) - 1)}
                disabled={isValid && memberCount <= 1}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:active:scale-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer font-bold shadow-2xs border border-slate-200/80"
                aria-label="Decrease members"
                title="Decrease members"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  id="member-stepper-input"
                  type="text"
                  inputMode="numeric"
                  value={memberCountInput}
                  onChange={(e) => handleMemberCountChange(e.target.value)}
                  placeholder="2"
                  className={`min-h-[44px] w-full text-center text-lg font-bold rounded-2xl border px-3 transition-all focus:outline-hidden ${
                    validationResult.error
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => updateCountWithNumber((isValid ? memberCount : 2) + 1)}
                disabled={isValid && memberCount >= 50}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:active:scale-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer font-bold shadow-2xs border border-slate-200/80"
                aria-label="Increase members"
                title="Increase members"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Edge Case 2: Inline error for invalid member count */}
            {validationResult.error && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200/80 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{validationResult.error}</span>
              </div>
            )}

            {/* Quick preset buttons (touch targets >= 44px) */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: '1 Solo', value: 1 },
                { label: '2 Duo', value: 2 },
                { label: '3 Trio', value: 3 },
                { label: '4 Quad', value: 4 },
                { label: '5 Team', value: 5 },
              ].map((p) => {
                const isActive = isValid && memberCount === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateCountWithNumber(p.value)}
                    className={`min-h-[44px] px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Member Share Breakdown List (Visible when valid and > 1 member) */}
          {isValid && hasBudget && memberCount > 1 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Individual Share Breakdown
              </span>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {Array.from({ length: Math.min(memberCount, 12) }).map((_, idx) => {
                  const memberIndex = idx + 1;
                  // If there is an uneven division, remainder is added to first few members
                  let memberShareCents = basePaisePerPerson;
                  if (idx < remainderPaise) {
                    memberShareCents += 1;
                  }
                  const memberAmount = (memberShareCents / 100).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  const hasExtra = idx < remainderPaise;

                  return (
                    <div
                      key={memberIndex}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {memberIndex}
                        </span>
                        <span className="font-semibold text-slate-800">
                          Member {memberIndex}
                        </span>
                        {hasExtra && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            +remainder
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{memberAmount}
                      </span>
                    </div>
                  );
                })}

                {memberCount > 12 && (
                  <p className="text-[11px] text-center text-slate-400 py-1 italic">
                    + {memberCount - 12} more members with identical share
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 truncate">
            {trip.name} • {hasBudget ? `₹${totalBudget.toLocaleString('en-IN')}` : 'No Budget'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
