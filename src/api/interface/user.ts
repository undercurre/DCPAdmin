export namespace User {
  export type Entity = {
    id: string;
    username: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
  };

  export interface CreateDTO extends Entity {
    password: string;
    key: string;
  }
}
