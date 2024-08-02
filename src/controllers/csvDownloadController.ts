import { Request, Response } from "express";
import path from "path";
import fs from "fs"

export const DownloadCsv = (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, filename);

    res.download(filePath, (err) => {
        if (err) {
            console.error("Error downloading file:", err);
        } else {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        }
    });
}