export namespace Bill {
  export type Entity = {
    id: string;
    amount: number;
    category: string;
    description: string;
    expenseDate: string;
    createdAt: string;
  };

  export type CreateBatchParams = Omit<Bill.Entity, "id" | "createdAt">[];
}
