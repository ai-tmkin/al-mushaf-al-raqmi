"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const supabase = createClient();

  // Check if user has a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setError("خطأ في الاتصال بقاعدة البيانات");
        setCheckingSession(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        setError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [supabase]);

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#059669"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setError("خطأ في الاتصال بقاعدة البيانات");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#059669' }} />
          <p style={{ color: '#78716c' }}>جاري التحقق...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#059669' }} />
          </div>
          <h1 className="text-2xl font-light mb-4" style={{ color: '#1c1917' }}>
            تم تحديث كلمة المرور!
          </h1>
          <p className="mb-6" style={{ color: '#78716c' }}>
            تم تغيير كلمة المرور بنجاح. سيتم توجيهك لصفحة تسجيل الدخول...
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
          >
            <ArrowRight className="w-5 h-5" />
            تسجيل الدخول الآن
          </Link>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fffbeb 100%)' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#fef2f2' }}>
            <AlertCircle className="w-10 h-10" style={{ color: '#dc2626' }} />
          </div>
          <h1 className="text-2xl font-light mb-4" style={{ color: '#1c1917' }}>
            رابط غير صالح
          </h1>
          <p className="mb-6" style={{ color: '#78716c' }}>
            {error || "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد."}
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
          >
            طلب رابط جديد
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
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-sm" style={{ color: '#78716c' }}>
            أدخل كلمة المرور الجديدة
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl p-6 md:p-8 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e7e5e4' }}>
          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-sm block mb-2 font-medium" style={{ color: '#57534e' }}>
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-11 pl-11 rounded-xl transition-all"
                  style={{ border: '2px solid #e7e5e4', backgroundColor: '#fafaf9', color: '#1c1917' }}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a8a29e' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#a8a29e' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: passwordStrength >= level ? strengthColors[passwordStrength - 1] : '#e7e5e4'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColors[passwordStrength - 1] || '#a8a29e' }}>
                    {password.length > 0 ? strengthLabels[passwordStrength - 1] || 'ضعيفة جداً' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm block mb-2 font-medium" style={{ color: '#57534e' }}>
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 pl-11 rounded-xl transition-all"
                  style={{ 
                    border: `2px solid ${confirmPassword && password !== confirmPassword ? '#fecaca' : '#e7e5e4'}`, 
                    backgroundColor: '#fafaf9', 
                    color: '#1c1917' 
                  }}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a8a29e' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#a8a29e' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                  كلمتا المرور غير متطابقتين
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
              className="w-full py-3.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <span>تحديث كلمة المرور</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <p className="text-center mt-6">
          <Link href="/auth/login" className="text-sm transition-colors" style={{ color: '#78716c' }}>
            ← العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

