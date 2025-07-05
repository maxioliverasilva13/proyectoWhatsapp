export const getDbName = (nombre: string): string => {
  const dbName = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '') 
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();

  return dbName;
};
