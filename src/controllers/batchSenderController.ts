import { Request, Response } from "express";
import { Connection, sendAndConfirmRawTransaction } from "@solana/web3.js";

// BatchSender function handles the incoming request and response
export const BatchSender = async (req: Request, res: Response) => {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ error: "Invalid transactions format" });
    }

    // Establish a connection to the Solana devnet
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=0cc3c358-18d9-4c27-88f6-b8026017023a", "confirmed");

    const TX_INTERVAL = 2000; // Interval between sending each batch (in milliseconds)

    // Function to execute the transactions
    async function executeTransactions(transactionList: string[]): Promise<PromiseSettledResult<string>[]> {
        let result: PromiseSettledResult<string>[] = [];
        let staggeredTransactions: Promise<string>[] = transactionList.map((tx, i, allTx) => {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
                    try {
                        const signature = await sendAndConfirmRawTransaction(connection, Buffer.from(tx, 'base64'));
                        resolve(signature);
                    } catch (error) {
                        reject(error);
                    }
                }, i * TX_INTERVAL); // Delay each transaction by the interval
            });
        });
        result = await Promise.allSettled(staggeredTransactions); // Wait for all transactions to settle
        return result; // Return the results of the transactions
    }

    try {
        // Initiate the sending of transactions
        console.log(`Initiating SOL drop`);
        const txResults = await executeTransactions(transactions);

        // Format the results and send them in the response
        const results = txResults.map((result, i) => ({
            status: result.status,
            transaction: i + 1,
            signature: result.status === 'fulfilled' ? result.value : undefined,
            reason: result.status === 'rejected' ? result.reason : undefined,
        }));

        return res.json(results); // Send the results as JSON response
    } catch (error) {
        console.error("Error during transaction execution:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
