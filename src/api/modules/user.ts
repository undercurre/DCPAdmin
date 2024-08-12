import { User } from "@/api/interface/user";
import { PORT1, PORT2 } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 用户管理模块
 */
// 获取用户列表
export const getUserList = () => {
  return http.get<Array<User.Entity>>(PORT2 + `/users`);
};

// 新增用户
export const addUser = (params: User.CreateDTO) => {
  return http.post(PORT2 + `/user/add`, params);
};

// 编辑用户
export const editUser = (params: { id: string }) => {
  return http.post(PORT1 + `/user/edit`, params);
};

// 删除用户
export const deleteUser = (params: { id: string[] }) => {
  return http.post(PORT1 + `/user/delete`, params);
};
