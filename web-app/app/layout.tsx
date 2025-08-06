import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'

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
        <AuthProvider>
          <Header />
          
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
        </AuthProvider>
      </body>
    </html>
  )
}
