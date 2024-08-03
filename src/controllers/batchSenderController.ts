import { Request, Response } from "express";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

export const BatchSender = (req: Request, res: Response) => {
    const dropList = req.body.dropList;

    const secret = req.body.secret;

    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=0cc3c358-18d9-4c27-88f6-b8026017023a", "confirmed");


    const FROM_KEY_PAIR = Keypair.fromSecretKey(new Uint8Array(secret));
    const NUM_DROPS_PER_TX = 10;
    const TX_INTERVAL = 1000;

    function generateTransactions(batchSize: number, dropList, fromWallet: PublicKey): Transaction[] {
        let result: Transaction[] = [];

        let txInstructions: TransactionInstruction[] = []
        for (let i = 0; i < dropList.length; i++) {
            const tx = SystemProgram.transfer({
                fromPubkey: fromWallet,
                toPubkey: new PublicKey(dropList[i].walletAddress),
                lamports: dropList[i].numLamports
            });
            txInstructions.push(tx);
        }

        const numTransactions = Math.ceil(txInstructions.length / batchSize);
        
        
        for (let i = 0; i < numTransactions; i++) {
            let bulkTransaction = new Transaction();
            let lowerIndex = i * batchSize;
            let upperIndex = (i + 1) * batchSize;
            for (let j = lowerIndex; j < upperIndex; j++) {
                if (txInstructions[j]) bulkTransaction.add(txInstructions[j]);
            }
            result.push(bulkTransaction);
        }

        return result;
    }

    async function executeTransactions(solanaConnection: Connection, transactionList: Transaction[], payer: Keypair): Promise<PromiseSettledResult<string>[]> {
        let result: PromiseSettledResult<string>[] = [];
        let staggeredTransactions: Promise<string>[] = transactionList.map((transaction, i, allTx) => {
            return (new Promise((resolve) => {
                setTimeout(() => {
                    console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
                    solanaConnection.getLatestBlockhash()
                        .then(recentHash => transaction.recentBlockhash = recentHash.blockhash)
                        .then(() => sendAndConfirmTransaction(solanaConnection, transaction, [payer])).then(resolve);
                }, i * TX_INTERVAL);
            })
            )
        })
        result = await Promise.allSettled(staggeredTransactions);
        return result;
    }

    async function SendTransaction() {
        console.log(`Initiating SOL drop from ${FROM_KEY_PAIR.publicKey.toString()}`);
        const transactionList = generateTransactions(NUM_DROPS_PER_TX, dropList, FROM_KEY_PAIR.publicKey);
        const txResults = await executeTransactions(connection, transactionList, FROM_KEY_PAIR);
        console.log(await txResults);
        res.json({
            txResults: txResults
        })
    }

    SendTransaction();

}