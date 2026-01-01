/**
 * API Route لاسترجاع بيانات الصفحات من QUL (Tarteel)
 * 
 * يستخدم البيانات من SQLite أو JSON بدلاً من Quran.com API
 * لضمان التطابق مع المصحف المطبوع
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  getPageData, 
  getPageInfo, 
  initDatabase, 
  databaseExists,
  QULMushafPage 
} from '@/lib/quran/qul-sqlite-loader';

// هيكل البيانات (للـ JSON fallback)
interface MushafWord {
  id: number;
  mushaf_id: number;
  word_id: number | null;
  verse_id: number | null;
  text: string;
  char_type_id: number | null;
  char_type_name: string;
  line_number: number;
  page_number: number;
  position_in_verse: number | null;
  position_in_line: number | null;
  position_in_page: number | null;
  css_style: string | null;
  css_class: string | null;
}

interface MushafLine {
  line_number: number;
  words: MushafWord[];
}

interface MushafPage {
  page_number: number;
  lines: MushafLine[];
}

interface MushafData {
  mushaf_id: number;
  mushaf_name: string;
  total_pages: number;
  pages: Record<string, MushafPage>;
  extracted_at: string;
}

// تحميل البيانات (cache)
let mushafData: MushafData | null = null;
let dataLoadTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

/**
 * تحميل بيانات المصحف من JSON (fallback)
 */
function loadMushafDataFromJSON(): MushafData | null {
  const now = Date.now();
  
  // استخدام cache إذا كان موجوداً وحديثاً
  if (mushafData && (now - dataLoadTime) < CACHE_DURATION) {
    return mushafData;
  }
  
  try {
    const dataPath = path.join(process.cwd(), 'app', 'data', 'mushaf-layout-5.json');
    
    if (!fs.existsSync(dataPath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    mushafData = JSON.parse(fileContent) as MushafData;
    dataLoadTime = now;
    
    console.log(`✓ تم تحميل بيانات المصحف من JSON (${mushafData.total_pages} صفحة)`);
    return mushafData;
  } catch (error) {
    console.error('خطأ في تحميل بيانات المصحف من JSON:', error);
    return null;
  }
}

/**
 * GET /api/quran/qul-pages?page={pageNumber}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get('page');
    
    if (!pageNumber) {
      return NextResponse.json(
        { error: 'معامل page مطلوب' },
        { status: 400 }
      );
    }
    
    const pageNum = parseInt(pageNumber);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
      return NextResponse.json(
        { error: 'رقم الصفحة غير صحيح (يجب أن يكون بين 1 و 604)' },
        { status: 400 }
      );
    }
    
    // محاولة استخدام mushaf_id=5 أولاً (KFGQPC HAFS)
    // إذا لم يكن متوفراً، استخدم mushaf_id=6 (Indopak) كبديل
    let MUSHAF_ID = 5; // KFGQPC HAFS
    const fallbackMushafId = 6; // Indopak (متوفر في mini dump)
    
    // محاولة استخدام SQLite أولاً
    let page: QULMushafPage | null = null;
    let pageInfo: { first_verse_id: number | null; last_verse_id: number | null; verses_count: number } | null = null;
    let usedMushafId = MUSHAF_ID;
    
    if (databaseExists()) {
      // استخدام SQLite
      if (!initDatabase()) {
        console.warn('فشل في تهيئة قاعدة البيانات SQLite، جارٍ استخدام JSON...');
      } else {
        page = getPageData(MUSHAF_ID, pageNum);
        pageInfo = getPageInfo(MUSHAF_ID, pageNum);
        
        // إذا لم تكن البيانات متوفرة، جرب mushaf_id=6
        if (!page && MUSHAF_ID !== fallbackMushafId) {
          console.warn(`بيانات mushaf_id=${MUSHAF_ID} غير متوفرة، جارٍ استخدام mushaf_id=${fallbackMushafId}...`);
          page = getPageData(fallbackMushafId, pageNum);
          pageInfo = getPageInfo(fallbackMushafId, pageNum);
          usedMushafId = fallbackMushafId;
        }
      }
    }
    
    // Fallback إلى JSON إذا لم تكن SQLite متاحة
    if (!page) {
      // محاولة تحميل JSON للمصحف 5 أولاً
      let data = loadMushafDataFromJSON();
      
      // إذا لم يكن متوفراً، جرب المصحف 6
      if (!data || !data.pages[pageNumber]) {
        const fallbackPath = path.join(process.cwd(), 'app', 'data', `mushaf-layout-${fallbackMushafId}.json`);
        if (fs.existsSync(fallbackPath)) {
          console.warn(`بيانات mushaf_id=${MUSHAF_ID} غير متوفرة، جارٍ استخدام mushaf_id=${fallbackMushafId}...`);
          try {
            const fallbackContent = fs.readFileSync(fallbackPath, 'utf-8');
            data = JSON.parse(fallbackContent) as MushafData;
            usedMushafId = fallbackMushafId;
          } catch (error) {
            console.error('خطأ في تحميل بيانات المصحف البديل:', error);
          }
        }
      }
      
      if (!data) {
        return NextResponse.json(
          { error: 'فشل في تحميل بيانات المصحف. تأكد من وجود قاعدة بيانات SQLite أو ملف JSON.' },
          { status: 500 }
        );
      }
      
      const pageData = data.pages[pageNumber];
      if (!pageData) {
        return NextResponse.json(
          { error: `الصفحة ${pageNumber} غير موجودة في البيانات (mushaf_id=${usedMushafId})` },
          { status: 404 }
        );
      }
      
      // تحويل من JSON format إلى QUL format
      page = {
        page_number: pageData.page_number,
        lines: pageData.lines.map(line => ({
          line_number: line.line_number,
          words: line.words,
        })),
      };
    }
    
    if (!page) {
      return NextResponse.json(
        { error: `الصفحة ${pageNumber} غير موجودة في البيانات` },
        { status: 404 }
      );
    }
    
    // إرجاع البيانات
    const mushafNames: Record<number, string> = {
      5: 'KFGQPC HAFS',
      6: 'Indopak 15 lines',
    };
    
    return NextResponse.json({
      success: true,
      mushaf_id: usedMushafId,
      mushaf_name: mushafNames[usedMushafId] || `Mushaf ${usedMushafId}`,
      page: page,
      page_info: pageInfo,
      source: databaseExists() ? 'sqlite' : 'json',
      note: usedMushafId !== MUSHAF_ID ? `تم استخدام mushaf_id=${usedMushafId} كبديل` : undefined,
    });
    
  } catch (error) {
    console.error('خطأ في API route:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}

