import "./globals.css";

export const metadata = {
  title: "Job Watcher",
  description: "Track job titles across public careers websites."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}