# Code for Submission

## Express app and JSON middleware — `server/app.js`
```js
const app = express();
app.use(cors());
app.use(express.json());
```

## GET and route parameters
```js
app.get('/api/events/:id', (req, res) => {
  const event = events.find((item) => item.id === req.params.id);
  return event ? res.json({ success: true, data: event })
    : res.status(404).json({ success: false, message: 'Event not found' });
});
```

## POST, PUT, DELETE
See the actual implementations in `server/app.js`; they use `req.body`, preserve IDs on PUT, and return 201/200/204 responses.

## Frontend fetch — `src/context/EventContext.jsx`
```js
const response = await fetch('/api/events', { signal });
if (!response.ok) throw new Error('Could not load events.');
const payload = await response.json();
setEvents(Array.isArray(payload.data) ? payload.data : []);
```
