//const backend = ((window as Record<string, any>)['env'] || {})['backend'] || `${window.location.protocol}//${window.location.host}`.replace(window.location.port, '8080') + `/TurniejRejestrator-bcknd/api/`;
const backend = ((window as Record<string, any>)['env'] || {})['backend'] || `${window.location.origin}`;
// export const environment = {
//     production: true,
//     version: '250725_prod',
//     apiUrl: `${backend}`,
// };

export const environment = {
    production: true,
    version: '250917',
    apiUrl: `${backend}/TurniejRejestrator-bcknd/api/`
    
};
