// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
export const environment = {
  production: false,
  googleDrive: {
    clientId: '609514006456-lo7013b0jqsq81hn67lb0c1mjj6o6pqf.apps.googleusercontent.com',
    redirectUri: 'io.ionic.starter:/oauth2redirect',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
