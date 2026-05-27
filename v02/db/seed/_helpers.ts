export const dateOrNull = (value: string | undefined): Date | null => (value ? new Date(`${value}T00:00:00.000Z`) : null);

export type Source = {
  name: string;
  url: string;
  stand: string;
};

export type WithSources = {
  id: string;
  sources?: readonly Source[];
};
