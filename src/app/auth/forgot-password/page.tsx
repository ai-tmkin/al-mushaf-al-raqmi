"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, Loader2, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إرسال رابط إعادة التعيين");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#059669' }} />
          </div>
          <h1 className="text-2xl font-light mb-4" style={{ color: '#1c1917' }}>
            تم إرسال الرابط!
          </h1>
          <p className="mb-6" style={{ color: '#78716c' }}>
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
            <br />
            <span className="font-medium" dir="ltr">{email}</span>
          </p>
          <p className="text-sm mb-8" style={{ color: '#a8a29e' }}>
            تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
          >
            <ArrowRight className="w-5 h-5" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl mb-4" style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}>
              <span className="font-quran">مر</span>
            </div>
          </Link>
          <h1 className="text-2xl font-light mb-2" style={{ color: '#1c1917' }}>
            نسيت كلمة المرور؟
          </h1>
          <p className="text-sm" style={{ color: '#78716c' }}>
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl p-8 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e7e5e4' }}>
          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm block mb-2 font-medium" style={{ color: '#57534e' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 pr-11 rounded-xl transition-all"
                  style={{ border: '2px solid #e7e5e4', backgroundColor: '#fafaf9', color: '#1c1917' }}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a8a29e' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <span>إرسال رابط إعادة التعيين</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#78716c' }}>
            تذكرت كلمة المرور؟{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: '#059669' }}>
              تسجيل الدخول
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-sm transition-colors" style={{ color: '#78716c' }}>
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}

