import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const EventContext = createContext(null);
const STORAGE_KEY = 'pathlog-labs-registered-events';

export function EventProvider({ children }) {
  const { token, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeredEventIds, setRegisteredEventIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const loadEvents = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/events', { signal });
      if (!response.ok) throw new Error('Could not load events.');
      const payload = await response.json();
      setEvents(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError(loadError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadEvents(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const validIds = new Set(events.map((event) => event.id));
    setRegisteredEventIds((current) => current.filter((id) => validIds.has(id)));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredEventIds));
  }, [registeredEventIds]);

  const registerForEvent = (id) =>
    setRegisteredEventIds((current) => (current.includes(id) ? current : [...current, id]));

  const unregisterFromEvent = (id) =>
    setRegisteredEventIds((current) => current.filter((eventId) => eventId !== id));

  // Admin Event Operations (with JWT Authorization Bearer header)
  const createEvent = async (eventData) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Failed to create event');
    }

    setEvents((current) => [payload.data, ...current]);
    return payload.data;
  };

  const deleteEvent = async (id) => {
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let msg = 'Failed to delete event';
      try {
        const payload = await response.json();
        msg = payload.message || msg;
      } catch {}
      throw new Error(msg);
    }

    setEvents((current) => current.filter((e) => e.id !== id));
  };

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        error,
        retry: () => loadEvents(new AbortController().signal),
        registeredEventIds,
        registerForEvent,
        unregisterFromEvent,
        isRegistered: (id) => registeredEventIds.includes(id),
        registrationCount: registeredEventIds.length,
        createEvent,
        deleteEvent,
        isAdmin,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvents must be used inside EventProvider');
  return context;
}
