import Event from './models/Event.js';
import User from './models/User.js';
import { seedEvents } from './data/events.js';

export async function autoSeedEvents() {
  try {
    const count = await Event.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} events; skipping event seeding.`);
      return;
    }

    console.log('Event collection is empty. Seeding initial events into MongoDB Atlas...');
    const formattedSeeds = seedEvents.map(({ id: _oldId, ...rest }) => rest);
    const inserted = await Event.insertMany(formattedSeeds);
    console.log(`Successfully seeded ${inserted.length} events into MongoDB Atlas.`);
  } catch (error) {
    console.error('Error during event auto-seeding:', error.message);
  }
}

export async function bootstrapAdminUser() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log(`Admin user already exists (${adminExists.email}); skipping bootstrap.`);
      return;
    }

    const name = process.env.ADMIN_NAME || 'Pathlog Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@pathlog.internal').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'AdminPathlog2026!';

    console.log(`Bootstrapping initial admin account for ${email}...`);
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });
    console.log(`Admin user successfully initialized with ID: ${adminUser.id}`);
  } catch (error) {
    console.error('Error bootstrapping admin user:', error.message);
  }
}
