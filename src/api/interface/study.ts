export namespace Study {
  export type Question = {
    id: string;
    content: string;
    standard: string;
    createdAt: string;
    updatedAt: string;
  };

  export type UpdateQuestionParams = {
    id: string;
    content?: string;
    standard?: string;
  };

  export type Answer = {
    id: string;
    score: number;
    description: null | string;
    content: string;
    question: Question;
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

  export type UpdateAnswerParams = {
    content: string;
    score: number;
    description: string;
  };
}
