// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BaseballBoardGame
 */
contract BaseballBoardGame is ERC721, ERC721URIStorage, ERC721Burnable, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCounter;

    uint8 public bases;
    uint8 public outs;
    uint public totalScore;
    mapping(address => uint) public claimableCounts;
    PendingPlay private pendingPlay;

    struct PendingPlay {
        address batter;
        uint blockNumber;
        address contractAddress;
        uint256 tokenId;
    }

    event PlayResult(address batter, string result, uint score, uint8 bases, uint8 outs, uint totalScore);

    constructor() ERC721("AwardNFT", "AWARD") Ownable() ReentrancyGuard() {
        bases = 0;
        outs = 0;
        totalScore = 0;
    }

    function trigger(address contractAddress, uint256 tokenId) public nonReentrant returns (uint) {
        address batter = msg.sender;

        // TODO: Disallow triggeringmore than once.
        require(IERC721(contractAddress).ownerOf(tokenId) == batter, "Only the owner of specified NFT can trigger.");

        revealInner();
        pendingPlay = PendingPlay(batter, block.number, contractAddress, tokenId);
        return totalScore;
    }

    function reveal() public nonReentrant returns (uint) {
        revealInner();
        return totalScore;
    }

    function getPendingPlay() public view returns (PendingPlay memory) {
        return pendingPlay;
    }

    function revealInner() private {
        if (pendingPlay.batter == address(0x0)) {
            return;
        }
        uint hash = uint(blockhash(pendingPlay.blockNumber + 1));
        if (hash == 0) {
            // You can only access the hashes of the most recent 256 blocks, all other values will be zero.
            // If zero is returned, ignore the pendingPlay.
            return;
        }

        uint random = uint(keccak256(abi.encodePacked(hash, pendingPlay.batter, pendingPlay.contractAddress, pendingPlay.tokenId)));
        uint result = random % 5;
        if (result == 0) {
            onSingle();
        } else if (result == 1) {
            onDouble();
        } else if (result == 2) {
            onTriple();
        } else if (result == 3) {
            onHomerun();
        } else if (result == 4) {
            onOut();
        } else {
            revert("unknown batter result");
        }

        uint score = getBattingScore(); // score added by this play
        if (score > 0) {
            claimableCounts[pendingPlay.batter] += score;
            totalScore += score;
        }
        emit PlayResult(pendingPlay.batter, getResultStr(result), score, bases, outs, totalScore);
        pendingPlay = PendingPlay(address(0x0), 0, address(0x0), 0);
    }

    function getResultStr(uint result) private pure returns (string memory) {
        if (result == 0) {
            return "SINGLE";
        } else if (result == 1) {
            return "DOUBLE";
        } else if (result == 2) {
            return "TRIPLE";
        } else if (result == 3) {
            return "HOMERUN";
        } else if (result == 4) {
            return "OUT";
        } else {
            revert("unknown batter result");
        }
    }

    function onSingle() private {
        bases <<= 1;    // move runners
        bases += 0x01;  // add batter
    }

    function onDouble() private {
        bases <<= 2;
        bases += 0x02;
    }

    function onTriple() private {
        bases <<= 3;
        bases += 0x04;
    }

    function onHomerun() private {
        bases <<= 4;
        bases += 0x08;
    }

    function onOut() private {
        outs += 1;
        if (outs >= 3) {
            bases = 0; // clear all runners
        }
    }

    // calculate
    function getBattingScore() private returns (uint) {
        uint8 current = bases;
        uint8 homeInBit = current >> 3;
        uint8 score = 0;
        
        //  TODO: optimize
        uint8 i = 1;
        for (i = 1; i <= 8; i *= 2) {
            uint8 b = 8 / i;  // b is [8,4,2,1]
            uint8 bitScore = homeInBit / b;
            if (bitScore > 0) {
                score += bitScore;
                homeInBit = homeInBit - b;
            }
        }

        // clear homein-ed runners
        bases = bases & 7; // bases = bases & 0b0000111
        return score;
    }

    // --- AWARD NFT ---

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.fleek.co/ipfs/bafybeih6prpmffzc527mqhzm2gp45ejvjf5jnbduupf34bo6ve2xogt5qi?";
    }

    function claimNFT(address to, uint8 maxCount) public {
        require(claimableCounts[to] > 0, "No claimable NFTs.");
        uint count = claimableCounts[to];
        for (uint8 i = 0; i < count && i < maxCount; i++) {
            mint(to);
        }
        claimableCounts[to] -= maxCount;
    }

    function mintByOwner(address to) public onlyOwner {
        mint(to);
    }

    function mint(address to) private {
        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();
        _safeMint(to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
