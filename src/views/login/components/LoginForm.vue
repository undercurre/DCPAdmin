<template>
  <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
    <el-form-item prop="username">
      <el-input v-model="loginForm.username" placeholder="用户名：admin / user">
        <template #prefix>
          <el-icon class="el-input__icon">
            <user />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="password">
      <el-input v-model="loginForm.password" type="password" placeholder="密码：123456" show-password autocomplete="new-password">
        <template #prefix>
          <el-icon class="el-input__icon">
            <lock />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
  </el-form>
  <div class="login-btn">
    <el-button :icon="CircleClose" round size="large" @click="resetForm(loginFormRef)"> 重置 </el-button>
    <el-button :icon="UserFilled" round size="large" type="primary" :loading="loading" @click="login(loginFormRef)">
      登录
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { HOME_URL } from "@/config";
import { getTimeState } from "@/utils";
import { Login } from "@/api/interface";
import { ElNotification } from "element-plus";
import { getPublicKey, loginApi } from "@/api/modules/login";
import { useUserStore } from "@/stores/modules/user";
import { useTabsStore } from "@/stores/modules/tabs";
import { useKeepAliveStore } from "@/stores/modules/keepAlive";
import { initDynamicRouter } from "@/routers/modules/dynamicRouter";
import { CircleClose, UserFilled } from "@element-plus/icons-vue";
import type { ElForm } from "element-plus";
import CryptoJS from "crypto-js";
import * as forge from "node-forge";

const router = useRouter();
const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();

type FormInstance = InstanceType<typeof ElForm>;
const loginFormRef = ref<FormInstance>();
const loginRules = reactive({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
});

const loading = ref(false);
const loginForm = reactive<Login.ReqLoginForm>({
  username: "",
  password: "",
  key: "",
  iv: ""
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let publicKey = "";

// login
const login = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async valid => {
    if (!valid) return;
    loading.value = true;
    try {
      // 生成随机对称密钥
      const symmetricKey = CryptoJS.lib.WordArray.random(32);
      const symmetricKeyStr = CryptoJS.enc.Base64.stringify(symmetricKey);

      console.log("生成随机对称密钥", symmetricKeyStr);

      // 对密码进行哈希
      const hashedPassword = CryptoJS.SHA256(loginForm.password).toString();

      console.log("对密码进行哈希", hashedPassword);

      // 使用对称密钥加密哈希后的密码
      const iv = CryptoJS.lib.WordArray.random(16);
      const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
      console.log("iv:", ivBase64);
      const encryptedPassword = CryptoJS.AES.encrypt(hashedPassword, symmetricKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC, // 使用 CBC 模式
        padding: CryptoJS.pad.Pkcs7
      }).toString();

      console.log("使用对称密钥加密哈希后的密码", encryptedPassword);

      // 使用公钥加密对称密钥
      const encryptedSymmetricKey = await encryptDataWithPem(publicKey, symmetricKeyStr);

      console.log("使用公钥加密对称密钥", encryptedSymmetricKey);

      // 1.执行登录接口
      const { data } = await loginApi({ ...loginForm, password: encryptedPassword, key: encryptedSymmetricKey, iv: ivBase64 });
      userStore.setToken(data.access_token);

      // 2.添加动态路由
      await initDynamicRouter();

      // 3.清空 tabs、keepAlive 数据
      tabsStore.setTabs([]);
      keepAliveStore.setKeepAliveName([]);

      // 4.跳转到首页
      router.push(HOME_URL);
      ElNotification({
        title: getTimeState(),
        message: "欢迎登录 DCPAdmin",
        type: "success",
        duration: 3000
      });
    } finally {
      loading.value = false;
    }
  });
};

async function encryptDataWithPem(publicKeyPem: string, data: string): Promise<string> {
  const key = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedData = key.encrypt(data, "RSA-OAEP");

  return forge.util.encode64(encryptedData);
}
// resetForm
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

onMounted(() => {
  // 监听 enter 事件（调用登录）
  document.onkeydown = (e: KeyboardEvent) => {
    e = (window.event as KeyboardEvent) || e;
    if (e.code === "Enter" || e.code === "enter" || e.code === "NumpadEnter") {
      if (loading.value) return;
      login(loginFormRef.value);
    }
  };
});

onBeforeMount(async () => {
  const publicKeyRes = await getPublicKey();
  publicKey = publicKeyRes.data.publicKey;
});

onBeforeUnmount(() => {
  document.onkeydown = null;
});
</script>

<style scoped lang="scss">
@import "../index";
</style>
