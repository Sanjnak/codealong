import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  transports: ['websocket', 'polling']
});
console.log("COnnecting to : ", process.env.REACT_APP_BACKEND_URL);

export default socket;
