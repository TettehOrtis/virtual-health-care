import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* Load Tailwind CSS using next/script */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Component {...pageProps} />
    </AuthProvider>
  );
};