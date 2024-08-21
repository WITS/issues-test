import { VercelToolbar } from '@vercel/toolbar/next';
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return <>
  <Component {...pageProps} />
  <VercelToolbar />
  </>
}

export default MyApp
