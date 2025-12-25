"use client";

import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn, UserPlus, Sparkles, AlertCircle } from "lucide-react";
import gsap from "gsap";

export const dynamic = "force-dynamic";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const supabase = createClient();

  // GSAP animations
  useEffect(() => {
    gsap.from(".auth-card", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "power3.out",
    });
    gsap.from(".auth-logo", {
      duration: 0.6,
      scale: 0.8,
      opacity: 0,
      ease: "back.out(1.7)",
      delay: 0.2,
    });
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(
        err.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23065f46' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full filter blur-3xl opacity-30" style={{ backgroundColor: '#a7f3d0' }}></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full filter blur-3xl opacity-30" style={{ backgroundColor: '#fde68a', animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 auth-logo">
          <Link href="/" className="inline-block group">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl mb-4 group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}>
              <span className="font-quran">✓</span>
            </div>
            <h1 className="text-3xl font-light mb-2" style={{ color: '#1c1917' }}>
              المصحف الرقمي
            </h1>
            <p className="text-sm flex items-center justify-center gap-2" style={{ color: '#78716c' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#059669' }} />
              شارك آيات القرآن
            </p>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl p-8 shadow-2xl auth-card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid #e7e5e4' }}>
          <h2 className="text-2xl font-light mb-2 text-center" style={{ color: '#1c1917' }}>
            مرحباً بعودتك
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: '#78716c' }}>
            سجل الدخول للمتابعة
          </p>

          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
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
                  style={{ 
                    border: '2px solid #e7e5e4', 
                    backgroundColor: '#fafaf9',
                    color: '#1c1917'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e7e5e4';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a8a29e' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: '#57534e' }}>
                  كلمة المرور
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: '#059669' }}
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 pr-11 pl-11 rounded-xl transition-all"
                  style={{ 
                    border: '2px solid #e7e5e4', 
                    backgroundColor: '#fafaf9',
                    color: '#1c1917'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e7e5e4';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a8a29e' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#a8a29e' }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#059669' }}
              />
              <label htmlFor="remember" className="mr-2 text-sm" style={{ color: '#57534e' }}>
                تذكرني
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid #e7e5e4' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#a8a29e' }}>أو</span>
            </div>
          </div>

          {/* Social & Guest Login */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#ffffff', border: '2px solid #e7e5e4', color: '#44403c' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>تسجيل الدخول بحساب Google</span>
            </button>

            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#f5f5f4', border: '2px solid #e7e5e4', color: '#44403c' }}
            >
              <UserPlus className="w-5 h-5" />
              <span>الدخول كزائر</span>
            </button>
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm mt-6" style={{ color: '#78716c' }}>
            ليس لديك حساب؟{" "}
            <Link
              href="/auth/signup"
              className="font-medium hover:underline"
              style={{ color: '#059669' }}
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: '#78716c' }}
          >
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sand-50">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

