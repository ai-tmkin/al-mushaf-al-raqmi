/**
 * API Route: /api/quran/qf-pages
 * يستخدم Quran Foundation API للحصول على بيانات الصفحات
 * 
 * Query Parameters:
 * - page: رقم الصفحة (1-604)
 * - auth: استخدام OAuth2 (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPageWithLayout,
  TOTAL_PAGES,
  QFPageLayout,
} from '@/lib/quran/quran-foundation-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageNumber = searchParams.get('page');
    const useAuth = searchParams.get('auth') === 'true';

    // التحقق من رقم الصفحة
    if (!pageNumber) {
      return NextResponse.json(
        { error: 'رقم الصفحة مطلوب', success: false },
        { status: 400 }
      );
    }

    const pageNum = parseInt(pageNumber, 10);
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_PAGES) {
      return NextResponse.json(
        { error: `رقم الصفحة يجب أن يكون بين 1 و ${TOTAL_PAGES}`, success: false },
        { status: 400 }
      );
    }

    // جلب بيانات الصفحة
    const pageLayout: QFPageLayout = await fetchPageWithLayout(pageNum, useAuth);

    return NextResponse.json({
      success: true,
      source: 'quran-foundation-api',
      page: pageLayout,
      meta: {
        api_version: 'v4',
        authenticated: useAuth,
        note: 'بيانات من Quran Foundation API - قد تختلف بدايات الصفحات عن المصحف المطبوع',
      },
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات الصفحة:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
        success: false,
      },
      { status: 500 }
    );
  }
}


