export type BackgroundLocation = {
  pathname: string;
  search: string;
  hash: string;
};

export function toBackgroundLocation(location: {
  pathname: string;
  search: string;
  hash: string;
}): BackgroundLocation {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
}