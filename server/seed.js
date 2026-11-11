import User from './models/User.js';
import Template from './models/Template.js';

export async function bootstrapAdminUser() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
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
      isSuspended: false,
    });
    console.log(`Admin user successfully initialized with ID: ${adminUser.id}`);
  } catch (error) {
    console.error('Error bootstrapping admin user:', error.message);
  }
}

export async function autoSeedTemplates() {
  try {
    const count = await Template.countDocuments();
    if (count > 0) return;

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      await bootstrapAdminUser();
      admin = await User.findOne({ role: 'admin' });
    }

    const starterTemplates = [
      {
        title: 'Full Stack Web Development (MERN)',
        description: 'Complete roadmap covering MongoDB, Express, React, and Node.js with REST API fundamentals.',
        category: 'Web Development',
        createdBy: admin._id,
        isPublished: true,
        topics: [
          {
            title: 'React Fundamentals & Context API',
            importance: 3,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Official React Documentation', url: 'https://react.dev', type: 'doc' },
              { title: 'React Hooks Deep Dive', url: 'https://react.dev/reference/react', type: 'article' },
            ],
          },
          {
            title: 'Express.js Routing & Middleware',
            importance: 3,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Express Routing Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'doc' },
              { title: 'Writing Custom Express Middleware', url: 'https://expressjs.com/en/guide/writing-middleware.html', type: 'article' },
            ],
          },
          {
            title: 'MongoDB & Mongoose Schema Design',
            importance: 2,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Mongoose Schemas & Subdocuments', url: 'https://mongoosejs.com/docs/guide.html', type: 'doc' },
              { title: 'MongoDB Indexing Best Practices', url: 'https://www.mongodb.com/docs/manual/indexes/', type: 'article' },
            ],
          },
          {
            title: 'JWT Authentication & Security',
            importance: 3,
            revisionThresholdDays: 7,
            resources: [
              { title: 'JWT.io Introduction to JSON Web Tokens', url: 'https://jwt.io/introduction', type: 'article' },
              { title: 'OWASP Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org', type: 'doc' },
            ],
          },
        ],
      },
      {
        title: 'Data Structures & Algorithms',
        description: 'Core computer science fundamentals: Arrays, Linked Lists, Trees, Graphs and Dynamic Programming.',
        category: 'Computer Science',
        createdBy: admin._id,
        isPublished: true,
        topics: [
          {
            title: 'Arrays, Two Pointers & Sliding Window',
            importance: 3,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Sliding Window Pattern Explanations', url: 'https://leetcode.com', type: 'article' },
            ],
          },
          {
            title: 'Binary Trees & Traversals (DFS / BFS)',
            importance: 3,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Tree Traversal Guide', url: 'https://en.wikipedia.org/wiki/Tree_traversal', type: 'article' },
            ],
          },
          {
            title: 'Graph Algorithms (Dijkstra, BFS, DFS)',
            importance: 2,
            revisionThresholdDays: 14,
            resources: [
              { title: 'Graph Representations and Search', url: 'https://cp-algorithms.com', type: 'doc' },
            ],
          },
        ],
      },
    ];

    await Template.insertMany(starterTemplates);
    console.log('Seeded starter Pathlog curated roadmap templates.');
  } catch (error) {
    console.error('Error seeding templates:', error.message);
  }
}
