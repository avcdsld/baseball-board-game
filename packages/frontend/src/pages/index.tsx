import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'

import { Button, ButtonGroup, CircularProgress, Divider, Heading, HStack, Input, Link, VStack, } from '@chakra-ui/react'
import { CheckCircleIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
} from '@chakra-ui/react'

import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import abi from '../dapps/contracts/abi.json'

import { useAddress, useDisconnect, useMetamask, useSigner } from "@thirdweb-dev/react";
import { ethers } from 'ethers'
import { useProvider } from '@thirdweb-dev/react/node_modules/wagmi'
import { ResultComponent, ResultStatus } from './components/result'

const contractAddressMumbai = '0x2bC9E6A36a8B98B02Cc4C63E3863Bc7ac3d01429';

type GameBoard = {
  totalScore: string,
  bases: number,
  outs: string,
}

type ResultEvent = {
  batter: string,
  result: string,
  score: number,
  status: ResultStatus,
}

const Home: NextPage = () => {
  const connectWithMetamask = useMetamask();
  const disconnect = useDisconnect()
  const address = useAddress()
  const signer = useSigner()

  const [contract, setContract] = useState<ethers.Contract>()
  const [provider, setProvider] = useState<ethers.providers.Provider>()
  const [board, setBoard] = useState<GameBoard>()

  const [batterContract, setBatterContract] = useState<string>('')
  const [batterTokenId, setBatterTokenId] = useState<string>('')
  const [batterNftLink, setBatterNftLink] = useState<string>('')
  const [txid, setTxid] = useState<string>('')
  const [receipt, setReceipt] = useState<ethers.providers.TransactionReceipt>()
  const [result, setResult] = useState<ResultEvent>()

  //  fetch game board
  useEffect(() => {
    if(!signer){
      return
    }
    if(!signer.provider) {
      console.log('no provider detected')
      return
    }
    const p = signer.provider
    p.getNetwork().then(x => console.log('network', x.chainId))
    p.getBlockNumber().then(x => console.log('height', x.toString()))
    setProvider(p)
  },[signer])

  useEffect(() => {
    if(!signer) {
      setBoard(undefined)
      return
    }
    const contract = new ethers.Contract(contractAddressMumbai, abi, signer);
    const fetchCurrentGame = async () => {
      const totalScore = await contract.totalScore()
      const bases = await contract.bases()
      const outs = await contract.outs()
      console.log('score', totalScore)
      console.log('bases', bases)
      console.log('outs', outs)
      setContract(contract)
      setBoard({
        totalScore: totalScore.toString(),
        outs: outs,
        bases: bases.toString(),
      })
    }
    fetchCurrentGame()
  }, [signer, result])

  // fetch address data
  useEffect(() => {
    if(address){
      console.log('address:', address)
    }
  }, [address])

  useEffect(() => {
    signer?.getBalance().then(x => console.log('signer:', x?.toString()))
  }, [signer])

  useEffect(() => {
    if(ethers.utils.isAddress(batterContract) && !isNaN(parseInt(batterTokenId))) {
      console.log(batterContract, '/', batterTokenId)
      const openseaLink = `https://testnets.opensea.io/assets/mumbai/${batterContract}/${batterTokenId}`
      setBatterNftLink(openseaLink)
    }else{
      setBatterNftLink('')
    }
    
  }, [batterContract, batterTokenId])

  useEffect(() => {
    if(!signer || txid == '' || !provider) {
      return
    }
    const poll = async () => {
      for (let count = 0; count < 15; count++) {
        const tmpReceipt = await provider.getTransactionReceipt(txid)
        console.log(`receipt[${count}]:`, tmpReceipt)
        if(tmpReceipt) {
          setReceipt(tmpReceipt)
          return
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      console.log('finish polling')
    }
    poll()
  }, [txid])

  useEffect(() => {
    if(!receipt) {
      return
    }
    console.log('receipt:', receipt)

    if(receipt.status == 0) {
      setResult(failedEvent())
      console.log('transaction is failed')
      return
    }

    const item = receipt.logs.find(x => x.address == contractAddressMumbai)
    if(!item) {
      setResult(noRevealEvent())
      console.log('nothing is revealed')
      return
    }
    const data = Buffer.from(item.data.slice(2), 'hex')
    const result = bufferToResult(data)
    setResult(result)
    console.log(`data[${data.length}]:`, data)
    console.log('result:', result)
  }, [receipt])

  const trigger = (address: string, tokenId: number) => {
    if(!contract) {
      return
    }
    const inner = async () => {
      const result = await contract.trigger(address, tokenId)
      return result
    }
    inner().then(x => {
      setReceipt(undefined)
      setResult(undefined)
      setTxid(x.hash)
    })
  }
  const reveal = () => {
    if(!contract) {
      return
    }
    const inner = async () => {
      const result = await contract.reveal()
      return result
    }
    inner().then(x => {
      setReceipt(undefined)
      setResult(undefined)
      setTxid(x.hash)
    })
  }

  const onBatterContractAddressChange = (e: any) => {
    setBatterContract(e.target.value)
  }

  const onBatterTokenIdChange = (e: any) => {
    setBatterTokenId(e.target.value)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VStack margin={32}>
        <Heading>NFT Baseball</Heading>
        <StatGroup background={'#eeeeee'}>
          <Stat margin={10}>
            <StatLabel>Score</StatLabel>
            <StatNumber>{board?.totalScore ?? '-'}</StatNumber>
          </Stat>

          <Stat margin={10}>
            <StatLabel>Outs</StatLabel>
            <StatNumber>{board?.outs ?? '-'}</StatNumber>
          </Stat>

          <Stat margin={10}>
            <StatLabel>Runners</StatLabel>
            <StatNumber>{toBaseString(board?.bases ?? 0)}</StatNumber>
          </Stat>
        </StatGroup>
        <Button colorScheme='teal' onClick={() => !address ? connectWithMetamask() : disconnect()}>
          { !address ? "Connect Wallet" : "Disconnect"}
        </Button>
        {address ? (
          <Link href={`https://mumbai.polygonscan.com/address/${address}`} isExternal>
          {address} <ExternalLinkIcon mx='2px'/>
          </Link>
        ) : (<p>not connected</p>)}
        <Divider orientation='horizontal' />
        <VStack>
          <Input placeholder='Batter NFT Address' width={'auto'} onChange={onBatterContractAddressChange} disabled={!address}/>
          <Input placeholder='Batter NFT TokenId' width={'32md'} onChange={onBatterTokenIdChange} disabled={!address}/>
        </VStack>
        {batterNftLink != '' ? (<Link href={batterNftLink} isExternal>
          Open in Opensea <ExternalLinkIcon mx='2px'/>
          </Link>): (<div></div>)}
        <HStack margin={10}>
          <Button onClick={() => trigger(batterContract, parseInt(batterTokenId))} colorScheme='blue' variant='outline' disabled={batterNftLink == ''}>
            trigger
          </Button>
          <Button onClick={() => reveal()} colorScheme='blue' variant='outline' disabled={batterNftLink == ''}>
            reveal
          </Button>
        </HStack>
        <Divider orientation='horizontal' />
        {txid != '' ? 
          <VStack>
            <HStack>
              {result ? (<CheckCircleIcon w={8} h={8} color="green.300" />):(<CircularProgress isIndeterminate color='blue.300' />)}
              <Link href={`https://mumbai.polygonscan.com/tx/${txid}`} isExternal >
              {txid.slice(0, 16)}... <ExternalLinkIcon mx='2px'/>
              </Link>
            </HStack> : <div></div>
            {result ? (
              <ResultComponent result={result.result} batter={result.batter} score={result.score} status={result.status}/>
            ) : <div></div>}
          </VStack>
          : <div></div>
        }
        
        
        <div>

        </div>
      </VStack>
    </div>
  )
}

const toBaseString = (n: number): string => {
  let baseString = ''
  if ((n & 0x04) == 0x04) {
    baseString += '-'
  }else{
    baseString += ' '
  }

  if ((n & 0x02) == 0x02) {
    baseString += 'o\u0305'
  }else{
    baseString += 'o'
  }

  if ((n & 0x01) == 0x01) {
    baseString += '-'
  }else{
    baseString += ' '
  }

  return baseString
}

const bufferToResult = (buf: Buffer): ResultEvent => {
  const address = '0x' + buf.slice(12, 32).toString('hex')
  const score = buf.at(95) ?? 0
  const result = buf.slice(224).toString('ascii').replaceAll('\x00', '')
  return {
    batter: address,
    result: result,
    score: score,
    status: 'revealed',
  }
}
const noRevealEvent = (): ResultEvent => {
  return {
    batter: '',
    result: '',
    score: 0,
    status: 'noReveal',
  }
}
const failedEvent = (): ResultEvent => {
  return {
    batter: '',
    result: '',
    score: 0,
    status: 'revert',
  }
}

export default Home
