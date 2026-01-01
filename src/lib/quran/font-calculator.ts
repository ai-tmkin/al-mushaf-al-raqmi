/**
 * Font Calculator
 * الإعدادات المعتمدة لعرض صفحات المصحف
 * 
 * تم اعتماد هذه القيم من font-test.html بعد الاختبار المكثف
 */

export interface FontCalculationResult {
  fontSize: number;
  lineHeight: number;
  wordSpacing: number;
  letterSpacing: number;
}

export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * عدد الأسطر الثابت في صفحة المصحف
 */
export const LINES_PER_PAGE = 15;

/**
 * الإعدادات الثابتة المعتمدة لكل حجم شاشة
 * Desktop: 670×1280, fontSize: 22.78px, lineHeight: 70.5px
 * Tablet: 500×960, fontSize: 17.00px, lineHeight: 53.76px
 * Mobile: 350×640, fontSize: 11.90px, lineHeight: 35.41px
 */
export const FIXED_SETTINGS = {
  desktop: {
    width: 620,  // عرض مناسب للنص
    height: 1280,
    fontSize: 22.78,
    lineHeight: 70.5,
    wordSpacing: 1.5,  // مسافة متوسطة بين الكلمات
    letterSpacing: 0.3, // مسافة صغيرة بين الحروف
  },
  tablet: {
    width: 500,
    height: 960,
    fontSize: 17.00,
    lineHeight: 53.76,
    wordSpacing: 1.36,
    letterSpacing: 0.34,
  },
  mobile: {
    width: 350,
    height: 640,
    fontSize: 11.90,
    lineHeight: 35.41,
    wordSpacing: 0.95,
    letterSpacing: 0.24,
  },
} as const;

/**
 * الأبعاد الثابتة لكل نمط عرض (للتوافق مع الكود القديم)
 */
export const PAGE_DIMENSIONS = {
  desktop: { width: 620, height: FIXED_SETTINGS.desktop.height },
  tablet: { width: FIXED_SETTINGS.tablet.width, height: FIXED_SETTINGS.tablet.height },
  mobile: { width: FIXED_SETTINGS.mobile.width, height: FIXED_SETTINGS.mobile.height },
} as const;

export type ViewMode = keyof typeof PAGE_DIMENSIONS;

/**
 * الحصول على الإعدادات الثابتة المعتمدة لنمط العرض
 * هذه الدالة تُرجع القيم المعتمدة مباشرة بدون حساب
 */
export function getFixedSettings(viewMode: ViewMode): FontCalculationResult {
  const settings = FIXED_SETTINGS[viewMode];
  return {
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    wordSpacing: settings.wordSpacing,
    letterSpacing: settings.letterSpacing,
  };
}

/**
 * حساب حجم الخط الأمثل بناءً على أبعاد الصفحة
 * يستخدم الإعدادات الثابتة المعتمدة بناءً على العرض
 */
export function calculateOptimalFontSize(
  pageWidth: number,
  pageHeight: number,
  availableLines: number = LINES_PER_PAGE,
  averageCharsPerLine: number = 69.5
): FontCalculationResult {
  // تحديد نمط العرض بناءً على العرض
  let viewMode: ViewMode;
  if (pageWidth >= 600) {
    viewMode = 'desktop';
  } else if (pageWidth >= 400) {
    viewMode = 'tablet';
  } else {
    viewMode = 'mobile';
  }
  
  // إرجاع الإعدادات الثابتة المعتمدة
  return getFixedSettings(viewMode);
}

/**
 * حساب حجم الخط لنمط عرض محدد
 * يستخدم الإعدادات الثابتة المعتمدة
 */
export function calculateFontSizeForViewMode(
  viewMode: ViewMode,
  availableLines: number = LINES_PER_PAGE,
  averageCharsPerLine: number = 69.5
): FontCalculationResult {
  return getFixedSettings(viewMode);
}

/**
 * تحديد نمط العرض بناءً على عرض الشاشة
 */
export function getViewModeFromWidth(width: number): ViewMode {
  if (width >= 1024) {
    return 'desktop';
  } else if (width >= 768) {
    return 'tablet';
  } else {
    return 'mobile';
  }
}

/**
 * حساب متوسط عدد الأحرف لكل سطر بناءً على محتوى الصفحة
 */
export function calculateAverageCharsPerLine(
  lines: Array<{ words: Array<{ text_uthmani: string }> }>
): number {
  if (lines.length === 0) return 20;
  
  let totalChars = 0;
  let totalLines = 0;
  
  for (const line of lines) {
    const lineText = line.words.map(w => w.text_uthmani).join(' ');
    totalChars += lineText.length;
    totalLines += 1;
  }
  
  return totalLines > 0 ? Math.round(totalChars / totalLines) : 20;
}

