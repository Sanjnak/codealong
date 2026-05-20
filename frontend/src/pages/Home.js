import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { useEffect } from "react";
import io from 'socket.io-client';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to backend socket:", socket.id);
    });

    // Optional: show if any error
    socket.on("connect_error", (err) => {
      console.error("❌Socket connection error:", err.message);
    });
  }, []);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4(); //unique id
    setRoomId(id);
    if (socket.connected) {
      socket.emit('create-room', id);
    } else {
      socket.once('connect', () => {
        socket.emit('create-room', id);
      });
    }
    toast.success("Successfully room created");
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId || !username) {
      toast.error("Room ID & Username required");
      return;
    }
    console.log("checking for room...");

    navigate(`/EditorPage/${roomId}`,
      { state: { username } });
  };

  const handleInput = (e) => {
    if (e.code === "Enter") {
      joinRoom(e);
    }
  };
  return (
    <div className="flex min-h-screen flex-col justify-center px-3 sm:px-6 py-8 sm:py-12 lg:px-8">
      <img src="/coolbackgrounds-particles-compute.png" alt="" className="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"></img>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mt-6 sm:mt-10 flex items-center justify-center gap-2 sm:gap-3">
          <img src="/logoNew2.png" alt="Logo" className="h-20 sm:h-24 lg:h-30 w-auto" />

        </div>
      </div>

      <div className="mt-8 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-4 sm:space-y-6" onSubmit={joinRoom}>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="roomId" className="block text-xs sm:text-sm/6 font-medium text-white">Room ID</label>
            </div>
            <div className="mt-1 sm:mt-2">
              <input type="text" name="roomId" id="roomId" onKeyUp={handleInput} onChange={(e) => setRoomId(e.target.value)} value={roomId} required className="block w-full rounded-md bg-transparent px-2 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-base text-white outline outline-1 -outline-offset-1 outline-indigo-600 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="username" className="block text-xs sm:text-sm/6 font-medium text-white">Username</label>
            </div>
            <div className="mt-1 sm:mt-2">
              <input type="text" name="username" id="username" onKeyUp={handleInput} onChange={(e) => setUsername(e.target.value)} value={username} required className="block w-full rounded-md bg-transparent px-2 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-base text-white outline outline-1 -outline-offset-1 outline-indigo-600 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>

          <div>
            <button type="submit" onClick={joinRoom} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 sm:py-1.5 text-xs sm:text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 touch-button\">Join</button>
          </div>
        </form>

        <p className="mt-6 sm:mt-10 text-center text-xs sm:text-sm/6 text-gray-200\">
          If u don't have an invite then create
          &nbsp;<a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500" onClick={createNewRoom}>New Room</a>
        </p>
      </div>
    </div>
  );
};

export default Home;