export namespace Study {
  export type Question = {
    id: string;
    content: string;
    standard: string;
    createdAt: string;
    updatedAt: string;
  };

  export type Answer = {
    id: string;
    score: number;
    description: null | string;
    content: string;
    createdAt: string;
  };

  export type CreateQuestionParams = {
    content: string;
    standard: string;
  };

  export type CreateAnswerParams = {
    questionId: string;
    content: string;
    score: number;
  };
}
