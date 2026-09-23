const backend = ((window as Record<string, any>)['env'] || {})['backend'] || `${window.location.protocol}//${window.location.host}`.replace(window.location.port, '8080') + `/TurniejRejestrator-bcknd/api/`;

export const environment = {
    production: false,
    version: '250725_dev',
    apiUrl: `${backend}`,
};
