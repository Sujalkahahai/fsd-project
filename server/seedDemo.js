/**
 * Pathlog Realistic Demo Dataset Seeder
 * 
 * Populates a realistic Computer Science student's learning profile:
 * - 3 Subjects (DSA, DBMS, Full Stack Web Dev)
 * - 12 Topics with mixed states (Strong, Moderate, Limited, Needs attention)
 * - Practice logs with real accuracy calculations
 * - Closed-book Assessments with genuine scores
 * - Revision Queue demonstrating 14-day and 7-day weak-evidence overrides
 * - Confidence mismatches ("Worth a second look")
 * - Next Actions spanning all 4 priority tiers
 * - 1 Collaborative Study Room
 * 
 * Idempotent: Can be run multiple times safely without duplicating records.
 */

import connectDB from './config/db.js';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Topic from './models/Topic.js';
import Resource from './models/Resource.js';
import PracticeLog from './models/PracticeLog.js';
import Assessment from './models/Assessment.js';
import StudyRoom from './models/StudyRoom.js';
import { autoSeedTemplates, bootstrapAdminUser } from './seed.js';

// Helper to calculate date offsets relative to today
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export async function seedDemoData() {
  console.log('--- Seeding Pathlog Realistic Demo Dataset ---');

  // 1. Ensure database connected and admin bootstrap & templates exist
  await connectDB();
  await bootstrapAdminUser();
  await autoSeedTemplates();

  const admin = await User.findOne({ role: 'admin' });

  // 2. Demo Student Account
  const studentEmail = 'student@pathlog.internal';
  const studentPassword = 'StudentPathlog2026!';
  let student = await User.findOne({ email: studentEmail });

  if (!student) {
    console.log(`Creating demo student account (${studentEmail})...`);
    student = await User.create({
      name: 'Rohan Sharma',
      email: studentEmail,
      password: studentPassword,
      role: 'user',
      isSuspended: false,
    });
    console.log(`Demo student created with ID: ${student.id}`);
  } else {
    console.log(`Demo student already exists (${studentEmail}). Refreshing learning records...`);
    // Clean previous records for this demo student only (idempotent re-seed)
    await Subject.deleteMany({ userId: student._id });
    await Topic.deleteMany({ userId: student._id });
    await Resource.deleteMany({ userId: student._id });
    await PracticeLog.deleteMany({ userId: student._id });
    await Assessment.deleteMany({ userId: student._id });
  }

  // 3. Subject 1: Data Structures & Algorithms
  console.log('Seeding Subject 1: Data Structures & Algorithms...');
  const dsaSubject = await Subject.create({
    userId: student._id,
    title: 'Data Structures & Algorithms',
    why: 'Master core algorithmic problem-solving for technical interviews and competitive programming',
    targetDate: daysFromNow(21), // Upcoming in 21 days
  });

  // Topic 1.1: Arrays & Two Pointers (Strong Evidence, Up to Date)
  const dsaT1 = await Topic.create({
    subjectId: dsaSubject._id,
    userId: student._id,
    title: 'Arrays, Two Pointers & Sliding Window',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 4,
    lastActivityAt: daysAgo(5),
  });
  await Resource.insertMany([
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, title: 'Two Pointers Technique Guide - LeetCode', url: 'https://leetcode.com/explore', type: 'article', done: true },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, title: 'Sliding Window In-Depth Video Lecture', url: 'https://youtube.com', type: 'video', done: true },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, title: 'Array Patterns Summary Sheet', url: 'https://github.com', type: 'doc', done: true },
  ]);
  // 6 practice logs (5 correct, 1 wrong = 83% accuracy)
  await PracticeLog.insertMany([
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'easy', notes: 'Solved 2-Sum in O(N) hash map', createdAt: daysAgo(12) },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Container With Most Water two pointer', createdAt: daysAgo(10) },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Trapping Rain Water boundary condition edge case', createdAt: daysAgo(8) },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Minimum Window Substring solved with sliding window', createdAt: daysAgo(7) },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'easy', notes: 'Remove Duplicates from Sorted Array', createdAt: daysAgo(6) },
    { topicId: dsaT1._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Longest Substring Without Repeating Characters', createdAt: daysAgo(5) },
  ]);
  await Assessment.create({
    topicId: dsaT1._id,
    subjectId: dsaSubject._id,
    userId: student._id,
    title: 'DSA Midterm Quiz 1: Arrays',
    score: 88,
    maxMarks: 100,
    noNotesUsed: true,
    date: daysAgo(5),
  });

  // Topic 1.2: Binary Search Trees & Traversal (Needs Attention, Confidence Mismatch: 5/5, Due Immediately)
  const dsaT2 = await Topic.create({
    subjectId: dsaSubject._id,
    userId: student._id,
    title: 'Binary Search Trees & Traversal',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 5, // High confidence, but zero practice -> Confidence mismatch!
    lastActivityAt: null, // Due immediately
  });
  await Resource.insertMany([
    { topicId: dsaT2._id, subjectId: dsaSubject._id, userId: student._id, title: 'Tree Traversals Explained: BFS vs DFS', url: 'https://geeksforgeeks.org', type: 'article', done: true },
    { topicId: dsaT2._id, subjectId: dsaSubject._id, userId: student._id, title: 'In-order, Pre-order and Post-order Code Walkthrough', url: 'https://youtube.com', type: 'video', done: true },
    { topicId: dsaT2._id, subjectId: dsaSubject._id, userId: student._id, title: 'AVL Trees & Self-Balancing BSTs Notes', url: '', type: 'doc', done: false },
  ]);

  // Topic 1.3: Dynamic Programming (Knapsack & Subsequences) (Needs Attention, Overdue Revision)
  const dsaT3 = await Topic.create({
    subjectId: dsaSubject._id,
    userId: student._id,
    title: 'Dynamic Programming: Knapsack & Subsequences',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 2,
    lastActivityAt: daysAgo(8), // Overdue because weak evidence shortens threshold to 7 days!
  });
  await Resource.insertMany([
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, title: 'MIT 6.006 Lecture: Dynamic Programming I', url: 'https://ocw.mit.edu', type: 'video', done: true },
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, title: '0/1 Knapsack Problem Tutorial', url: 'https://cp-algorithms.com', type: 'article', done: true },
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, title: 'Longest Common Subsequence State Machine', url: '', type: 'doc', done: true },
  ]);
  // 4 logs, only 1 correct (25% accuracy) -> Needs Attention
  await PracticeLog.insertMany([
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Failed memoization table initialization', createdAt: daysAgo(11) },
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, correct: false, difficulty: 'medium', notes: 'Coin Change: off-by-one error on unbounded knapsack', createdAt: daysAgo(10) },
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Climbing stairs (Fibonacci DP) solved', createdAt: daysAgo(9) },
    { topicId: dsaT3._id, subjectId: dsaSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Partition Equal Subset Sum failed state recurrence', createdAt: daysAgo(8) },
  ]);

  // Topic 1.4: Graph Theory (BFS, DFS & Dijkstra) (Moderate Evidence, Up to Date)
  const dsaT4 = await Topic.create({
    subjectId: dsaSubject._id,
    userId: student._id,
    title: 'Graph Theory: BFS, DFS & Shortest Paths',
    importance: 2,
    revisionThresholdDays: 14,
    confidence: 3,
    lastActivityAt: daysAgo(2),
  });
  await Resource.insertMany([
    { topicId: dsaT4._id, subjectId: dsaSubject._id, userId: student._id, title: 'Graph Representations (Adjacency List vs Matrix)', url: 'https://cp-algorithms.com', type: 'article', done: true },
    { topicId: dsaT4._id, subjectId: dsaSubject._id, userId: student._id, title: 'Dijkstra Shortest Path Algorithm Visualization', url: 'https://visualgo.net', type: 'course', done: false },
  ]);
  await PracticeLog.insertMany([
    { topicId: dsaT4._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Number of Islands: BFS on 2D grid', createdAt: daysAgo(4) },
    { topicId: dsaT4._id, subjectId: dsaSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Network Delay Time: Priority Queue syntax error', createdAt: daysAgo(3) },
    { topicId: dsaT4._id, subjectId: dsaSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Course Schedule (Topological Sort / Kahn Algo)', createdAt: daysAgo(2) },
  ]);

  // 4. Subject 2: Database Management Systems
  console.log('Seeding Subject 2: Database Management Systems...');
  const dbmsSubject = await Subject.create({
    userId: student._id,
    title: 'Database Management Systems',
    why: 'Master relational algebra, SQL optimization, and transaction ACID properties for semester lab viva',
    targetDate: daysFromNow(45),
  });

  // Topic 2.1: Relational Model & SQL (Strong Evidence, Overdue Revision by 4 days)
  const dbT1 = await Topic.create({
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'Relational Model & Complex SQL Queries',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 4,
    lastActivityAt: daysAgo(18), // Practiced 18 days ago > 14 days threshold -> OVERDUE!
  });
  await Resource.insertMany([
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, title: 'PostgreSQL Window Functions Tutorial', url: 'https://postgresql.org/docs', type: 'doc', done: true },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Complex JOINs, Subqueries and CTEs', url: 'https://mode.com/sql-tutorial', type: 'article', done: true },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Query Execution Plan Analysis (EXPLAIN ANALYZE)', url: '', type: 'article', done: true },
  ]);
  await PracticeLog.insertMany([
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'easy', notes: 'Basic GROUP BY and HAVING clauses', createdAt: daysAgo(24) },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Correlated subquery in WHERE clause', createdAt: daysAgo(22) },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Recursive CTE for hierarchical employee data', createdAt: daysAgo(20) },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Self join on interval date range', createdAt: daysAgo(19) },
    { topicId: dbT1._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'hard', notes: 'DENSE_RANK() partition by department', createdAt: daysAgo(18) },
  ]);
  await Assessment.create({
    topicId: dbT1._id,
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'DBMS Lab Test 1: SQL Mastery',
    score: 82,
    maxMarks: 100,
    noNotesUsed: true,
    date: daysAgo(18),
  });

  // Topic 2.2: Normalization (1NF to BCNF) (Limited Evidence, Overdue)
  const dbT2 = await Topic.create({
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
    importance: 2,
    revisionThresholdDays: 14,
    confidence: 3,
    lastActivityAt: daysAgo(10), // Threshold 7 days due to Limited evidence -> Overdue!
  });
  await Resource.insertMany([
    { topicId: dbT2._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Functional Dependencies and Armstrong Axioms', url: 'https://stanford.edu', type: 'doc', done: true },
    { topicId: dbT2._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Decomposition and Lossless Join Property', url: '', type: 'article', done: true },
  ]);
  await PracticeLog.create({
    topicId: dbT2._id,
    subjectId: dbmsSubject._id,
    userId: student._id,
    correct: true,
    difficulty: 'medium',
    notes: 'Identified candidate keys and verified 3NF vs BCNF',
    createdAt: daysAgo(10),
  });

  // Topic 2.3: Transactions & ACID (Strong Evidence, Confidence Mismatch: 1/5, Up to Date)
  const dbT3 = await Topic.create({
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'Transactions, ACID Properties & Concurrency Control',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 1, // Low confidence despite scoring 92% -> Confidence mismatch!
    lastActivityAt: daysAgo(3),
  });
  await Resource.insertMany([
    { topicId: dbT3._id, subjectId: dbmsSubject._id, userId: student._id, title: 'ACID vs BASE in Modern Databases', url: 'https://martin.kleppmann.com', type: 'article', done: true },
    { topicId: dbT3._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Two-Phase Locking (2PL) and Deadlock Prevention', url: '', type: 'doc', done: false },
  ]);
  await PracticeLog.insertMany([
    { topicId: dbT3._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Serializability check using precedence graph', createdAt: daysAgo(4) },
    { topicId: dbT3._id, subjectId: dbmsSubject._id, userId: student._id, correct: true, difficulty: 'hard', notes: 'Deadlock detection using Wait-For Graph', createdAt: daysAgo(3) },
  ]);
  await Assessment.create({
    topicId: dbT3._id,
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'Transactions & Locking Quiz',
    score: 92,
    maxMarks: 100,
    noNotesUsed: true,
    date: daysAgo(3),
  });

  // Topic 2.4: Indexing & B-Trees (Needs Attention, Practice Needed)
  const dbT4 = await Topic.create({
    subjectId: dbmsSubject._id,
    userId: student._id,
    title: 'Indexing & B-Tree Storage Engines',
    importance: 1,
    revisionThresholdDays: 14,
    confidence: 3,
    lastActivityAt: null,
  });
  await Resource.insertMany([
    { topicId: dbT4._id, subjectId: dbmsSubject._id, userId: student._id, title: 'B-Tree vs B+ Tree in Database Engines', url: 'https://wikipedia.org/wiki/B%2B_tree', type: 'article', done: true },
    { topicId: dbT4._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Clustered vs Non-Clustered Indexes', url: '', type: 'article', done: true },
    { topicId: dbT4._id, subjectId: dbmsSubject._id, userId: student._id, title: 'Database Internals Chapter 4 Notes', url: '', type: 'doc', done: false },
  ]);

  // 5. Subject 3: Web Development (Full Stack)
  console.log('Seeding Subject 3: Web Development (Full Stack)...');
  const webSubject = await Subject.create({
    userId: student._id,
    title: 'Web Development (Full Stack MERN)',
    why: 'Build scalable full-stack MERN capstone projects and prepare for internship technical rounds',
    targetDate: daysAgo(10), // Past milestone date
  });

  // Topic 3.1: React State Management & Hooks (Strong Evidence, Up to Date)
  const webT1 = await Topic.create({
    subjectId: webSubject._id,
    userId: student._id,
    title: 'React State Management & Custom Hooks',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 4,
    lastActivityAt: daysAgo(4),
  });
  await Resource.insertMany([
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, title: 'React Docs: Thinking in React', url: 'https://react.dev', type: 'doc', done: true },
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, title: 'useReducer + Context API Pattern', url: 'https://react.dev/reference/react/useReducer', type: 'article', done: true },
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, title: 'Building Reusable Custom React Hooks', url: '', type: 'video', done: true },
  ]);
  await PracticeLog.insertMany([
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'easy', notes: 'Controlled form inputs with useState', createdAt: daysAgo(8) },
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Optimistic UI update using useEffect cleanup', createdAt: daysAgo(6) },
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Infinite re-render due to missing useCallback dependency', createdAt: daysAgo(5) },
    { topicId: webT1._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Global modal management via Context API', createdAt: daysAgo(4) },
  ]);
  await Assessment.create({
    topicId: webT1._id,
    subjectId: webSubject._id,
    userId: student._id,
    title: 'React Frontend Lab Evaluation',
    score: 86,
    maxMarks: 100,
    noNotesUsed: true,
    date: daysAgo(4),
  });

  // Topic 3.2: Express.js REST API Architecture (Moderate Evidence, Up to Date)
  const webT2 = await Topic.create({
    subjectId: webSubject._id,
    userId: student._id,
    title: 'Express.js REST API Architecture',
    importance: 2,
    revisionThresholdDays: 14,
    confidence: 3,
    lastActivityAt: daysAgo(5),
  });
  await Resource.insertMany([
    { topicId: webT2._id, subjectId: webSubject._id, userId: student._id, title: 'RESTful API Guidelines (HTTP Verbs & Status Codes)', url: 'https://restfulapi.net', type: 'article', done: true },
    { topicId: webT2._id, subjectId: webSubject._id, userId: student._id, title: 'Writing Asynchronous Error-Handling Middleware in Express', url: '', type: 'doc', done: true },
  ]);
  await PracticeLog.insertMany([
    { topicId: webT2._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'easy', notes: 'CRUD router scaffolding with JSON parsing', createdAt: daysAgo(9) },
    { topicId: webT2._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Pagination and sort query params implementation', createdAt: daysAgo(5) },
  ]);
  await Assessment.create({
    topicId: webT2._id,
    subjectId: webSubject._id,
    userId: student._id,
    title: 'Backend API Design Test',
    score: 68,
    maxMarks: 100,
    noNotesUsed: true,
    date: daysAgo(5),
  });

  // Topic 3.3: JWT Authentication & Web Security (Limited Evidence, Overdue)
  const webT3 = await Topic.create({
    subjectId: webSubject._id,
    userId: student._id,
    title: 'JWT Authentication & Web Security',
    importance: 3,
    revisionThresholdDays: 14,
    confidence: 4,
    lastActivityAt: daysAgo(9), // Limited evidence -> 7-day threshold -> Overdue!
  });
  await Resource.insertMany([
    { topicId: webT3._id, subjectId: webSubject._id, userId: student._id, title: 'Introduction to JSON Web Tokens (jwt.io)', url: 'https://jwt.io/introduction', type: 'doc', done: true },
    { topicId: webT3._id, subjectId: webSubject._id, userId: student._id, title: 'Bcrypt Hashing and Salt Rounds Best Practices', url: '', type: 'article', done: true },
    { topicId: webT3._id, subjectId: webSubject._id, userId: student._id, title: 'OWASP Top 10 Security Checklist', url: 'https://owasp.org', type: 'article', done: true },
  ]);
  await PracticeLog.insertMany([
    { topicId: webT3._id, subjectId: webSubject._id, userId: student._id, correct: true, difficulty: 'medium', notes: 'Auth bearer header extraction and token verification', createdAt: daysAgo(11) },
    { topicId: webT3._id, subjectId: webSubject._id, userId: student._id, correct: false, difficulty: 'hard', notes: 'Role-based authorization middleware edge case', createdAt: daysAgo(9) },
  ]);

  // Topic 3.4: WebSockets & Real-time Communication (Needs Attention, Resources Pending)
  const webT4 = await Topic.create({
    subjectId: webSubject._id,
    userId: student._id,
    title: 'WebSockets & Socket.IO Real-time Communication',
    importance: 2,
    revisionThresholdDays: 14,
    confidence: 2,
    lastActivityAt: null,
  });
  await Resource.insertMany([
    { topicId: webT4._id, subjectId: webSubject._id, userId: student._id, title: 'Socket.IO Official Documentation & Rooms Guide', url: 'https://socket.io/docs/v4/', type: 'doc', done: false },
    { topicId: webT4._id, subjectId: webSubject._id, userId: student._id, title: 'WebSockets vs HTTP Long Polling Comparison', url: '', type: 'article', done: false },
  ]);

  // 6. Collaborative Study Room
  const roomName = 'Distributed Systems & MERN Sprint';
  let room = await StudyRoom.findOne({ name: roomName });
  if (!room) {
    console.log('Seeding collaborative Study Room...');
    await StudyRoom.create({
      name: roomName,
      topic: 'Full Stack Lab Preparation & Viva',
      hostId: student._id,
      activeUserIds: admin ? [student._id, admin._id] : [student._id],
    });
  } else {
    room.activeUserIds = admin ? [student._id, admin._id] : [student._id];
    await room.save();
  }

  console.log('--- Demo Dataset Successfully Seeded! ---');
  console.log(`Demo Student Credentials:
  Email:    ${studentEmail}
  Password: ${studentPassword}
`);
}

// Run if executed directly from node CLI
if (process.argv[1] && process.argv[1].endsWith('seedDemo.js')) {
  seedDemoData()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
