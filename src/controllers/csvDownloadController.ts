import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export const DownloadCsv = (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, filename);

    // Attempt to download the file
    res.download(filePath, (err) => {
        if (err) {
            // Log the error if the file download fails and send a 500 response
            console.error("Error downloading file:", err);
            res.status(500).send("Error downloading file");
        } else {
            // After a successful download, delete the file
            fs.unlink(filePath, (err) => {
                if (err) {
                    // Log the error if file deletion fails
                    console.error("Error deleting file:", err);
                } 
            });
        }
    });
};
