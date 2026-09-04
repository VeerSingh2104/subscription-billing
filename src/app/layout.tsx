import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
// import Navigation from '@/app/components/navigation'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Subscription Billing',
  description: 'Subscription billing management system',
}

export default async function RootLayout({
  children,
}: LayoutProps<'/'>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var theme = localStorage.getItem('theme');
                var root = document.documentElement;

                if (theme === 'dark') {
                  root.classList.add('dark');
                } else if (theme === 'light') {
                  root.classList.remove('dark');
                } else if (
                  window.matchMedia('(prefers-color-scheme: dark)').matches
                ) {
                  root.classList.add('dark');
                }
              } catch (error) {
                // Ignore localStorage access errors.
              }
            })();
          `}
        </Script>
      </head>

      <body className="min-h-full flex flex-col">
        {/* {user && <Navigation />} */}

        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}