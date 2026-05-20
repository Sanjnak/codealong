import { React, useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Member from "../components/Member";
import Editor from "../components/Editor";
import socket from "../socket";
import Chat from "./chat";

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;
  const [currentLine, setCurrentLine] = useState(null);
  const [members, setMembers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/", { replace: true });
      return;
    }

    const handleRoomMembers = (clients) => {
      setMembers(clients);
    };

    const joinRoom = () => {
      socket.emit("check-room", roomId, (exists) => {
        if (exists) {
          socket.emit("join-room", { roomId, username });
        } else {
          toast.error("Room doesn't exist");
          navigate("/", { replace: true });
        }
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    socket.on("room-members", handleRoomMembers);

    socket.on("user-joined", (name) => {
      toast.success(`${name} joined the chat`);
    });

    return () => {
      socket.off("room-members");
      socket.off("connect", joinRoom);
      socket.off("user-joined");
    };
  }, [roomId, username, navigate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket.id) {
        socket.emit("leave-room", { roomId, socketId: socket.id });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomId]);

  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    socket.on("input-changed", (newInput) => {
      setInput(newInput);
    });

    socket.on("code-output", (result) => {
      setOutput(result);
    });

    return () => {
      socket.off("input-changed");
      socket.off("code-output");
    };
  }, []);

  const handleRunCode = async () => {
    const languageId = 54;

    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input || "",
        }),
      });

      const result = await response.json();

      const finalOutput = result.output || result.error || "No output received.";
      setOutput(finalOutput);
      socket.emit("code-output", { roomId, output: finalOutput });

    } catch (err) {
      console.error("Run error:", err);
      setOutput("Something went wrong.");
    }
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  const handleSaveCodeFile = async () => {
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "code.cpp";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save code:", error);
    }
  };

  const handleLeaveRoom = () => {
    if (!socket.id) return;
    socket.emit("leave-room", { roomId, socketId: socket.id });
    socket.emit("release-locks", { roomId, exceptLine: currentLine, username });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-gray-900">
      {/* Mobile Menu Buttons */}
      <div className="lg:hidden flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
        <img src="/logoNew2.png" alt="Logo" className="h-8" />
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500"
          >
            {sidebarOpen ? '✕ Panel' : '☰ Panel'}
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500"
          >
            {chatOpen ? '✕ Chat' : '💬 Chat'}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-64 w-full bg-gray-900 text-white p-4 flex flex-col overflow-y-auto no-scrollbar border-r border-gray-700 lg:border-b-0 border-b`}>
        <div className="mb-8 pb-4 border-b border-gray-300 hidden lg:block">
          <img src="/logoNew2.png" alt="Logo" className="h-10 mx-auto" />
        </div>

        <div className="flex-1">
          <p className="text-md font-semibold text-white-400 p-1 ml-3 mb-3">Members</p>
          <div className="flex flex-row flex-wrap">
            {members.map((member) => (
              <Member key={member.socketId} username={member.username} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopyRoomId}
            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Copy Room ID
          </button>
          <button
            onClick={handleSaveCodeFile}
            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save Code File
          </button>
          <button
            onClick={handleLeaveRoom}
            className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            Leave Room
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold mb-2">Input (stdin)</p>
          <textarea
            placeholder="Input (stdin)..."
            className="w-full h-20 lg:h-24 p-2 rounded bg-gray-800 text-white mb-2 resize-none no-scrollbar text-sm"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              socket.emit("input-changed", { roomId, input: e.target.value });
            }}
          />
          <button
            onClick={handleRunCode}
            className="w-full rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 mb-2"
          >
            Run / Compile Code
          </button>
          <p className="text-sm font-semibold mb-2">Output</p>
          <pre className="bg-black text-green-400 p-2 rounded h-32 lg:h-48 overflow-auto no-scrollbar whitespace-pre-wrap text-xs">
            {output}
          </pre>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 h-1/2 lg:h-full overflow-auto bg-gray-100 no-scrollbar">
          <div className="h-full w-full overflow-auto no-scrollbar">
            <Editor
              roomId={roomId}
              username={username}
              onCodeChange={setCode}
              onCurrentLineChange={setCurrentLine}
            />
          </div>
        </div>

        {/* Chat */}
        <div className={`${chatOpen ? 'block' : 'hidden'} lg:block lg:w-80 w-full h-1/2 lg:h-full border-t lg:border-t-0 lg:border-l border-gray-700`}>
          <Chat roomId={roomId} username={username} />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
