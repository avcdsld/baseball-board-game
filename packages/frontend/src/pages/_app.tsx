import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider desiredChainId={ChainId.Mumbai}
      supportedChains={[ChainId.Mumbai]}
      chainRpc={{ [ChainId.Mumbai]: "https://rpc-mumbai.maticvigil.com/"}}
      >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp
