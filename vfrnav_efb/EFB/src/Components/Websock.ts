export const simconnect = () => {
   return new Promise<{
      proto: 'vfrnav',
      message: {
         __COUCOU__: true,
         value: string
      }
   }>((resolve, reject) => {
      const socket = new WebSocket("ws://localhost:9002");

      socket.onopen = function () {
         socket.send(JSON.stringify({
            proto: 'vfrnav',
            message: {
               __HELLO_WORLD__: true
            }
         }));
      };

      socket.onmessage = function (event) {
         console.log(`[message] Data received from server: ${event.data}`);
         resolve(event.data);
      };

      socket.onclose = function (event) {
         if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
         } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
         }
      };

      socket.onerror = function (error) {
         reject(new Error(JSON.stringify(error)))
      };
   });
}