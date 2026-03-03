'use client';

export default function Home() {
  return (
    <main className="w-full h-screen bg-[#060a0f]">
      <iframe
        src="/globe.html"
        className="w-full h-full border-0"
        title="SENTINEL Global Conflict Monitor"
        allow="fullscreen"
      />
    </main>
  );
}
