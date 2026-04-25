import '../styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>FoodRescue DS-AI — Real-Time Food Rescue Platform</title>
        <meta name="description" content="AI-powered food rescue system connecting donors, receivers, and volunteers using smart logistics, predictive analytics, and real-time mapping." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
