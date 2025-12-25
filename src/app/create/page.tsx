import { Suspense } from "react";
import { CreateContent } from "./create-content";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

function CreatePageFallback() {
  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar />
      <main className="mr-[72px] w-[calc(100%-72px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sand-600">جاري التحميل...</p>
        </div>
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<CreatePageFallback />}>
      <CreateContent />
    </Suspense>
  );
}
