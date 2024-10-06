export const getDbName = (nombre: string): string => {
  const dbName = nombre.replaceAll(' ', '_').toLowerCase();
  return dbName;
};
