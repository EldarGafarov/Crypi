import { connectToDatabase } from '../../../lib/mongodb'; // Adjust the import path accordingly

export default async function handler(req, res) {
  // Extract the dynamic route parameter
  const { coinSymbol } = req.query; // Use coinSymbol instead of coinsymbol

  try {
    // Validate the dynamic route parameter
    if (!coinSymbol) {
      return res.status(400).json({ error: 'Coin symbol is required' });
    }

    const { db } = await connectToDatabase();

    // Find the coin in the database by symbol
    const coin = await db.collection('coins').findOne({ symbol: coinSymbol.toUpperCase() });

    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    // Return the coin data
    res.status(200).json(coin);
  } catch (error) {
    console.error('Error fetching coin data:', error);
    res.status(500).json({ error: 'Failed to fetch coin data' });
  }
}
