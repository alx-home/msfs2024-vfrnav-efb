declare global {
   namespace NodeJS {
      interface ProcessEnv {
         REACT_APP_ENVIRONMENT: string;
         NODE_ENV: 'development' | 'production';
         BUILD_TYPE: 'development' | 'production';
         MSFS_EMBEDED: boolean;
      }
   }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { }