import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { ChakraProvider } from '@chakra-ui/react'
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <ThirdwebProvider
        desiredChainId={ChainId.Mumbai}
        supportedChains={[ChainId.Mumbai]}>
        <Component {...pageProps} />
      </ThirdwebProvider>
    </ChakraProvider>
    
  );
}

export default MyApp
