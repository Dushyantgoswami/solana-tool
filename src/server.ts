import express from "express"
import cors from "cors";
import serviceRouter from "./routes/serviceRoutes"

const PORT = 3000;
const app = express();
app.use(express.json());
app.use(cors());


app.use("/api", serviceRouter, () => { })

app.listen(PORT, ()=>{
    console.log(`Server is running: http://localhost:${PORT}`);
    
}); 