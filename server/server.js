import app from './app.js';
import connectDB from './config/db.js';
import { autoSeedEvents } from './seed.js';

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await autoSeedEvents();
    app.listen(port, () => {
      console.log(`Pathlog API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
}

startServer();
