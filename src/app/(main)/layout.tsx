import Sidebar from "@/components/layout/Sidebar";
import RightWidgetPanel from "@/components/layout/RightWidgetPanel";
import BottomNav from "@/components/layout/BottomNav";
import BackendErrorBanner from "@/components/auth/BackendErrorBanner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-gray-900">
      <BackendErrorBanner />
      {/* Главный центрированный контейнер соцсети */}
      <div className="max-w-7xl mx-auto flex justify-center min-h-screen">
        {/* Левая колонка — Меню (как в ВК) */}
        <Sidebar />

        {/* Центральная колонка — Контент */}
        <main className="flex-1 max-w-2xl min-h-screen border-x border-gray-200/80 bg-white pb-20 md:pb-8">
          {children}
        </main>

        {/* Правая колонка — Виджеты ОСИ, сборы, опросы, контакты */}
        <RightWidgetPanel />
      </div>

      {/* Мобильный таббар (только на экранах меньше md) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
