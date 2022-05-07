import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Badge, HStack, Link, VStack, Text } from "@chakra-ui/react"

export type ResultStatus = 'revealed' | 'noReveal' | 'revert'

export const ResultComponent = (prop: {
    result: string,
    batter: string,
    score: number,
    status: ResultStatus,
}) => {

    const {result, batter, score, status} = prop
    if(status == 'noReveal') {
        return (<Text fontWeight='bold'>Play being commited</Text>)
    }

    if(status == 'revert') {
        return (<Text fontWeight='bold'>Transaction Failed</Text>)
    }

    let varient = 'outline'
    let colorScheme = 'blue'
    switch (result) {
        case 'SINGLE':
            varient = 'outline'
            colorScheme = 'blue'
            break;
        case 'DOUBLE':
            varient = 'subtle'
            colorScheme = 'yellow'
            break;
        case 'TRIPLE':
            varient = 'solid'
            colorScheme = 'orange'
            break;
        case 'HOMERUN':
            varient = 'solid'
            colorScheme = 'red'
            break;
        case 'OUT':
            varient = 'subtle'
            colorScheme = 'gray'
            break;
        default:
            break;
    }

    return (
        <VStack spacing={2}>
            <Badge variant={varient} colorScheme={colorScheme} fontSize='1.2em'>{result}</Badge>
            <HStack spacing={2}>
                <Text fontWeight='bold'>score</Text>
                <Badge variant='solid' colorScheme='blackAlpha'>{score}</Badge>
                <Text fontWeight='bold'>by</Text>
                <Link href={`https://mumbai.polygonscan.com/address/${batter}`} isExternal>
                    {batter.slice(0, 12)}... <ExternalLinkIcon mx='2px'/>
                </Link>
            </HStack>
        </VStack>
    )
}