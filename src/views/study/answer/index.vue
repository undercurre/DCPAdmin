<template>
  <div class="card" style="height: 100%">
    <el-table :data="tableData" style="width: 100%; height: 100%" :default-sort="{ prop: 'createdAt', order: 'descending' }">
      <el-table-column prop="question.content" label="问题" />
      <el-table-column fixed prop="content" label="回答" />
      <el-table-column prop="description" label="笔记" />
      <el-table-column prop="score" label="得分" />
      <el-table-column prop="createdAt" label="CreateTime" />
      <el-table-column :fixed="false" label="ToDo">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="go2Correct(scope.row)">打分</el-button>
          <el-button link type="primary" size="small" @click="go2Continue(scope.row)">继续</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="answerDialogVisible"
      :title="fixType === 'continue' ? '继续答题' : '打分'"
      width="1000"
      :before-close="handleClose"
    >
      <el-form :model="answerForm" label-width="auto" style="max-width: 1000px">
        <el-form-item label="题目">
          <el-input type="textarea" autosize resize="none" v-model="answerForm.question" disabled />
        </el-form-item>
        <el-form-item label="答案" v-if="fixType === 'correct'">
          <el-input type="textarea" autosize resize="none" v-model="answerForm.standard" disabled />
        </el-form-item>
        <el-form-item label="作答">
          <el-input type="textarea" autosize resize="none" v-model="answerForm.answer" :disabled="fixType === 'correct'" />
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
import { Study } from "@/api/interface/study";
import { continueAnswer, correctAnswer, getAnswerList } from "@/api/modules/study";

let tableData = ref<Array<Study.Answer>>([]);

const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure to close this dialog?")
    .then(() => {
      done();
    })
    .catch(() => {
      // catch error
    });
};

const answerDialogVisible = ref(false);
const curAnswer = ref<Study.Answer>();
const fixType = ref<"correct" | "continue">("continue");

const openDialog = (row: Study.Answer) => {
  curAnswer.value = row;
  answerForm.answer = row.content;
  answerForm.description = row.description || "";
  answerForm.question = curAnswer.value.question.content;
  answerForm.standard = curAnswer.value.question.standard;
  answerForm.score = curAnswer.value.score;

  answerDialogVisible.value = true;
};

const go2Correct = (row: Study.Answer) => {
  fixType.value = "correct";
  openDialog(row);
};

const go2Continue = (row: Study.Answer) => {
  fixType.value = "continue";
  openDialog(row);
};

let answerForm = reactive({
  question: "",
  standard: "",
  answer: "",
  description: "",
  score: 0
});

const resetAnswerForm = () => {
  answerForm = reactive({
    question: "",
    standard: "",
    answer: "",
    description: "",
    score: 0
  });
};

async function uploadAnswer() {
  if (!curAnswer.value) return;
  let res;
  if (fixType.value === "continue") {
    res = await continueAnswer(curAnswer.value.id, answerForm.answer);
  } else {
    res = await correctAnswer(curAnswer.value.id, { score: answerForm.score, description: answerForm.description });
  }
  if (res.code === 200) {
    ElMessage.success("成功");
    refreshTable();
    answerDialogVisible.value = false;
    resetAnswerForm();
  } else {
    ElMessage.success("失败");
  }
}

const refreshTable = async () => {
  const listRes = await getAnswerList();

  console.log(listRes.data);

  tableData.value = listRes.data;
};

onBeforeMount(async () => {
  refreshTable();
});
</script>
