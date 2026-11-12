import { useState, useEffect, useRef } from 'react';
import {
  Users2,
  Plus,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import api from '../services/api';
import { socket } from '../services/socket';

export default function StudyRoomView() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(null);

  // New room modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [creating, setCreating] = useState(false);

  // Synced Study Timer (25 mins = 1500 seconds default)
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Activity Feed
  const [activityFeed, setActivityFeed] = useState([]);

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/study-rooms');
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Timer interval
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            window.clearInterval(timerRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      window.clearInterval(timerRef.current);
    }
    return () => window.clearInterval(timerRef.current);
  }, [timerRunning]);

  // Socket.IO listeners for room sync
  useEffect(() => {
    if (!currentRoom) return;

    const roomId = currentRoom.id || currentRoom._id;
    socket.emit('study:join_room', roomId);

    const handlePeerJoined = (data) => {
      setActivityFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `${data.userName} joined the study room.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
        },
        ...prev,
      ]);
    };

    const handlePeerLeft = (data) => {
      setActivityFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `${data.userName} left the room.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
        },
        ...prev,
      ]);
    };

    const handleTimerUpdate = (data) => {
      if (data.action === 'start') {
        setTimerRunning(true);
      } else if (data.action === 'pause') {
        setTimerRunning(false);
      } else if (data.action === 'reset') {
        setTimerRunning(false);
        setTimerSeconds(1500);
      }
      setActivityFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `${data.senderName} ${data.action}ed the shared study timer.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'timer',
        },
        ...prev,
      ]);
    };

    const handleActivityFeed = (data) => {
      setActivityFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `${data.userName} logged practice for "${data.topicTitle}" (${data.correct ? 'Solved correctly' : 'Needs review'}).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'practice',
        },
        ...prev,
      ]);
    };

    socket.on('study:peer_joined', handlePeerJoined);
    socket.on('study:peer_left', handlePeerLeft);
    socket.on('study:timer_update', handleTimerUpdate);
    socket.on('study:activity_feed', handleActivityFeed);

    return () => {
      socket.emit('study:leave_room', roomId);
      socket.off('study:peer_joined', handlePeerJoined);
      socket.off('study:peer_left', handlePeerLeft);
      socket.off('study:timer_update', handleTimerUpdate);
      socket.off('study:activity_feed', handleActivityFeed);
    };
  }, [currentRoom]);

  // Create room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      setCreating(true);
      const res = await api.post('/api/study-rooms', {
        name: roomName.trim(),
        topic: roomTopic.trim() || 'General Study',
      });
      setIsModalOpen(false);
      setRoomName('');
      setRoomTopic('');
      setCurrentRoom(res.data);
      fetchRooms();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Join room
  const handleJoinRoom = async (room) => {
    try {
      const roomId = room.id || room._id;
      const res = await api.post(`/api/study-rooms/${roomId}/join`);
      setCurrentRoom(res.data);
      setActivityFeed([
        {
          id: Date.now(),
          text: `You joined ${room.name}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
        },
      ]);
    } catch (err) {
      alert(err.message);
    }
  };

  // Leave room
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    try {
      const roomId = currentRoom.id || currentRoom._id;
      await api.post(`/api/study-rooms/${roomId}/leave`);
      setCurrentRoom(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      setCurrentRoom(null);
    }
  };

  // Broadcast Timer actions
  const triggerTimerAction = (action) => {
    const roomId = currentRoom.id || currentRoom._id;
    if (action === 'start') setTimerRunning(true);
    if (action === 'pause') setTimerRunning(false);
    if (action === 'reset') {
      setTimerRunning(false);
      setTimerSeconds(1500);
    }
    socket.emit('study:timer_action', { roomId, action, duration: timerSeconds });
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* If not in a room: Rooms listing */}
      {!currentRoom ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Users2 size={14} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Collaborative Focus
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Live Study Rooms</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Join or host virtual study sessions with synchronized Pomodoro timers, real-time presence, and live practice accountability.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition shrink-0"
            >
              <Plus size={16} /> Create Study Room
            </button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw className="animate-spin text-indigo-600" size={24} />
            </div>
          ) : rooms.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Users2 size={32} className="mx-auto text-indigo-400 mb-2" />
              <h3 className="text-base font-bold text-slate-800">No active study rooms</h3>
              <p className="text-xs text-slate-500 mt-1">
                Be the first to open a room and invite your peers to study together!
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Start a Study Room
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const rid = room.id || room._id;
                const memberCount = room.activeUserIds?.length || 1;
                return (
                  <div
                    key={rid}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                          {room.topic}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          {memberCount} active
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-900">{room.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Host: {room.hostId?.name || 'Fellow Learner'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinRoom(room)}
                      className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                    >
                      Join Room
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* INSIDE ACTIVE STUDY ROOM */
        <div className="space-y-6">
          {/* Room Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  {currentRoom.topic}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{currentRoom.name}</h1>
            </div>

            <button
              type="button"
              onClick={handleLeaveRoom}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
            >
              <LogOut size={14} /> Leave Room
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shared Timer Column (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shared Pomodoro Timer
              </span>

              {/* Countdown Numbers */}
              <div className="mt-4 font-mono text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900">
                {formatTimer(timerSeconds)}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {timerRunning ? 'Focus session in progress...' : 'Timer paused'}
              </p>

              {/* Controls */}
              <div className="mt-6 flex items-center gap-3">
                {timerRunning ? (
                  <button
                    type="button"
                    onClick={() => triggerTimerAction('pause')}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition shadow-sm"
                  >
                    <Pause size={16} /> Pause Timer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerTimerAction('start')}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Play size={16} /> Start Focus Timer
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => triggerTimerAction('reset')}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>

            {/* Live Activity Feed & Participants (1 col) */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Activity Stream
                </h3>
                <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                  {activityFeed.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Room activity will show up here as participants practice.
                    </p>
                  ) : (
                    activityFeed.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-700"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.type.toUpperCase()}</span>
                          <span>{item.time}</span>
                        </div>
                        <p className="mt-1 font-medium">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Study Room</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Deep Work"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Focus Topic / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Algorithms / Concurrency / Finals Prep"
                  value={roomTopic}
                  onChange={(e) => setRoomTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Open Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
