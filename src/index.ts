import express from 'express';

const app = express();

// Serve static files from the /app directory
app.use('/app', express.static('./src/app'));

// Readiness endpoint handler
const readinessHandler = (req: express.Request, res: express.Response) => {
    const responseBody = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    };
    
    res.status(200)
       .set('Content-Type', 'text/plain; charset=utf-8')
       .send(JSON.stringify(responseBody));
};

// Readiness endpoint
app.get('/healthz', readinessHandler);

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});