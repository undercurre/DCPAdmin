import http from "@/api";
import { PORT5 } from "../config/servicePort";
import { Study } from "../interface/study";

/**
 * @name Study模块
 */

// 题目列表
export const createQuestion = (params: Study.CreateQuestionParams) => {
  return http.post<Study.Question>(PORT5 + `/questions`, params);
};

// 创建题目

export const getQuestionList = () => {
  return http.get<Study.Question[]>(PORT5 + `/questions`);
};

// 回答列表
export const createAnswer = (params: Study.CreateAnswerParams) => {
  return http.post<Study.Answer>(PORT5 + `/answers`, params);
};

// 创建回答

export const getAnswerList = () => {
  return http.get<Study.Answer[]>(PORT5 + `/answers`);
};

// 继续答题

export const continueAnswer = (id: string, content: string) => {
  return http.put<Study.Answer>(PORT5 + `/answers/${id}`, { content });
};

// 批改题目

export const correctAnswer = (id: string, params: { description?: string; score: number }) => {
  return http.put<Study.Answer>(PORT5 + `/answers/${id}`, params);
};
