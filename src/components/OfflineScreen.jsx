export default function OfflineScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-futura">📡 No Connection</h1>
      <p className="mt-2">Olivia is offline. Please check your internet and try again.</p>
    </div>
  );
}