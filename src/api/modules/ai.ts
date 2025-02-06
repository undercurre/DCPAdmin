import http from "@/api";
import { PORT4 } from "../config/servicePort";
import { AI } from "../interface/ai";

/**
 * @name AI模块
 */

// 交流
export const getDeepseekTalk = (params: AI.AskQuestionParams) => {
  return http.post<AI.Message>(PORT4 + `/deepseek/completion`, params);
};
