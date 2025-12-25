"use client";

import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import gsap from "gsap";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const router = useRouter();
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

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  }, [password]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("الاسم مطلوب");
    }

    if (!email.trim()) {
      errors.push("البريد الإلكتروني مطلوب");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("البريد الإلكتروني غير صحيح");
    }

    if (!password) {
      errors.push("كلمة المرور مطلوبة");
    } else if (password.length < 6) {
      errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }

    if (password !== confirmPassword) {
      errors.push("كلمات المرور غير متطابقة");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationErrors([]);

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            display_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Profile is automatically created by handle_new_user trigger function
      // The trigger function uses SECURITY DEFINER so it bypasses RLS
      // No need to create profile manually from client-side

      setSuccess(true);
    } catch (err: any) {
      setError(
        err.message === "User already registered"
          ? "هذا البريد الإلكتروني مسجل بالفعل"
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-sand-50 to-gold-50 p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-islamic-pattern opacity-5"></div>
        
        <div className="w-full max-w-md text-center relative z-10 auth-card">
          <div className="bg-white rounded-3xl border border-sand-200 p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mb-6 shadow-lg animate-float">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-light text-sand-900 mb-4">
              مرحباً بك في المصحف الرقمي! 🎉
            </h2>
            <p className="text-sand-600 mb-2">
              تم إنشاء حسابك بنجاح
            </p>
            <p className="text-sm text-sand-500 mb-6">
              تم إرسال رابط التأكيد إلى <span className="font-medium text-emerald-600">{email}</span>
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-right">
              <p className="text-sm text-emerald-800 mb-2">✓ تحقق من صندوق الوارد</p>
              <p className="text-sm text-emerald-800 mb-2">✓ انقر على رابط التأكيد</p>
              <p className="text-sm text-emerald-800">✓ ابدأ في تصميم آياتك</p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block px-8 py-3 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-sand-50 to-gold-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-5"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gold-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 auth-logo">
          <Link href="/" className="inline-block group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl mb-4 group-hover:scale-110 transition-transform">
              <span className="font-quran">مر</span>
            </div>
            <h1 className="text-3xl font-light text-sand-900 mb-2">
              المصحف الرقمي
            </h1>
            <p className="text-sm text-sand-500 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              صمم آياتك بأسلوبك
            </p>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sand-200 p-8 shadow-2xl auth-card">
          <h2 className="text-2xl font-light text-sand-900 mb-2 text-center">
            إنشاء حساب جديد
          </h2>
          <p className="text-sm text-sand-500 text-center mb-6">
            انضم إلى مجتمع المصحف الرقمي
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
              <ul className="space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-sand-600 block mb-2 font-medium">
                الاسم
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-sand-200 bg-sand-50 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-sand-300"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
              </div>
            </div>

            <div>
              <label className="text-sm text-sand-600 block mb-2 font-medium">
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
                  className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-sand-200 bg-sand-50 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-sand-300"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
              </div>
            </div>

            <div>
              <label className="text-sm text-sand-600 block mb-2 font-medium">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full px-4 py-3 pr-11 pl-11 rounded-xl border-2 border-sand-200 bg-sand-50 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-sand-300"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength <= 25
                            ? "bg-red-500"
                            : passwordStrength <= 50
                            ? "bg-amber-500"
                            : passwordStrength <= 75
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-sand-500">
                      {passwordStrength <= 25
                        ? "ضعيفة"
                        : passwordStrength <= 50
                        ? "متوسطة"
                        : passwordStrength <= 75
                        ? "جيدة"
                        : "قوية"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-sand-600 block mb-2 font-medium">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 pr-11 pl-11 rounded-xl border-2 border-sand-200 bg-sand-50 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-sand-300"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">كلمات المرور غير متطابقة</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword}
              className="w-full py-3.5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>إنشاء الحساب</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-sand-400">أو</span>
            </div>
          </div>

          {/* Social Login */}
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-3 bg-white border-2 border-sand-200 text-sand-700 rounded-xl font-medium hover:bg-sand-50 hover:border-emerald-300 transition-all disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
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
            <span>التسجيل بحساب Google</span>
          </button>

          {/* Terms */}
          <p className="text-xs text-[var(--sand-400)] text-center mt-6">
            بإنشاء حساب، أنت توافق على{" "}
            <Link href="/terms" className="text-[var(--emerald-600)] hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-[var(--emerald-600)] hover:underline">
              سياسة الخصوصية
            </Link>
          </p>

          {/* Login Link */}
          <p className="text-center text-sm text-[var(--sand-500)] mt-6">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/auth/login"
              className="text-[var(--emerald-600)] hover:text-[var(--emerald-700)] font-medium"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--sand-500)] hover:text-[var(--sand-700)]"
          >
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}

