import Uploader from '@/components/Uploader';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4 pt-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            Autoemailer
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Upload your clients list and templates to instantly generate up to 2,000 personalized emails.
          </p>
        </header>

        <Uploader />
      </div>
    </main>
  );
}
