import { Request, Response } from "express";
import { Keypair } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import bs58 from "bs58";
import { parse } from "json2csv";
import path from "path";
import fs from "fs";

export const GenerateAdd = (req: Request, res: Response) => {
    const addCount: number = req.body.addCount;

    // Array to store the generated keypairs
    let keypairs: Array<{ publicKey: string, privateKey: string }> = [];

    // Generate the specified number of keypairs
    for (let i = 0; i < addCount; i++) {
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        const privateKey = bs58.encode(keypair.secretKey);

        keypairs.push({ publicKey, privateKey });
    }

    // Convert the keypairs to CSV and JSON formats
    const csv = parse(keypairs);
    const json = JSON.stringify(keypairs, null, 2);

    // Generate unique filenames for the CSV and JSON files
    const uniqueNameCsv = `keypairs-${uuidv4()}.csv`;
    const uniqueNameJson = `keypairs-${uuidv4()}.json`;

    // Define the file paths
    const filePathCsv = path.join(__dirname, uniqueNameCsv);
    const filePathJson = path.join(__dirname, uniqueNameJson);

    // Save the CSV and JSON data to the files
    fs.writeFileSync(filePathCsv, csv);
    fs.writeFileSync(filePathJson, json);

    // Respond with the relative file paths of the generated CSV and JSON files
    res.json({
        filePathCsv: uniqueNameCsv,
        filePathJson: uniqueNameJson,
    });
};
