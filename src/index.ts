import express from 'express';


const app = express();
const port = 8080;

// Serve static files from the root directory
app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});