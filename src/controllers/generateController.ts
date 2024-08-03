import { Request, Response } from "express";
import { Keypair } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import bs58 from "bs58";
import json2csv from "json2csv";
import path from "path";
import fs from "fs";


export const GenerateAdd = (req: Request, res: Response) => {
    const addCount: number = req.body.addCount;

    let keypairs: any = [];

    for (let i = 0; i < addCount; i++) {
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        const privateKey = bs58.encode(keypair.secretKey);

        keypairs.push({ publicKey, privateKey });
    }


    const csv = json2csv.parse(keypairs);
    const json = JSON.stringify(keypairs);

    const uniqueNameCsv = `keypairs-${uuidv4()}.csv`;
    const uniqueNameJson = `keypairs-${uuidv4()}.json`;
    const filePathCsv = path.join(__dirname, uniqueNameCsv);
    const filePathJson = path.join(__dirname, uniqueNameJson)
    fs.writeFileSync(filePathCsv, csv);
    fs.writeFileSync(filePathJson, json);

    res.json({
        filePathCsv: `${uniqueNameCsv}`,
        filePathJson: `${uniqueNameJson}`
    });
}