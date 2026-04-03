export default function TreasuryLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-6 w-32 skeleton rounded mb-2" />
      <div className="h-10 w-64 skeleton rounded mb-8" />
      <div className="h-48 skeleton rounded-xl mb-6" />
      <div className="grid grid-cols-2 gap-5">
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
      </div>
    </div>
  );
}
