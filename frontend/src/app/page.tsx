// frontend/src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to My Project 🚀
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          This is the starting point of a full-stack app. 
          Frontend is powered by <span className="font-semibold">Next.js + Tailwind</span>, 
          and it will connect to a backend service soon.
        </p>
        <button className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 transition">
          Get Started
        </button>
      </div>
    </main>
  );
}
