export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-sand-50 p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-emerald-700">
          اختبار الأنماط - Test Styles
        </h1>

        <div className="space-y-4">
          <div className="p-6 bg-white rounded-2xl border border-sand-200 shadow-lg">
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              1. Tailwind Colors Test
            </h2>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-emerald-500 rounded-xl"></div>
              <div className="w-20 h-20 bg-gold-500 rounded-xl"></div>
              <div className="w-20 h-20 bg-sand-500 rounded-xl"></div>
            </div>
          </div>

          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
            <h2 className="text-2xl font-bold text-emerald-700 mb-4">
              2. Custom Classes Test
            </h2>
            <p className="text-gradient text-3xl font-bold mb-4">
              Text with Gradient
            </p>
            <div className="w-32 h-32 bg-white rounded-2xl glow-emerald flex items-center justify-center">
              <span className="text-emerald-700 font-bold">Glow Effect</span>
            </div>
          </div>

          <div className="p-6 glass-panel rounded-2xl">
            <h2 className="text-2xl font-bold text-sand-900 mb-4">
              3. Glass Morphism Test
            </h2>
            <p className="text-sand-700">
              This should have a glass effect with blur
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl">
            <h2 className="text-2xl font-bold text-sand-900 mb-4">
              4. Font Test
            </h2>
            <p className="font-heading text-xl mb-2">IBM Plex Sans Arabic</p>
            <p className="font-quran text-2xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          </div>

          <div className="p-6 bg-white rounded-2xl">
            <h2 className="text-2xl font-bold text-sand-900 mb-4">
              5. Animation Test
            </h2>
            <div className="w-32 h-32 bg-emerald-200 rounded-full animate-float"></div>
          </div>
        </div>

        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <h3 className="text-xl font-bold text-red-700 mb-2">
            ✅ If you see colors, gradients, and effects = Styles are working!
          </h3>
          <h3 className="text-xl font-bold text-red-700">
            ❌ If everything looks plain = There's a Tailwind issue
          </h3>
        </div>
      </div>
    </div>
  );
}

