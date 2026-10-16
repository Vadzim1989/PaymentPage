export const getQueryParams = (locationSearch: string): Record<string, string> => {
    const params = new URLSearchParams(locationSearch);
    return Object.fromEntries(params.entries());
};