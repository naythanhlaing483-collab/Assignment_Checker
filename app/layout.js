import './globals.css';

export const metadata = {
  title: 'Student Feedback Portal - EOM & POM Assignments',
  description: 'Assignment feedback portal migrated into a Next.js app shell without changing database behavior.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
