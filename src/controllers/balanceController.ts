import { Request, Response } from "express";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

export const AllBalance = async (req: Request, res: Response) => {
    const address = req.params.address;
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=0cc3c358-18d9-4c27-88f6-b8026017023a", "confirmed");
    const metaplex = Metaplex.make(connection);
    const owner = new PublicKey(address);

    // Get all token accounts owned by the specified address
    let response = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
    let balance: any[] = [];

    for (let i = 0; i < response.value.length; i++) {
        const accountInfo = response.value[i].account.data["parsed"]["info"];
        const mint = accountInfo["mint"];
        const decimals = accountInfo["tokenAmount"]["decimals"];
        const rawAmount = accountInfo["tokenAmount"]["amount"];

        // Adjust the amount based on the number of decimals
        const amount = parseFloat(rawAmount) / Math.pow(10, decimals);

        if (amount > 0) {
            if (decimals > 0) {
                // Get the token name, symbol, description, and image
                const mintAddress = new PublicKey(mint);
                const metadataAccount = metaplex.nfts().pdas().metadata({ mint: mintAddress });
                const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

                if (metadataAccountInfo) {
                    const token = await metaplex.nfts().findByMint({ mintAddress });
                    const name = token.json?.name;
                    const symbol = token.json?.symbol;
                    const description = token.json?.description;
                    const tokenImage = token.json?.image;

                    balance.push({
                        name,
                        symbol,
                        description,
                        tokenImage,
                        amount,
                        decimals,
                    });
                }
            }
        }
    }

    res.json(balance);
};
