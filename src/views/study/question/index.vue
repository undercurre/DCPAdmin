<template>
  <div class="card" style="height: 100%">
    <div class="flex items-center justify-between px-10px">
      <h3>试题管理</h3>
      <el-button type="primary" @click="dialogVisible = true">题目录入</el-button>
    </div>
    <el-table :data="tableData" style="width: 100%; height: 100%">
      <el-table-column prop="content" label="题目" width="240" />
      <el-table-column prop="standard" label="答案" width="120" />
      <el-table-column prop="createdAt" label="CreateTime" width="320" />
      <el-table-column :fixed="false" label="ToDo" min-width="120">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="go2Answer(scope.row)">刷它</el-button>
          <el-button link type="danger" size="small" @click="go2Answer(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" title="题目录入" width="1000" :before-close="handleClose">
      <el-form :model="form" label-width="auto" style="max-width: 1000px">
        <el-form-item label="题目">
          <el-input type="textarea" autosize resize="none" v-model="form.content" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input type="textarea" autosize resize="none" v-model="form.standard" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="uploadData"> Confirm </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="answerDialogVisible" title="答题" width="1000" :before-close="handleClose">
      <el-form :model="answerForm" label-width="auto" style="max-width: 1000px">
        <el-form-item label="题目">
          <el-input type="textarea" autosize resize="none" v-model="answerForm.question" disabled />
        </el-form-item>
        <el-form-item label="作答">
          <el-input type="textarea" autosize resize="none" v-model="answerForm.answer" />
        </el-form-item>
        <el-form-item label="打分">
          <el-input-number v-model="answerForm.score" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="answerDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="uploadAnswer"> Confirm </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, reactive, ref } from "vue";

import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { createAnswer, createQuestion, getQuestionList } from "@/api/modules/study";
import { Study } from "@/api/interface/study";

let tableData = ref<Array<Study.Question>>([]);

const dialogVisible = ref(false);

const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure to close this dialog?")
    .then(() => {
      done();
    })
    .catch(() => {
      // catch error
    });
};

let form = reactive({
  content: "",
  standard: ""
});

const resetForm = () => {
  form = reactive({
    content: "",
    standard: ""
  });
};

async function uploadData() {
  const res = await createQuestion({ content: form.content, standard: form.standard });
  if (res.code === 200) {
    ElMessage.success("成功");
    dialogVisible.value = false;
    refreshTable();
    resetForm();
  } else {
    ElMessage.success("失败");
  }
}

const answerDialogVisible = ref(false);
const curAnswerQuestion = ref<Study.Question>();

const go2Answer = (row: Study.Question) => {
  curAnswerQuestion.value = row;
  answerForm.question = row.content;
  answerDialogVisible.value = true;
};

let answerForm = reactive({
  question: "",
  answer: "",
  score: 0
});

const resetAnswerForm = () => {
  answerForm = reactive({
    question: "",
    answer: "",
    score: 0
  });
};

async function uploadAnswer() {
  if (!curAnswerQuestion.value) return;
  const res = await createAnswer({ content: answerForm.answer, questionId: curAnswerQuestion.value.id, score: answerForm.score });
  if (res.code === 200) {
    ElMessage.success("成功");
    answerDialogVisible.value = false;
    resetAnswerForm();
  } else {
    ElMessage.success("失败");
  }
}

const refreshTable = async () => {
  const listRes = await getQuestionList();

  console.log(listRes.data);

  tableData.value = listRes.data;
};

onBeforeMount(async () => {
  refreshTable();
});
</script>
