import { Request, Response } from "express";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import base58 from "bs58";

// BatchSender function handles the incoming request and response
export const BatchSender = (req: Request, res: Response) => {
    const dropList = req.body.dropList; // List of recipients and amounts
    const secret = req.body.secret; // Sender's secret key in base58
    const solAmount = req.body.solAmount;
    // Establish a connection to the Solana devnet
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=0cc3c358-18d9-4c27-88f6-b8026017023a", "confirmed");

    // Generate Keypair from the secret key
    const Public_Wallet_Add = Keypair.fromSecretKey(base58.decode(secret));
    
    const Num_Tx_Per_Batch = 5; // Number of transactions per batch
    const TX_INTERVAL = 2000; // Interval between sending each batch (in milliseconds)
    const LAMPORTS_PER_SOL = 1000000000; // 1 SOL = 1,000,000,000 lamports
    const Amount = solAmount * LAMPORTS_PER_SOL;

    // Function to generate batched transactions
    function generateTransactions(batchSize: number, dropList, fromWallet: PublicKey): Transaction[] {
        let result: Transaction[] = []; // Array to store the transactions

        let txInstructions: TransactionInstruction[] = [] // Array to store transaction instructions
        for (let i = 0; i < dropList.length; i++) {
            const tx = SystemProgram.transfer({
                fromPubkey: fromWallet,
                toPubkey: new PublicKey(dropList[i].walletAddress),
                lamports: Amount
            });
            txInstructions.push(tx); // Add each transfer instruction to the array
        }

        // Calculate the number of transactions needed
        const numTransactions = Math.ceil(txInstructions.length / batchSize);

        // Create transactions and add instructions to them
        for (let i = 0; i < numTransactions; i++) {
            let bulkTransaction = new Transaction();
            let lowerIndex = i * batchSize;
            let upperIndex = (i + 1) * batchSize;
            for (let j = lowerIndex; j < upperIndex; j++) {
                if (txInstructions[j]) bulkTransaction.add(txInstructions[j]);
            }
            result.push(bulkTransaction); // Add the transaction to the result array
        }

        return result; // Return the list of transactions
    }

    // Function to execute the transactions
    async function executeTransactions(solanaConnection: Connection, transactionList: Transaction[], payer: Keypair): Promise<PromiseSettledResult<string>[]> {
        let result: PromiseSettledResult<string>[] = [];
        let staggeredTransactions: Promise<string>[] = transactionList.map((transaction, i, allTx) => {
            return (new Promise((resolve) => {
                setTimeout(() => {
                    console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
                    solanaConnection.getLatestBlockhash()
                        .then(recentHash => transaction.recentBlockhash = recentHash.blockhash)
                        .then(() => sendAndConfirmTransaction(solanaConnection, transaction, [payer])).then(resolve);
                }, i * TX_INTERVAL); // Delay each transaction by the interval
            })
            )
        })
        result = await Promise.allSettled(staggeredTransactions); // Wait for all transactions to settle
        console.log(result);

        return result; // Return the results of the transactions
    }

    // Function to initiate the sending of transactions
    async function SendTransaction() {
        console.log(`Initiating SOL drop from ${Public_Wallet_Add.publicKey.toString()}`);
        const transactionList = generateTransactions(Num_Tx_Per_Batch, dropList, Public_Wallet_Add.publicKey);
        const txResults = await executeTransactions(connection, transactionList, Public_Wallet_Add);

        // Format the results and send them in the response
        const results = txResults.map((result, i) => ({
            status: result.status,
            transaction: i + 1,
            signature: result.status === 'fulfilled' ? result.value : undefined,
            reason: result.status === 'rejected' ? result.reason : undefined,
        }));

        res.json(results); // Send the results as JSON response
    }

    SendTransaction(); // Immediately call the SendTransaction function
}
