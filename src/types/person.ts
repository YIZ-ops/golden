export type PersonRole = 'author' | 'singer';

export interface PersonListItem {
  id: string;
  name: string;
  role: PersonRole;
  quoteCount: number;
}
