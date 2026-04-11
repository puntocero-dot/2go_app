export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
