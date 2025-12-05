export const splitCsv = (value?: string) =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0) ?? [];

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const sanitizeArray = (values?: string[]) =>
  values?.map((value) => value.trim()).filter((value) => value.length > 0) ?? [];

