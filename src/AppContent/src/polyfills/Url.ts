// export { };

// const oldURL = URL;
// function URL2(url: string | URL, base?: string | URL | undefined) {
//    const obj = new oldURL(url, base);
//    let value: string = "null";

//    if (obj.origin !== undefined && obj.origin !== "null") {
//       value = obj.origin
//    } else if (obj.href.startsWith("coui://")) {
//       value = obj.href.split('/').splice(0, 3).join('/');
//    }

//    Object.defineProperty(obj, 'origin', { value: value });
//    return obj;
// }

// Object.assign(URL2, URL);
// URL2.constructor = URL2;

// URL = URL2 as unknown as typeof URL;