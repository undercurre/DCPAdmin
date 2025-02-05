import http from "@/api";
import { Bill } from "../interface/bill";
import { PORT3 } from "../config/servicePort";

/**
 * @name 账单管理模块
 */
// 获取账单列表
export const getBillList = () => {
  return http.get<Array<Bill.Entity>>(PORT3 + `/daily-expenses`);
};
// 创建账单
export const createBill = () => {
  return http.post<Bill.Entity>(PORT3 + `/daily-expenses`);
};
// 创建批量账单
export const createBatchBill = (params: Bill.CreateBatchParams) => {
  return http.post<Bill.Entity[]>(PORT3 + `/daily-expenses/create/batch`, params);
};
// 获取某一账单
export const getBillItem = () => {
  return http.get<Bill.Entity>(PORT3 + `/daily-expenses`);
};
// 删除账单
export const delBillItem = () => {
  return http.delete(PORT3 + `/daily-expenses`);
};
