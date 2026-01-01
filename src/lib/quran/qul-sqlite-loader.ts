/**
 * QUL SQLite Data Loader
 * 
 * يحمل بيانات المصحف من قاعدة بيانات SQLite المستخرجة من QUL
 * يستخدم better-sqlite3 للوصول السريع للبيانات
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// هيكل البيانات
export interface QULMushafWord {
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

export interface QULMushafLine {
  line_number: number;
  words: QULMushafWord[];
}

export interface QULMushafPage {
  page_number: number;
  lines: QULMushafLine[];
}

// Cache للاتصال بقاعدة البيانات
let db: Database.Database | null = null;
let dbPath: string | null = null;

/**
 * تهيئة الاتصال بقاعدة البيانات
 * ملاحظة: يعمل فقط في بيئة Node.js (server-side)
 */
export function initDatabase(databasePath?: string): boolean {
  // التحقق من أننا في بيئة Node.js
  if (typeof window !== 'undefined') {
    console.warn('SQLite loader يعمل فقط في server-side');
    return false;
  }
  
  try {
    // استخدام المسار المحدد أو البحث عن قاعدة البيانات
    if (databasePath) {
      dbPath = databasePath;
    } else {
      // البحث عن قاعدة البيانات في عدة مواقع محتملة
      const possiblePaths = [
        path.join(process.cwd(), 'app', 'data', 'quran_dev.db'),
        path.join(process.cwd(), 'data', 'quran_dev.db'),
        path.join(process.cwd(), 'quran_dev.db'),
      ];
      
      dbPath = possiblePaths.find(p => fs.existsSync(p)) || null;
    }
    
    if (!dbPath || !fs.existsSync(dbPath)) {
      console.warn('قاعدة البيانات SQLite غير موجودة. يجب تحويل SQL إلى SQLite أولاً.');
      return false;
    }
    
    // فتح الاتصال
    db = new Database(dbPath, { readonly: true });
    
    // تحسين الأداء
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = memory');
    
    console.log(`✓ تم الاتصال بقاعدة البيانات: ${dbPath}`);
    return true;
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    return false;
  }
}

/**
 * إغلاق الاتصال بقاعدة البيانات
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * جلب بيانات صفحة من قاعدة البيانات
 * ملاحظة: يعمل فقط في server-side
 */
export function getPageData(mushafId: number, pageNumber: number): QULMushafPage | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  
  if (!db) {
    if (!initDatabase()) {
      return null;
    }
  }
  
  try {
    // جلب جميع الكلمات للصفحة
    const stmt = db.prepare(`
      SELECT 
        id, mushaf_id, word_id, verse_id, text, 
        char_type_id, char_type_name, line_number, page_number,
        position_in_verse, position_in_line, position_in_page,
        css_style, css_class
      FROM quran.mushaf_words
      WHERE mushaf_id = ? AND page_number = ?
      ORDER BY line_number, position_in_line
    `);
    
    const words = stmt.all(mushafId, pageNumber) as QULMushafWord[];
    
    if (words.length === 0) {
      return null;
    }
    
    // تجميع الكلمات حسب السطر
    const linesMap = new Map<number, QULMushafWord[]>();
    
    for (const word of words) {
      const lineNum = word.line_number;
      if (!linesMap.has(lineNum)) {
        linesMap.set(lineNum, []);
      }
      linesMap.get(lineNum)!.push(word);
    }
    
    // تحويل إلى array من الأسطر
    const lines: QULMushafLine[] = [];
    for (let i = 1; i <= 15; i++) {
      const lineWords = linesMap.get(i) || [];
      if (lineWords.length > 0) {
        lines.push({
          line_number: i,
          words: lineWords,
        });
      }
    }
    
    return {
      page_number: pageNumber,
      lines,
    };
  } catch (error) {
    console.error(`خطأ في جلب بيانات الصفحة ${pageNumber}:`, error);
    return null;
  }
}

/**
 * جلب معلومات الصفحة (الآيات الموجودة)
 * ملاحظة: يعمل فقط في server-side
 */
export function getPageInfo(mushafId: number, pageNumber: number): {
  first_verse_id: number | null;
  last_verse_id: number | null;
  verses_count: number;
} | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  
  if (!db) {
    if (!initDatabase()) {
      return null;
    }
  }
  
  try {
    const stmt = db.prepare(`
      SELECT 
        MIN(verse_id) as first_verse_id,
        MAX(verse_id) as last_verse_id,
        COUNT(DISTINCT verse_id) as verses_count
      FROM quran.mushaf_words
      WHERE mushaf_id = ? AND page_number = ?
    `);
    
    const result = stmt.get(mushafId, pageNumber) as {
      first_verse_id: number | null;
      last_verse_id: number | null;
      verses_count: number;
    };
    
    return result;
  } catch (error) {
    console.error(`خطأ في جلب معلومات الصفحة ${pageNumber}:`, error);
    return null;
  }
}

/**
 * التحقق من وجود قاعدة البيانات
 */
export function databaseExists(): boolean {
  if (dbPath) {
    return fs.existsSync(dbPath);
  }
  
  const possiblePaths = [
    path.join(process.cwd(), 'app', 'data', 'quran_dev.db'),
    path.join(process.cwd(), 'data', 'quran_dev.db'),
    path.join(process.cwd(), 'quran_dev.db'),
  ];
  
  return possiblePaths.some(p => fs.existsSync(p));
}

