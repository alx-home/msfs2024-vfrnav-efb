import { isMessage, MessageType } from "@shared/MessageHandler";

export class Manager {
   private id = 2;

   private socket: WebSocket | undefined = undefined;
   private socketTimeout: NodeJS.Timeout | undefined;
   private readonly messageHandler = (message: MessageType) => window.vfrnav_onmessage!(message)
   private serverMessageHandler: ((_id: number, _message: MessageType) => void) | undefined = undefined


   constructor() {
      this.connectToServer();
   }

   public get isServerConnected() {
      return !!this.serverMessageHandler;
   }

   private broadCastMessage(message: MessageType) {
      this.messageHandler?.(message);
      this.serverMessageHandler?.(1, message);
   }

   private sendMessage(id: number, message: MessageType) {
      if (id == this.id) {
         this.messageHandler?.(message);
      } else {
         this.serverMessageHandler?.(id, message);
      }
   }

   postMessage(message: MessageType) {
      if (isMessage('__GET_SERVER_STATE__', message)) {
         this.messageHandler({
            __SERVER_STATE__: true,

            state: !!this.serverMessageHandler
         })
      } else {
         this.serverMessageHandler?.(0, message);
      }
   }

   private connectToServer() {
      if (this.socketTimeout) {
         clearTimeout(this.socketTimeout);
      }
      this.socketTimeout = undefined;

      if (this.socket) {
         this.socket.close();

         // Leave rooms for socket to be correctly closed
         this.socketTimeout = setTimeout(this.connectToServer.bind(this), 1000);
         return;
      }


      const serverPort = location.port;
      this.socket = new WebSocket("ws://localhost:" + serverPort);
      this.id = 2;

      const onClose = () => {
         if (!state.done) {
            state.done = true;
            this.serverMessageHandler = undefined;

            this.messageHandler({
               __SERVER_STATE__: true,

               state: false
            })
            this.messageHandler({
               __EFB_STATE__: true,

               state: false
            })

            this.socket = undefined;
            if (this.socketTimeout) {
               clearTimeout(this.socketTimeout)
            }
            this.socketTimeout = setTimeout(this.connectToServer.bind(this), 5000);
         }
      }

      const state = {
         done: false
      };
      this.socket.onmessage = (event) => {
         const data = (JSON.parse(event.data) as {
            id: number,
            content: MessageType
         });

         if (isMessage("__HELLO_WORLD__", data.content)) {
            console.assert(data.id === 1)
         } else if (isMessage("__SET_ID__", data.content)) {
            console.assert(this.id === 2);
            console.assert(data.id === 1);

            this.id = data.content.__SET_ID__;

            this.serverMessageHandler = (id: number, message: MessageType) => {
               this.socket?.send(JSON.stringify({
                  id: id,
                  content: message
               }))
            };

            this.sendMessage(this.id, {
               "__SERVER_STATE__": true,

               state: true
            });
         } else {
            this.sendMessage(this.id, data.content)
         }
      };

      this.socket.onclose = () => {
         onClose()
      };

      this.socket.onerror = () => {
         onClose();
      }

      this.socket.onopen = () => {
         this.socket?.send(JSON.stringify({
            __HELLO_WORLD__: "Web"
         }));
      };
   }
};
