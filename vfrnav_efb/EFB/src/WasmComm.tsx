
const CommbusLoaded = new Promise<void>((resolve) => {
   Include.addScript("/JS/Services/CommBus.js", () => {
      resolve();
   });
});

export class WasmComm {
   private readonly commBusListener = CommbusLoaded.then(() => {
      return new Promise<CommBusListener>((resolve) => {
         const listener = RegisterCommBusListener(() => {

            const callback = (data: string) => {
               listener.off("VFRNAV_WASM_INIT", callback);

               if (data.startsWith("error:")) {
                  console.error(`WASM initialization failed with error: ${data.substring(6)}`);
                  return;
               } else if (!data.startsWith("data:")) {
                  console.error(`Received unexpected initialization data from WASM: ${data}`);
                  return;
               }

               const id = +data.substring(5);
               if (isNaN(id)) {
                  console.error(`Received malformed initialization data from WASM: ${data}`);
                  return;
               }

               this.nextRequestId = id;
               listener.on("VFRNAV_WASM_RESPONSE", (data: string) => {
                  const sepIndex = data.indexOf(":");

                  if (sepIndex === -1) {
                     console.error(`Received malformed response from WASM: ${data}`);
                     return;
                  }

                  const responseId = +data.substring(0, sepIndex);
                  const responseData = data.substring(sepIndex + 1);

                  const pending = this.pendingResponses.get(responseId);
                  if (pending) {
                     this.pendingResponses.delete(responseId);
                     if (responseData.startsWith("error:")) {
                        pending.reject(responseData.substring(6));
                     } else if (responseData.startsWith("data:")) {
                        pending.resolve(responseData.substring(5));
                     } else {
                        pending.reject(`Received response with unexpected format: ${responseData}`);
                     }
                  }
               });

               resolve(listener);
            };
            listener.on("VFRNAV_WASM_INIT", callback);
            listener.callWasm("VFRNAV_WASM_INIT", `${this.nextRequestId}:init`);
         });
      });
   });
   private readonly pendingResponses = new Map<number, { resolve: (_response: string) => void, reject: (_error: string) => void }>();
   private nextRequestId = 0;

   async callWasm(eventName: string, data: string): Promise<string | undefined> {
      const listener = await this.commBusListener;
      const requestId = ++this.nextRequestId;
      const responsePromise = new Promise<string>((resolve, reject) => {
         this.pendingResponses.set(requestId, { resolve, reject });
      });

      listener.callWasm(eventName, `${requestId}:${data}`);
      return responsePromise;
   }

   async on(eventName: string, handler: (_data: string) => void) {
      const listener = await this.commBusListener;
      listener.on(eventName, handler);
   }

   async off(eventName: string, handler: (_data: string) => void) {
      const listener = await this.commBusListener;
      listener.off(eventName, handler);
   }
};