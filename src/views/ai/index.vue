<template>
  <div class="card flex flex-col justify-between" style="height: 100%">
    <el-text class="mx-1" size="large">{{ answer }}</el-text>

    <div class="flex">
      <el-input v-model="question" class="flex-1" :rows="2" resize="none" type="textarea" placeholder="Please input" />
      <el-button class="ml-10px h-full" type="primary" @click="submit">submit</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDeepseekTalk } from "@/api/modules/ai";
import { ref } from "vue";

const question = ref("");
const answer = ref("");

const submit = async () => {
  const res = await getDeepseekTalk({ content: question.value });
  answer.value = res.data;
};
</script>
