export type Cardinality =
  | "ONE_TO_ONE"
  | "ONE_TO_MANY"
  | "MANY_TO_ONE"
  | "MANY_TO_MANY";

export interface ColumnModel {
  name: string;
  type: string;
  pk: boolean;
  unique: boolean;
  notNull: boolean;
  increment: boolean;
  default?: string;
  note?: string;
  sourceOffset: number;
}

export interface IndexModel {
  columns: string[];
  pk: boolean;
  unique: boolean;
  name?: string;
  sourceOffset: number;
}

export interface TableModel {
  key: string;
  name: string;
  alias?: string;
  note?: string;
  columns: ColumnModel[];
  indexes: IndexModel[];
  sourceOffset: number;
}

export interface EnumModel {
  key: string;
  name: string;
  values: string[];
  sourceOffset: number;
}

export interface RelationModel {
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  cardinality: Cardinality;
  resolved: boolean;
  sourceOffset: number;
}

export interface GroupModel {
  name: string;
  tableKeys: string[];
  sourceOffset: number;
}

export interface SchemaModel {
  tables: TableModel[];
  enums: EnumModel[];
  relations: RelationModel[];
  groups: GroupModel[];
  parseErrorCount: number;
}
