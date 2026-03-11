import '../styles/globals.css';

export const metadata = {
  title: 'Project Cecil (Membership)',
  description: 'Members Master List',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
