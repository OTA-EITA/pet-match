import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import DevAuthPanel from '@/components/dev/DevAuthPanel'
import DevStatusPanel from '@/components/dev/DevStatusPanel'
import SkipToContent from '@/components/SkipToContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OnlyCats - 猫の里親マッチング＆猫好きSNS',
  description: '保護猫・ブリーダー猫との出会い、猫好きのためのコミュニティプラットフォーム',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#F6C7A6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-cream-100 antialiased`}>
        <AuthProvider>
          <SkipToContent />
          <Header />

          <main id="main-content" className="min-h-screen pt-16 sm:pt-20 pb-safe safe-area-padding" role="main">
            {children}
          </main>
          
          <footer className="bg-neutral-900 text-white py-6 sm:py-8" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center sm:hidden">
                <p className="text-sm text-neutral-400">
                  &copy; 2024 OnlyCats
                </p>
              </div>
              
              <div className="hidden sm:block">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-primary-300">OnlyCats</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      保護猫・ブリーダー猫との出会いと<br />
                      猫好きのためのコミュニティ
                    </p>
                  </div>
                  
                  <nav aria-label="サービスメニュー">
                    <h4 className="text-sm font-semibold mb-3 text-neutral-300">サービス</h4>
                    <ul className="space-y-2 text-sm text-neutral-400">
                      <li><a href="/cats" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">猫を探す</a></li>
                      <li><a href="/portal" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">猫図鑑</a></li>
                      <li><a href="/community" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">コミュニティ</a></li>
                    </ul>
                  </nav>

                  <nav aria-label="サポートメニュー">
                    <h4 className="text-sm font-semibold mb-3 text-neutral-300">サポート</h4>
                    <ul className="space-y-2 text-sm text-neutral-400">
                      <li><a href="/about" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">運営について</a></li>
                      <li><a href="/terms" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">利用規約</a></li>
                      <li><a href="/privacy" className="hover:text-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">プライバシー</a></li>
                    </ul>
                  </nav>
                </div>
                
                <div className="mt-6 pt-6 border-t border-neutral-800 text-center text-sm text-neutral-500">
                  &copy; 2024 OnlyCats. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <DevAuthPanel />
              <DevStatusPanel />
            </>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}
