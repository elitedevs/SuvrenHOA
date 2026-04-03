export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-pulse">
      <div className="h-8 w-64 skeleton rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
      </div>
      <div className="h-32 skeleton rounded-xl mb-6" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
      </div>
    </div>
  );
}
