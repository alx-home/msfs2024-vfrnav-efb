// /*
//    Create a fake worker thread of IE and other browsers
//    Remember: Only pass in primitives, and there is none of the native security happening
//    Only Supports Dedicated Web Workers
// */
// const isFunction = (f: unknown) => {
//    return typeof f === 'function';
// };

// /* HTTP Request*/
// // const getHTTPObject = () => {
// //    let xmlhttp;
// //    try {
// //       xmlhttp = new XMLHttpRequest();
// //    } catch {
// //       try {
// //          xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
// //       } catch {
// //          xmlhttp = false;
// //       }
// //    }
// //    return xmlhttp;
// // };


// // declare let MyWorker: {
// //    new(_scriptFile: string | URL, _options?: WorkerOptions): Worker;
// //    prototype: Worker;
// // };

// interface MyWorkerI extends Worker {
//    messageListeners: (typeof Worker.prototype.onmessage)[];
//    errorListeners: (typeof Worker.prototype.onmessageerror)[];
// }


// // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
// function MyWorker(this: MyWorkerI, scriptURL: string | URL, options?: WorkerOptions) {
//    // let __fileContent: unknown = null;

//    this.onerror = null;
//    this.messageListeners = [];
//    this.errorListeners = [];


//    // const importScripts = function (...args: unknown[]) {
//    //    // Turn arguments from pseudo-array in to array in order to iterate it
//    //    const params = Array.prototype.slice.call(args);

//    //    for (let i = 0, j = params.length; i < j; i++) {
//    //       const script = document.createElement('script');
//    //       script.src = params[i];
//    //       script.setAttribute('type', 'text/javascript');
//    //       document.getElementsByTagName('head')[0].appendChild(script)
//    //    }
//    // };

//    // const http = getHTTPObject();
//    // http.open("GET", scriptFile, false);
//    // http.send(null);

//    // if (http.readyState === 4) {
//    //    const strResponse = http.responseText;

//    //    if (http.status !== 404 && http.status !== 500) {
//    //       __fileContent = strResponse;
//    //       // IE functions will become delagates of the instance of Worker
//    //       eval(__fileContent as string);
//    //    }
//    // }
// }

// MyWorker.constructor = MyWorker;
// MyWorker.prototype.addEventListener = function (this: MyWorkerI, type: unknown, callback: unknown) {
//    switch (type) {
//       case 'message':
//          this.messageListeners.push(callback as typeof this.onmessage)
//          break;
//       case 'error':
//          this.errorListeners.push(callback as typeof this.onmessageerror)
//          break;
//    }
// };

// MyWorker.constructor = MyWorker;
// MyWorker.prototype.removeEventListener = function (this: MyWorkerI, type: unknown, callback: unknown) {
//    switch (type) {
//       case 'message':
//          this.messageListeners.splice(this.messageListeners.findIndex(value => value === callback), 1);
//          break;
//       case 'error':
//          this.errorListeners.splice(this.errorListeners.findIndex(value => value === callback), 1);
//          break;
//    }
// };

// MyWorker.prototype.postMessage = function (this: MyWorkerI, text: unknown) {
//    new Promise((resolve, reject) => {
//       try {
//          this.messageListeners.forEach(listener => listener?.call(this, { data: text } as MessageEvent));
//          resolve(true);
//       } catch (e) {
//          reject(new Error("onmessage error", { cause: e }));
//       }
//    }).catch(e => {
//       this.errorListeners.forEach(listener => listener?.call(this, e.cause));
//    });
// };

// MyWorker.prototype.onmessage = function (this: MyWorkerI, ev: MessageEvent) {
//    this.messageListeners.forEach(listener => listener?.call(this, ev));
// };

// MyWorker.prototype.onmessageerror = function (this: MyWorkerI, ev: MessageEvent) {
//    this.errorListeners.forEach(listener => listener?.call(this, ev));
// };

// MyWorker.prototype.terminate = function () {

// }

// Worker = MyWorker as unknown as typeof Worker;
// // }