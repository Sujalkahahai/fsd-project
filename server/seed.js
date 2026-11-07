import Event from './models/Event.js';
import { seedEvents } from './data/events.js';

export async function autoSeedEvents() {
  try {
    const count = await Event.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} events; skipping seeding.`);
      return;
    }

    console.log('Event collection is empty. Seeding initial events into MongoDB Atlas...');
    const formattedSeeds = seedEvents.map(({ id: _oldId, ...rest }) => rest);
    const inserted = await Event.insertMany(formattedSeeds);
    console.log(`Successfully seeded ${inserted.length} events into MongoDB Atlas.`);
  } catch (error) {
    console.error('Error during auto-seeding:', error.message);
  }
}
