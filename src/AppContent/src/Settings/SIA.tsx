import { sha512 } from "js-sha512";

export const getSIAAuth = (SIAAuth: string, SIAAddr: string) => {
   return btoa(JSON.stringify({ tokenUri: sha512(SIAAuth + "/api/" + SIAAddr.split('/api/')[1]) }));
}