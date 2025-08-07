// Mini-ORM Decorators (similar to .NET Entity Framework)

export interface ColumnMetadata {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isRequired?: boolean;
  maxLength?: number;
  isUnique?: boolean;
}

export interface TableMetadata {
  name: string;
  columns: Map<string, ColumnMetadata>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => object;

// Storage for metadata
const tableMetadata = new Map<Constructor, TableMetadata>();

/**
 * Table decorator - marks a class as a database entity
 * @param tableName - The database table name
 */
export function Table(tableName: string) {
  return <T extends Constructor>(ctor: T) => {
    const metadata: TableMetadata = {
      name: tableName,
      columns: new Map()
    };
    
    tableMetadata.set(ctor, metadata);
    return ctor;
  };
}

/**
 * Column decorator - marks a property as a database column
 */
export function Column(options?: {
  name?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  unique?: boolean;
}) {
  return (target: object, propertyKey: string) => {
    const ctor = target.constructor as Constructor;
    
    if (!tableMetadata.has(ctor)) {
      tableMetadata.set(ctor, { name: '', columns: new Map() });
    }
    
    const metadata = tableMetadata.get(ctor);
    if (!metadata) return;
    
    const columnMetadata: ColumnMetadata = {
      name: options?.name || propertyKey,
      type: options?.type || 'text',
      isRequired: options?.required,
      maxLength: options?.maxLength,
      isUnique: options?.unique
    };
    
    metadata.columns.set(propertyKey, columnMetadata);
  };
}

/**
 * PrimaryKey decorator - marks a property as primary key
 */
export function PrimaryKey(options?: { name?: string; type?: string }) {
  return (target: object, propertyKey: string) => {
    const ctor = target.constructor as Constructor;
    
    if (!tableMetadata.has(ctor)) {
      tableMetadata.set(ctor, { name: '', columns: new Map() });
    }
    
    const metadata = tableMetadata.get(ctor);
    if (!metadata) return;
    
    const columnMetadata: ColumnMetadata = {
      name: options?.name || propertyKey,
      type: options?.type || 'uuid',
      isPrimaryKey: true,
      isRequired: true
    };
    
    metadata.columns.set(propertyKey, columnMetadata);
  };
}

/**
 * Get table metadata for a class
 */
export function getTableMetadata(ctor: Constructor): TableMetadata | undefined {
  return tableMetadata.get(ctor);
}
