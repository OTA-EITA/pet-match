import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PetMatch - ペット里親マッチング',
  description: 'ペットと里親をマッチングするプラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary">PetMatch</h1>
                <span className="ml-2 text-sm text-gray-500">里親マッチング</span>
              </div>
              <nav className="flex space-x-4">
                <a href="/" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  ペット一覧
                </a>
                <a href="/about" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  サービス紹介
                </a>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p>&copy; 2024 PetMatch. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
